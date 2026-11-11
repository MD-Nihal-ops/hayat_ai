const express = require("express");
const { randomUUID } = require("node:crypto");
const {
  consentVersion,
  expireConsentIfNeeded,
  expiryTimestamp,
  revokeConsent,
  validateConsentInput
} = require("../services/consentLedger");

async function withTransaction(databaseClient, operation) {
  await databaseClient.run("BEGIN IMMEDIATE");
  try {
    const result = await operation();
    await databaseClient.run("COMMIT");
    return result;
  } catch (error) {
    await databaseClient.run("ROLLBACK");
    throw error;
  }
}

async function expireConsents(databaseClient, userId) {
  const expired = await databaseClient.all(
    `SELECT consentId, consentVersion FROM consents
     WHERE userId = ? AND status = 'granted' AND expiresAt IS NOT NULL
       AND datetime(expiresAt) <= CURRENT_TIMESTAMP`,
    userId
  );
  for (const consent of expired) {
    await expireConsentIfNeeded(databaseClient, userId, consent.consentId);
  }
}

function createConsentRouter(databaseClient = require("../database")) {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      await expireConsents(databaseClient, req.userId);
      const rows = await databaseClient.all(
        `SELECT consentId, dataCategories, resourceId, recipientType, recipient, purpose, optional,
                grantedAt, expiresAt, status, revokedAt, consentVersion
         FROM consents WHERE userId = ? ORDER BY COALESCE(grantedAt, expiresAt) DESC, rowid DESC`,
        req.userId
      );
      const events = await databaseClient.all(
        `SELECT consentId, eventType, timestamp, consentVersion, details
         FROM consentEvents WHERE userId = ? ORDER BY timestamp DESC, id DESC`,
        req.userId
      );
      const eventsByConsent = new Map();
      for (const event of events) {
        const consentEvents = eventsByConsent.get(event.consentId) || [];
        consentEvents.push({
          eventType: event.eventType,
          timestamp: event.timestamp,
          consentVersion: event.consentVersion,
          details: event.details
        });
        eventsByConsent.set(event.consentId, consentEvents);
      }
      return res.json(rows.map((row) => ({
        ...row,
        dataCategories: JSON.parse(row.dataCategories),
        optional: row.optional === 1,
        events: eventsByConsent.get(row.consentId) || []
      })));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    if (!validateConsentInput(req.body)) {
      return res.status(400).json({ error: "Consent details are invalid" });
    }
    const consentId = randomUUID();
    const body = req.body;
    const recipient = body.recipient.trim();
    const purpose = body.purpose.trim();
    const status = body.action === "grant" ? "granted" : "denied";
    try {
      const grantedAt = await withTransaction(databaseClient, async () => {
        await databaseClient.run(
          `INSERT INTO consents
             (consentId, userId, dataCategories, resourceId, recipientType, recipient, purpose, optional,
              grantedAt, expiresAt, status, consentVersion)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'grant' THEN CURRENT_TIMESTAMP ELSE NULL END, ?, ?, ?)`,
          consentId,
          req.userId,
          JSON.stringify(body.dataCategories),
          body.resourceId || null,
          body.recipientType,
          recipient,
          purpose,
          body.optional ? 1 : 0,
          body.action,
          body.action === "grant" ? expiryTimestamp(body.expiresAt) : null,
          status,
          consentVersion
        );
        await databaseClient.run(
          "INSERT INTO consentEvents (consentId, userId, eventType, consentVersion, details) VALUES (?, ?, ?, ?, ?)",
          consentId,
          req.userId,
          body.action === "grant" ? "grant" : "denial",
          consentVersion,
          body.action === "grant" ? "Consent explicitly granted" : "Consent explicitly denied"
        );
        const row = await databaseClient.get(
          "SELECT grantedAt FROM consents WHERE consentId = ? AND userId = ?",
          consentId,
          req.userId
        );
        return row;
      });
      return res.status(201).json({
        consentId,
        status,
        grantedAt: grantedAt.grantedAt,
        consentVersion
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:consentId/revoke", async (req, res, next) => {
    const { consentId } = req.params;
    if (typeof consentId !== "string" || consentId.length > 64) {
      return res.status(404).json({ error: "Consent not found" });
    }
    try {
      const status = await revokeConsent(databaseClient, req.userId, consentId);
      if (status === "not_found") return res.status(404).json({ error: "Consent not found" });
      if (status !== "revoked") return res.status(409).json({ error: "Consent is no longer active" });
      return res.json({ consentId, status });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createConsentRouter, expireConsents };
