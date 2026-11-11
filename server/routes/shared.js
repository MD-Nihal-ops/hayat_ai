const express = require("express");
const path = require("node:path");
const { evaluateValue } = require("../utils/valueChecker");
const { expireConsentIfNeeded } = require("../services/consentLedger");
const { writeAccessLog } = require("./shares");
const { explainReport } = require("../services/explain");

const uploadsDirectory = path.join(__dirname, "..", "uploads");
const inFlightTranslations = new WeakMap();
const supportedLanguages = new Set(["en", "ar", "hi", "ml"]);

class TranslationRateLimitError extends Error {}
class TranslationServiceError extends Error {}

function maskEmail(email) {
  const [name, domain] = String(email || "").split("@");
  return name && domain ? `${name.slice(0, 1)}***@${domain}` : "";
}

async function getValidShare(databaseClient, shareId, viewerId) {
  const viewer = await databaseClient.get("SELECT email FROM users WHERE id = ?", viewerId);
  if (!viewer) return null;
  const share = await databaseClient.get(
    `SELECT s.id, s.ownerId, s.sharedWithEmail, s.reportId, s.includeOriginal, s.consentId, s.expiresAt,
            r.type, r.createdAt, r.extractedValues, r.documentDetails, r.explanations,
            p.fullName AS ownerName, owner.email AS ownerEmail, c.dataCategories AS consentCategories,
            c.expiresAt AS consentExpiresAt
     FROM shares s
     JOIN reports r ON r.id = s.reportId AND r.userId = s.ownerId AND r.status = 'confirmed'
     JOIN users owner ON owner.id = s.ownerId
     JOIN consents c ON c.consentId = s.consentId AND c.userId = s.ownerId AND c.resourceId = s.reportId
     LEFT JOIN profiles p ON p.userId = s.ownerId
     WHERE s.id = ? AND s.status = 'active'
       AND lower(s.sharedWithEmail) = lower(?)
       AND c.status = 'granted'
       AND c.recipientType = 'person'
       AND lower(c.recipient) = lower(s.sharedWithEmail)
       AND c.purpose = 'family_report_sharing'`,
    shareId,
    viewer.email
  );
  if (!share) return null;
  if (share.expiresAt) {
    const expiry = Date.parse(share.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      await databaseClient.run(
        `UPDATE shares SET status = 'revoked', revokedAt = CURRENT_TIMESTAMP
         WHERE id = ? AND status = 'active'`,
        share.id
      );
      await databaseClient.run("DELETE FROM sharedQuestions WHERE shareId = ?", share.id);
      return null;
    }
  }
  if (share.consentExpiresAt) {
    const expiry = Date.parse(share.consentExpiresAt);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      await expireConsentIfNeeded(databaseClient, share.ownerId, share.consentId);
      return null;
    }
  }
  let categories;
  try {
    categories = JSON.parse(share.consentCategories);
  } catch (error) {
    return null;
  }
  if (!Array.isArray(categories) ||
      !categories.includes("health_report_values") ||
      !categories.includes("health_report_explanation") ||
      (share.includeOriginal === 1 && !categories.includes("original_medical_document"))) return null;
  return share;
}

