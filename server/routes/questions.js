const express = require("express");
const { getValidShare } = require("./shared");
const { writeAccessLog } = require("./shares");

function maskEmail(email) {
  const [name, domain] = String(email || "").split("@");
  return name && domain ? `${name.slice(0, 1)}***@${domain}` : "";
}

async function getReportAccess(databaseClient, reportId, userId) {
  const ownedReport = await databaseClient.get(
    "SELECT id, userId FROM reports WHERE id = ? AND userId = ?",
    reportId,
    userId
  );
  if (ownedReport) return { ownerId: ownedReport.userId, shareId: null, isOwner: true };

  const viewer = await databaseClient.get("SELECT email FROM users WHERE id = ?", userId);
  if (!viewer) return null;
  const shares = await databaseClient.all(
    `SELECT id FROM shares
     WHERE reportId = ? AND lower(sharedWithEmail) = lower(?) AND status = 'active'
     ORDER BY id DESC`,
    reportId,
    viewer.email
  );
  for (const share of shares) {
    const validShare = await getValidShare(databaseClient, share.id, userId);
    if (validShare) return { ownerId: validShare.ownerId, shareId: validShare.id, isOwner: false };
  }
  return null;
}

function createQuestionsRouter(databaseClient = require("../database")) {
  const router = express.Router();

  router.get("/report/:reportId", async (req, res, next) => {
    const reportId = Number(req.params.reportId);
    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({ error: "Report ID is invalid" });
    }
    try {
      const access = await getReportAccess(databaseClient, reportId, req.userId);
      if (!access) return res.status(403).json({ error: "Report access is not allowed" });
      const questions = await databaseClient.all(
        `SELECT id, authorName, text, resolved, createdAt
         FROM sharedQuestions WHERE ownerId = ? AND reportId = ?
         ORDER BY createdAt, id`,
        access.ownerId,
        reportId
      );
      if (!await getReportAccess(databaseClient, reportId, req.userId)) {
        return res.status(403).json({ error: "Report access is not allowed" });
      }
      return res.json(questions.map((question) => ({
        ...question,
        resolved: question.resolved === 1
      })));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/report/:reportId", async (req, res, next) => {
    const reportId = Number(req.params.reportId);
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({ error: "Report ID is invalid" });
    }

    try {
      const access = await getReportAccess(databaseClient, reportId, req.userId);
      if (!access) return res.status(403).json({ error: "Report access is not allowed" });
      if (text.length < 1 || text.length > 300) {
        return res.status(400).json({ error: "Question must contain 1 to 300 characters" });
      }
      const author = await databaseClient.get(
        `SELECT u.email, p.fullName
         FROM users u LEFT JOIN profiles p ON p.userId = u.id
         WHERE u.id = ?`,
        req.userId
      );
      if (!author) return res.status(401).json({ error: "Please log in again" });
      const authorName = author.fullName?.trim() || maskEmail(author.email);

      await databaseClient.run("BEGIN IMMEDIATE");
      try {
        const accessStillValid = access.isOwner
          ? await databaseClient.get(
            "SELECT id FROM reports WHERE id = ? AND userId = ?",
            reportId,
            access.ownerId
          )
          : await databaseClient.get(
            `SELECT s.id FROM shares s
             JOIN reports r ON r.id = s.reportId AND r.userId = s.ownerId AND r.status = 'confirmed'
             JOIN consents c ON c.consentId = s.consentId AND c.userId = s.ownerId
             WHERE s.id = ? AND s.reportId = ? AND s.ownerId = ?
               AND s.status = 'active'
               AND lower(s.sharedWithEmail) = lower(?)
               AND (s.expiresAt IS NULL OR datetime(s.expiresAt) > CURRENT_TIMESTAMP)
               AND c.status = 'granted' AND c.purpose = 'family_report_sharing'
               AND c.resourceId = s.reportId
               AND c.recipientType = 'person'
               AND lower(c.recipient) = lower(s.sharedWithEmail)
               AND (c.expiresAt IS NULL OR datetime(c.expiresAt) > CURRENT_TIMESTAMP)`,
            access.shareId,
            reportId,
            access.ownerId,
            author.email
          );
        if (!accessStillValid) {
          await databaseClient.run("ROLLBACK");
          return res.status(403).json({ error: "Report access is not allowed" });
        }
        const total = await databaseClient.get(
          "SELECT COUNT(*) AS count FROM sharedQuestions WHERE ownerId = ? AND reportId = ?",
          access.ownerId,
          reportId
        );
        if (total.count >= 20) {
          await databaseClient.run("ROLLBACK");
          return res.status(409).json({ error: "This report already has the maximum number of questions" });
        }
        const authored = await databaseClient.get(
          `SELECT COUNT(*) AS count FROM sharedQuestions
           WHERE ownerId = ? AND reportId = ? AND authorId = ?`,
          access.ownerId,
          reportId,
          req.userId
        );
        if (authored.count >= 5) {
          await databaseClient.run("ROLLBACK");
          return res.status(409).json({ error: "You have reached the question limit for this report" });
        }

        const inserted = await databaseClient.run(
          `INSERT INTO sharedQuestions
             (ownerId, reportId, authorId, authorEmail, authorName, text, shareId)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          access.ownerId,
          reportId,
          req.userId,
          author.email,
          authorName,
          text,
          access.shareId
        );
        await writeAccessLog({
          ownerId: access.ownerId,
          viewerId: access.isOwner ? null : req.userId,
          viewerEmail: access.isOwner ? null : author.email,
          reportId,
          action: "question_added",
          details: "Question added to a shared report",
          databaseClient
        });
        await databaseClient.run("COMMIT");
        return res.status(201).json({
          id: inserted.lastID,
          authorName,
          text,
          resolved: false,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        await databaseClient.run("ROLLBACK");
        throw error;
      }
    } catch (error) {
      return next(error);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    const questionId = Number(req.params.id);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return res.status(403).json({ error: "Question access is not allowed" });
    }
    try {
      const question = await databaseClient.get(
        "SELECT id, ownerId FROM sharedQuestions WHERE id = ?",
        questionId
      );
      if (!question || question.ownerId !== req.userId) {
        return res.status(403).json({ error: "Only the report owner can update a question" });
      }
      if (typeof req.body?.resolved !== "boolean") {
        return res.status(400).json({ error: "A resolved status is required" });
      }
      const result = await databaseClient.run(
        `UPDATE sharedQuestions SET resolved = ?
         WHERE id = ? AND ownerId = ?`,
        req.body.resolved ? 1 : 0,
        questionId,
        req.userId
      );
      if (!result.changes) return res.status(403).json({ error: "Question access is not allowed" });
      return res.json({ id: questionId, resolved: req.body.resolved });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    const questionId = Number(req.params.id);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return res.status(403).json({ error: "Question access is not allowed" });
    }
    try {
      const question = await databaseClient.get(
        `SELECT id, ownerId, reportId, authorId
         FROM sharedQuestions WHERE id = ?`,
        questionId
      );
      if (!question) return res.status(403).json({ error: "Question access is not allowed" });
      if (question.ownerId !== req.userId) {
        const access = await getReportAccess(databaseClient, question.reportId, req.userId);
        if (!access) return res.status(403).json({ error: "Report access is not allowed" });
        if (question.authorId !== req.userId) {
          return res.status(403).json({ error: "Only the author or report owner can delete this question" });
        }
        const viewer = await databaseClient.get("SELECT email FROM users WHERE id = ?", req.userId);
        if (!viewer) return res.status(401).json({ error: "Please log in again" });
        await databaseClient.run("BEGIN IMMEDIATE");
        try {
          const stillAuthorized = await databaseClient.get(
            `SELECT s.id FROM shares s
             JOIN reports r ON r.id = s.reportId AND r.userId = s.ownerId AND r.status = 'confirmed'
             JOIN consents c ON c.consentId = s.consentId AND c.userId = s.ownerId
             WHERE s.id = ? AND s.reportId = ? AND s.ownerId = ? AND s.status = 'active'
               AND lower(s.sharedWithEmail) = lower(?)
               AND (s.expiresAt IS NULL OR datetime(s.expiresAt) > CURRENT_TIMESTAMP)
               AND c.status = 'granted' AND c.purpose = 'family_report_sharing'
               AND c.resourceId = s.reportId AND c.recipientType = 'person'
               AND lower(c.recipient) = lower(s.sharedWithEmail)
               AND (c.expiresAt IS NULL OR datetime(c.expiresAt) > CURRENT_TIMESTAMP)`,
            access.shareId,
            question.reportId,
            question.ownerId,
            viewer.email
          );
          if (!stillAuthorized) {
            await databaseClient.run("ROLLBACK");
            return res.status(403).json({ error: "Report access is not allowed" });
          }
          await databaseClient.run("DELETE FROM sharedQuestions WHERE id = ?", questionId);
          await databaseClient.run("COMMIT");
          return res.json({ deleted: true });
        } catch (error) {
          await databaseClient.run("ROLLBACK");
          throw error;
        }
      }
      await databaseClient.run("DELETE FROM sharedQuestions WHERE id = ?", questionId);
      return res.json({ deleted: true });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createQuestionsRouter, getReportAccess };
