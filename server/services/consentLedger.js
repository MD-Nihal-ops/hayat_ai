const consentVersion = "1.0";
const dataCategories = new Set([
  "health_report_values",
  "health_report_explanation",
  "original_medical_document"
]);
const emailPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

async function withTransaction(database, operation) {
  await database.run("BEGIN IMMEDIATE");
  try {
    const result = await operation();
    await database.run("COMMIT");
    return result;
  } catch (error) {
    await database.run("ROLLBACK");
    throw error;
  }
}

async function revokeLinkedShares(database, userId, consentId) {
  const shares = await database.all(
    "SELECT id FROM shares WHERE consentId = ? AND ownerId = ? AND status = 'active'",
    consentId,
    userId
  );
  await database.run(
    "UPDATE shares SET status = 'revoked', revokedAt = CURRENT_TIMESTAMP WHERE consentId = ? AND ownerId = ? AND status = 'active'",
    consentId,
    userId
  );
  for (const share of shares) {
    await database.run("DELETE FROM sharedQuestions WHERE shareId = ?", share.id);
  }
}

async function revokeConsent(database, userId, consentId) {
  return withTransaction(database, async () => {
    const consent = await database.get(
      "SELECT status, consentVersion, expiresAt FROM consents WHERE consentId = ? AND userId = ?",
      consentId,
      userId
    );
    if (!consent) return "not_found";
    if (consent.status !== "granted") return consent.status;
    if (consent.expiresAt && Date.parse(consent.expiresAt) <= Date.now()) {
      await database.run(
        "UPDATE consents SET status = 'expired' WHERE consentId = ? AND userId = ? AND status = 'granted'",
        consentId,
        userId
      );
      await database.run(
        "INSERT INTO consentEvents (consentId, userId, eventType, consentVersion, details) VALUES (?, ?, 'expiry', ?, 'Consent expired')",
        consentId,
        userId,
        consent.consentVersion
      );
      await revokeLinkedShares(database, userId, consentId);
      return "expired";
    }
    await database.run(
      "UPDATE consents SET status = 'revoked', revokedAt = CURRENT_TIMESTAMP WHERE consentId = ? AND userId = ? AND status = 'granted'",
      consentId,
      userId
    );
    await database.run(
      "INSERT INTO consentEvents (consentId, userId, eventType, consentVersion, details) VALUES (?, ?, 'revocation', ?, 'Consent explicitly revoked')",
      consentId,
      userId,
      consent.consentVersion
    );
    await revokeLinkedShares(database, userId, consentId);
    return "revoked";
  });
}

async function expireConsentIfNeeded(database, userId, consentId) {
  const consent = await database.get(
    `SELECT consentVersion FROM consents
     WHERE consentId = ? AND userId = ? AND status = 'granted'
       AND expiresAt IS NOT NULL AND datetime(expiresAt) <= CURRENT_TIMESTAMP`,
    consentId,
    userId
  );
  if (!consent) return false;
  return withTransaction(database, async () => {
    const update = await database.run(
      `UPDATE consents SET status = 'expired'
       WHERE consentId = ? AND userId = ? AND status = 'granted'
         AND expiresAt IS NOT NULL AND datetime(expiresAt) <= CURRENT_TIMESTAMP`,
      consentId,
      userId
    );
    if (!update.changes) return false;
    await database.run(
      "INSERT INTO consentEvents (consentId, userId, eventType, consentVersion, details) VALUES (?, ?, 'expiry', ?, 'Consent expired')",
      consentId,
      userId,
      consent.consentVersion
    );
    await revokeLinkedShares(database, userId, consentId);
    return true;
  });
}

function isValidExpiry(value) {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value)) {
    return false;
  }
  const datePart = value.slice(0, 10);
  const date = new Date(`${datePart}T00:00:00.000Z`);
  const timestamp = new Date(value.length === 10 ? `${value}T23:59:59.999Z` : value).getTime();
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === datePart &&
    Number.isFinite(timestamp) &&
    timestamp > Date.now();
}

function expiryTimestamp(value) {
  if (!value) return null;
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value).toISOString();
}

function validateConsentInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => ![
        "action", "dataCategories", "resourceId", "recipientType", "recipient", "purpose", "optional", "expiresAt"
      ].includes(key))) return false;
  if (!["grant", "deny"].includes(body.action) ||
      !Array.isArray(body.dataCategories) ||
      body.dataCategories.length === 0 ||
      body.dataCategories.some((category) => !dataCategories.has(category)) ||
      new Set(body.dataCategories).size !== body.dataCategories.length ||
      !["person", "entity"].includes(body.recipientType) ||
      typeof body.recipient !== "string" ||
      body.recipient.trim().length < 3 ||
      body.recipient.trim().length > 254 ||
      typeof body.purpose !== "string" ||
      body.purpose.trim().length < 3 ||
      body.purpose.trim().length > 240 ||
      typeof body.optional !== "boolean" ||
      (body.resourceId !== undefined &&
        (!Number.isInteger(body.resourceId) || body.resourceId <= 0)) ||
      (body.recipientType === "person" && body.purpose === "family_report_sharing" &&
        !Number.isInteger(body.resourceId)) ||
      !isValidExpiry(body.expiresAt)) return false;
  if (body.recipientType === "person" && body.purpose === "family_report_sharing") {
    const localPart = body.recipient.trim().split("@")[0];
    if (!emailPattern.test(body.recipient.trim()) ||
        localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..") ||
        body.optional !== true ||
        !body.dataCategories.includes("health_report_values") ||
        !body.dataCategories.includes("health_report_explanation")) return false;
  }
  return true;
}

async function hasValidConsent(database, { consentId, userId, recipient, resourceId, includeOriginal, expiresAt }) {
  if (typeof consentId !== "string" || !consentId) return false;
  const consent = await database.get(
    `SELECT dataCategories, recipient, purpose, optional, resourceId, expiresAt
     FROM consents
     WHERE consentId = ? AND userId = ? AND recipientType = 'person' AND status = 'granted'`,
    consentId,
    userId
  );
  if (!consent || consent.recipient.trim().toLowerCase() !== recipient.trim().toLowerCase() ||
      consent.purpose !== "family_report_sharing" || consent.optional !== 1 ||
      consent.resourceId !== resourceId) return false;
  if (consent.expiresAt) {
    const consentExpiry = Date.parse(consent.expiresAt);
    if (!Number.isFinite(consentExpiry) || consentExpiry <= Date.now()) {
      await expireConsentIfNeeded(database, userId, consentId);
      return false;
    }
  }
  let categories;
  try {
    categories = JSON.parse(consent.dataCategories);
  } catch (error) {
    return false;
  }
  if (!Array.isArray(categories) ||
      !categories.includes("health_report_values") ||
      !categories.includes("health_report_explanation") ||
      (includeOriginal && !categories.includes("original_medical_document"))) return false;
  if (consent.expiresAt && (!expiresAt || Date.parse(expiresAt) > Date.parse(consent.expiresAt))) return false;
  return true;
}

module.exports = {
  consentVersion,
  dataCategories,
  expireConsentIfNeeded,
  expiryTimestamp,
  hasValidConsent,
  isValidExpiry,
  revokeConsent,
  validateConsentInput
};