function createSharedRouter(databaseClient = require("../database")) {
const router = express.Router();

async function generateViewerTranslation(share, viewerId, language) {
  await databaseClient.run("BEGIN IMMEDIATE");
  try {
    const recent = await databaseClient.get(
      `SELECT COUNT(*) AS count FROM sharedTranslationGenerations
       WHERE viewerId = ? AND createdAt >= datetime('now', '-1 hour')`,
      viewerId
    );
    if (recent.count >= 5) {
      await databaseClient.run("ROLLBACK");
      throw new TranslationRateLimitError("Translation generation limit reached");
    }
    await databaseClient.run(
      "INSERT INTO sharedTranslationGenerations (viewerId, shareId, language) VALUES (?, ?, ?)",
      viewerId,
      share.id,
      language
    );
    await databaseClient.run("COMMIT");
  } catch (error) {
    if (error instanceof TranslationRateLimitError) throw error;
    await databaseClient.run("ROLLBACK");
    throw error;
  }

  const beforeGeneration = await getValidShare(databaseClient, share.id, viewerId);
  if (!beforeGeneration) return null;
  const extractedValues = JSON.parse(share.extractedValues || "[]").map((item) => ({
    name: item.name,
    value: item.value,
    unit: item.unit,
    printedRange: item.printedRange,
    status: evaluateValue(item.name, item.value, item.printedRange)
  }));
  let explanation;
  try {
    explanation = await explainReport({
      reportType: share.type,
      language,
      extractedValues,
      documentDetails: JSON.parse(share.documentDetails || "{}")
    });
  } catch (error) {
    console.error("[shared] translation failed:", error?.name || "Error");
    throw new TranslationServiceError("The translation service is temporarily unavailable");
  }

  const stillValid = await getValidShare(databaseClient, share.id, viewerId);
  if (!stillValid) return null;
  const viewer = await databaseClient.get("SELECT email FROM users WHERE id = ?", viewerId);
  if (!viewer) return null;
  await databaseClient.run("BEGIN IMMEDIATE");
  try {
    const activeShare = await databaseClient.get(
      `SELECT s.id FROM shares s
       JOIN reports r ON r.id = s.reportId AND r.userId = s.ownerId AND r.status = 'confirmed'
       JOIN consents c ON c.consentId = s.consentId AND c.userId = s.ownerId
       WHERE s.id = ? AND s.ownerId = ? AND s.reportId = ? AND s.status = 'active'
         AND lower(s.sharedWithEmail) = lower(?)
         AND (s.expiresAt IS NULL OR datetime(s.expiresAt) > CURRENT_TIMESTAMP)
         AND c.status = 'granted' AND c.purpose = 'family_report_sharing'
         AND c.resourceId = s.reportId
         AND c.recipientType = 'person' AND lower(c.recipient) = lower(s.sharedWithEmail)
         AND (c.expiresAt IS NULL OR datetime(c.expiresAt) > CURRENT_TIMESTAMP)`,
      share.id,
      share.ownerId,
      share.reportId,
      viewer.email
    );
    if (!activeShare) {
      await databaseClient.run("ROLLBACK");
      return null;
    }
    const report = await databaseClient.get(
      "SELECT explanations FROM reports WHERE id = ? AND userId = ? AND status = 'confirmed'",
      share.reportId,
      share.ownerId
    );
    if (!report) {
      await databaseClient.run("ROLLBACK");
      return null;
    }
    const explanations = JSON.parse(report.explanations || "{}");
    if (explanations[language]?.schemaVersion === 2) {
      await databaseClient.run("COMMIT");
      return explanations[language];
    }
    explanations[language] = explanation;
    await databaseClient.run(
      "UPDATE reports SET explanations = ? WHERE id = ? AND userId = ? AND status = 'confirmed'",
      JSON.stringify(explanations),
      share.reportId,
      share.ownerId
    );
    await databaseClient.run("COMMIT");
    return explanation;
  } catch (error) {
    await databaseClient.run("ROLLBACK");
    throw error;
  }
}

async function getViewerTranslation(databaseClient, share, viewerId, language) {
  const inFlight = inFlightTranslations.get(databaseClient) || new Map();
  inFlightTranslations.set(databaseClient, inFlight);
  const key = `${share.id}:${language}`;
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = generateViewerTranslation(share, viewerId, language);
  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    if (inFlight.get(key) === promise) inFlight.delete(key);
  }
}

