const express = require("express");
const database = require("../database");
const { explainReport } = require("../services/explain");

const router = express.Router();
const supportedLanguages = new Set(["en", "ar", "hi", "ml"]);

function parseStep(row) {
  return {
    ...row,
    documents: JSON.parse(row.documents || "[]"),
    done: row.done === 1
  };
}

async function ownedReport(userId, reportId) {
  return database.get(
    "SELECT id, type, status, extractedValues, explanations FROM reports WHERE id = ? AND userId = ?",
    reportId,
    userId
  );
}

async function saveSteps(userId, reportId, steps) {
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    await database.run(
      `INSERT INTO referralSteps (userId, reportId, text, documents, done, sortOrder)
       VALUES (?, ?, ?, ?, 0, ?)`,
      userId,
      reportId,
      step.text.trim(),
      JSON.stringify(step.documents.map((document) => document.trim()).filter(Boolean)),
      index
    );
  }
}

router.post("/from-report/:reportId", async (req, res, next) => {
  const reportId = Number(req.params.reportId);
  if (!Number.isInteger(reportId) || reportId <= 0) return res.status(400).json({ error: "Invalid reportId" });
  const language = supportedLanguages.has(req.body?.language) ? req.body.language : "en";
  try {
    const report = await ownedReport(req.userId, reportId);
    if (!report || report.type !== "referral_letter" || report.status !== "confirmed") {
      return res.status(404).json({ error: "Confirmed referral letter not found" });
    }

    let rows = await database.all(
      "SELECT * FROM referralSteps WHERE userId = ? AND reportId = ? ORDER BY sortOrder, id",
      req.userId,
      reportId
    );
    if (rows.length) return res.json(rows.map(parseStep));

    let explanations;
    try {
      explanations = JSON.parse(report.explanations || "{}");
    } catch (error) {
      return next(error);
    }
    let explanation = Object.values(explanations).find((candidate) =>
      candidate && Array.isArray(candidate.steps)
    );
    if (!explanation) {
      try {
        explanation = await explainReport({
          reportType: report.type,
          language,
          extractedValues: JSON.parse(report.extractedValues || "[]")
        });
      } catch (error) {
        console.error("[referrals] explanation failed:", error?.name || "Error");
        return res.status(503).json({
          error: "Referral steps unavailable",
          detail: "The AI is very busy right now. Please wait a minute and try again."
        });
      }
      explanations[language] = explanation;
      await database.run(
        "UPDATE reports SET explanations = ? WHERE id = ? AND userId = ?",
        JSON.stringify(explanations),
        reportId,
        req.userId
      );
    }
    await saveSteps(req.userId, reportId, explanation.steps);
    rows = await database.all(
      "SELECT * FROM referralSteps WHERE userId = ? AND reportId = ? ORDER BY sortOrder, id",
      req.userId,
      reportId
    );
    return res.status(201).json(rows.map(parseStep));
  } catch (error) {
    return next(error);
  }
});

router.get("/:reportId", async (req, res, next) => {
  const reportId = Number(req.params.reportId);
  if (!Number.isInteger(reportId) || reportId <= 0) return res.status(400).json({ error: "Invalid reportId" });
  try {
    const report = await ownedReport(req.userId, reportId);
    if (!report || report.type !== "referral_letter" || report.status !== "confirmed") {
      return res.status(404).json({ error: "Confirmed referral letter not found" });
    }
    const rows = await database.all(
      "SELECT * FROM referralSteps WHERE userId = ? AND reportId = ? ORDER BY sortOrder, id",
      req.userId,
      reportId
    );
    return res.json(rows.map(parseStep));
  } catch (error) {
    return next(error);
  }
});

router.put("/steps/:id", async (req, res, next) => {
  const stepId = Number(req.params.id);
  if (!Number.isInteger(stepId) || stepId <= 0 || typeof req.body?.done !== "boolean") {
    return res.status(400).json({ error: "A valid step id and done value are required" });
  }
  try {
    const result = await database.run(
      `UPDATE referralSteps SET done = ?, doneAt = ?
       WHERE id = ? AND userId = ?`,
      req.body.done ? 1 : 0,
      req.body.done ? new Date().toISOString() : null,
      stepId,
      req.userId
    );
    if (!result.changes) return res.status(404).json({ error: "Step not found" });
    const step = await database.get("SELECT * FROM referralSteps WHERE id = ? AND userId = ?", stepId, req.userId);
    return res.json(parseStep(step));
  } catch (error) {
    return next(error);
  }
});

router.post("/:reportId/steps", async (req, res, next) => {
  const reportId = Number(req.params.reportId);
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const documents = req.body?.documents === undefined ? [] : req.body.documents;
  if (!Number.isInteger(reportId) || reportId <= 0 || !text || text.length > 500 ||
      !Array.isArray(documents) || documents.length > 20 ||
      documents.some((document) => typeof document !== "string" || document.trim().length > 120)) {
    return res.status(400).json({ error: "Enter a step and valid document names" });
  }
  try {
    const report = await ownedReport(req.userId, reportId);
    if (!report || report.type !== "referral_letter" || report.status !== "confirmed") {
      return res.status(404).json({ error: "Confirmed referral letter not found" });
    }
    const order = await database.get(
      "SELECT COALESCE(MAX(sortOrder), -1) + 1 AS nextOrder FROM referralSteps WHERE userId = ? AND reportId = ?",
      req.userId,
      reportId
    );
    const result = await database.run(
      `INSERT INTO referralSteps (userId, reportId, text, documents, done, sortOrder)
       VALUES (?, ?, ?, ?, 0, ?)`,
      req.userId,
      reportId,
      text,
      JSON.stringify(documents.map((document) => document.trim()).filter(Boolean)),
      order.nextOrder
    );
    const step = await database.get("SELECT * FROM referralSteps WHERE id = ? AND userId = ?", result.lastID, req.userId);
    return res.status(201).json(parseStep(step));
  } catch (error) {
    return next(error);
  }
});

router.delete("/steps/:id", async (req, res, next) => {
  const stepId = Number(req.params.id);
  if (!Number.isInteger(stepId) || stepId <= 0) return res.status(404).json({ error: "Step not found" });
  try {
    const result = await database.run(
      "DELETE FROM referralSteps WHERE id = ? AND userId = ?",
      stepId,
      req.userId
    );
    if (!result.changes) return res.status(404).json({ error: "Step not found" });
    return res.json({ deleted: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
