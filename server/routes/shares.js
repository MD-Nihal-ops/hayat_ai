const express = require("express");
const {
  expiryTimestamp,
  hasValidConsent,
  isValidExpiry,
  revokeConsent
} = require("../services/consentLedger");

function getDefaultDatabase() {
  return require("../database");
}

const emailPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

function validEmail(value) {
  if (typeof value !== "string" || value.length > 254 || !emailPattern.test(value)) return false;
  const localPart = value.split("@")[0];
  return !localPart.startsWith(".") && !localPart.endsWith(".") && !localPart.includes("..");
}

function maskEmail(email) {
  const [name, domain] = String(email || "").split("@");
  if (!name || !domain) return "";
  return `${name.slice(0, 1)}***@${domain}`;
}

async function writeAccessLog({
  ownerId, viewerId = null, viewerEmail = null, reportId, action, details, databaseClient = getDefaultDatabase()
}) {
  await databaseClient.run(
    `INSERT INTO accessLog
      (userId, ownerId, viewerId, viewerEmail, reportId, action, details, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    ownerId,
    ownerId,
    viewerId,
    viewerEmail,
    reportId,
    action,
    details
  );
}

function createSharesRouter(databaseClient = getDefaultDatabase()) {
  const router = express.Router();

  router.post("/", async (req, res, next) => {
  const { email, reportId, includeOriginal, expiresAt, consentId } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const numericReportId = Number(reportId);
  if (!validEmail(normalizedEmail) || !Number.isInteger(numericReportId) || numericReportId <= 0 ||
      typeof includeOriginal !== "boolean" || !isValidExpiry(expiresAt) ||
      typeof consentId !== "string" || consentId.length > 64) {
    return res.status(400).json({ error: "Enter a valid email, report, and optional future end date" });
  }

  try {
    const owner = await databaseClient.get("SELECT email FROM users WHERE id = ?", req.userId);
    if (!owner) return res.status(401).json({ error: "Please log in again" });
    if (owner.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({ error: "You cannot share a report with your own email" });
    }

    const report = await databaseClient.get(
      "SELECT id, status FROM reports WHERE id = ? AND userId = ?",
      numericReportId,
      req.userId
    );
    if (!report) return res.status(404).json({ error: "Document not found" });
    if (report.status !== "confirmed") {
      return res.status(400).json({ error: "Only confirmed reports can be shared" });
    }
    const consentIsValid = await hasValidConsent(databaseClient, {
      consentId,
      userId: req.userId,
      recipient: normalizedEmail,
      resourceId: numericReportId,
      includeOriginal,
      expiresAt: expiryTimestamp(expiresAt)
    });
    if (!consentIsValid) return res.status(403).json({ error: "A current matching consent is required" });

    const result = await databaseClient.run(
      `INSERT INTO shares (ownerId, sharedWithEmail, reportId, status, includeOriginal, consentId, createdAt, expiresAt)
       VALUES (?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, ?)`,
      req.userId,
      normalizedEmail,
      numericReportId,
      includeOriginal ? 1 : 0,
      consentId,
      expiryTimestamp(expiresAt)
    );
    await writeAccessLog({
      ownerId: req.userId,
      viewerEmail: normalizedEmail,
      reportId: numericReportId,
      action: "share_created",
      details: includeOriginal ? "Original document included" : "Original document not included",
      databaseClient
    });
    return res.status(201).json({ id: result.lastID, email: normalizedEmail, expiresAt: expiryTimestamp(expiresAt) });
  } catch (error) {
    if (
      error.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      error.message.includes("UNIQUE constraint failed: shares.ownerId, shares.sharedWithEmail, shares.reportId") ||
      error.message.includes("shares_active_owner_email_report")
    ) {
      return res.status(409).json({ error: "This report is already shared with that email" });
    }
    return next(error);
  }
  });

  router.get("/mine", async (req, res, next) => {
  try {
    const rows = await databaseClient.all(
      `SELECT s.id, s.sharedWithEmail, s.reportId, s.includeOriginal, s.createdAt, s.expiresAt, s.status,
              r.type AS reportType, r.createdAt AS reportDate
       FROM shares s LEFT JOIN reports r ON r.id = s.reportId AND r.userId = s.ownerId
       WHERE s.ownerId = ? ORDER BY s.createdAt DESC, s.id DESC`,
      req.userId
    );
    return res.json(rows.map((row) => ({
      ...row,
      includeOriginal: row.includeOriginal === 1,
      reportType: row.reportType || "deleted"
    })));
  } catch (error) {
    return next(error);
  }
  });

  router.get("/with-me", async (req, res, next) => {
  try {
    const viewer = await databaseClient.get("SELECT email FROM users WHERE id = ?", req.userId);
    if (!viewer) return res.status(401).json({ error: "Please log in again" });
    const rows = await databaseClient.all(
      `SELECT s.id, r.type AS reportType, r.createdAt AS reportDate,
              p.fullName AS ownerName, owner.email AS ownerEmail
       FROM shares s
       JOIN reports r ON r.id = s.reportId AND r.userId = s.ownerId AND r.status = 'confirmed'
       JOIN users owner ON owner.id = s.ownerId
       JOIN consents c ON c.consentId = s.consentId AND c.userId = s.ownerId AND c.resourceId = s.reportId
       LEFT JOIN profiles p ON p.userId = s.ownerId
       WHERE lower(s.sharedWithEmail) = lower(?)
         AND s.status = 'active'
         AND c.status = 'granted'
         AND c.purpose = 'family_report_sharing'
         AND c.recipientType = 'person'
         AND lower(c.recipient) = lower(s.sharedWithEmail)
         AND (c.expiresAt IS NULL OR datetime(c.expiresAt) > CURRENT_TIMESTAMP)
         AND (s.expiresAt IS NULL OR datetime(s.expiresAt) > CURRENT_TIMESTAMP)
       ORDER BY s.createdAt DESC, s.id DESC`,
      viewer.email
    );
    return res.json(rows.map((row) => ({
      id: row.id,
      reportType: row.reportType,
      reportDate: row.reportDate,
      ownerName: row.ownerName?.trim() || maskEmail(row.ownerEmail)
    })));
  } catch (error) {
    return next(error);
  }
  });

  router.delete("/:id", async (req, res, next) => {
  const shareId = Number(req.params.id);
  if (!Number.isInteger(shareId) || shareId <= 0) return res.status(404).json({ error: "Share not found" });
  try {
    const share = await databaseClient.get(
      "SELECT id, reportId, status, sharedWithEmail, consentId FROM shares WHERE id = ? AND ownerId = ?",
      shareId,
      req.userId
    );
    if (!share) return res.status(404).json({ error: "Share not found" });
    if (share.status === "active") {
      if (share.consentId) await revokeConsent(databaseClient, req.userId, share.consentId);
      await databaseClient.run(
        "UPDATE shares SET status = 'revoked', revokedAt = CURRENT_TIMESTAMP WHERE id = ? AND ownerId = ? AND status = 'active'",
        shareId,
        req.userId
      );
      await databaseClient.run("DELETE FROM sharedQuestions WHERE shareId = ?", shareId);
      await writeAccessLog({
        ownerId: req.userId,
        viewerEmail: share.sharedWithEmail,
        reportId: share.reportId,
        action: "share_revoked",
        details: "Report sharing stopped",
        databaseClient
      });
    }
    return res.json({ revoked: true });
  } catch (error) {
    return next(error);
  }
  });

  return router;
}

module.exports = { createSharesRouter, writeAccessLog };