router.get("/:shareId", async (req, res, next) => {
  const shareId = Number(req.params.shareId);
  if (!Number.isInteger(shareId) || shareId <= 0) {
    return res.status(403).json({ error: "Access ended or not allowed" });
  }
  try {
    const share = await getValidShare(databaseClient, shareId, req.userId);
    if (!share) return res.status(403).json({ error: "Access ended or not allowed" });
    const values = JSON.parse(share.extractedValues || "[]").map((item) => ({
      name: item.name,
      value: item.value,
      unit: item.unit,
      printedRange: item.printedRange,
      status: evaluateValue(item.name, item.value, item.printedRange)
    }));
    let explanations = {};
    try {
      explanations = JSON.parse(share.explanations || "{}");
    } catch (error) {
      return next(error);
    }
    const requestedLanguage = ["en", "ar", "hi", "ml"].includes(req.query.language) ? req.query.language : "";
    const explanationLanguage = requestedLanguage && explanations[requestedLanguage]
      ? requestedLanguage
      : Object.keys(explanations).find((key) => !key.endsWith("_easy") && explanations[key]) || null;
    await writeAccessLog({
      ownerId: share.ownerId,
      viewerId: req.userId,
      viewerEmail: share.sharedWithEmail,
      reportId: share.reportId,
      action: "report_viewed",
      details: "Shared report viewed",
      databaseClient
    });
    return res.json({
      shareId: share.id,
      ownerName: share.ownerName?.trim() || maskEmail(share.ownerEmail),
      includeOriginal: share.includeOriginal === 1,
      report: {
        id: share.reportId,
        type: share.type,
        createdAt: share.createdAt,
        extractedValues: values,
        explanation: explanationLanguage ? explanations[explanationLanguage] : null,
        explanationLanguage
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/:shareId/translate", async (req, res, next) => {
  const shareId = Number(req.params.shareId);
  const language = req.body?.language;
  if (!Number.isInteger(shareId) || shareId <= 0) {
    return res.status(403).json({ error: "Access ended or not allowed" });
  }
  try {
    const share = await getValidShare(databaseClient, shareId, req.userId);
    if (!share) return res.status(403).json({ error: "Access ended or not allowed" });
    if (!supportedLanguages.has(language)) {
      return res.status(400).json({ error: "language must be en, ar, hi, or ml" });
    }
    let explanations;
    try {
      explanations = JSON.parse(share.explanations || "{}");
    } catch (error) {
      return next(error);
    }
    if (explanations[language]) return res.json(explanations[language]);

    const explanation = await getViewerTranslation(databaseClient, share, req.userId, language);
    if (!explanation) return res.status(403).json({ error: "Access ended or not allowed" });
    const stillValid = await getValidShare(databaseClient, shareId, req.userId);
    if (!stillValid) return res.status(403).json({ error: "Access ended or not allowed" });
    return res.json(explanation);
  } catch (error) {
    if (error instanceof TranslationRateLimitError) {
      return res.status(429).json({ error: "translation_rate_limited" });
    }
    if (error instanceof TranslationServiceError) {
      return res.status(503).json({
        error: "Explanation failed",
        detail: "The AI is very busy right now. Please wait a minute and try again."
      });
    }
    return next(error);
  }
});

router.get("/:shareId/file", async (req, res, next) => {
  const shareId = Number(req.params.shareId);
  if (!Number.isInteger(shareId) || shareId <= 0) {
    return res.status(403).json({ error: "Access ended or not allowed" });
  }
  try {
    const share = await getValidShare(databaseClient, shareId, req.userId);
    if (!share || share.includeOriginal !== 1) {
      return res.status(403).json({ error: "Access ended or not allowed" });
    }
    const report = await databaseClient.get(
      "SELECT originalFileUrl FROM reports WHERE id = ? AND userId = ?",
      share.reportId,
      share.ownerId
    );
    const match = report?.originalFileUrl?.match(/^\/uploads\/([^/\\]+)$/);
    if (!match) return res.status(403).json({ error: "Access ended or not allowed" });
    const filePath = path.join(uploadsDirectory, path.basename(match[1]));
    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
});

return router;
}

module.exports = { createSharedRouter, getValidShare };
