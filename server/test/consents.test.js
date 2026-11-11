const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const { createConsentRouter } = require("../routes/consents");
const { createSharesRouter } = require("../routes/shares");
const sharedRoutes = require("../routes/shared");
const requireAuth = require("../middleware/requireAuth");

const jwtSecret = "consent-ledger-test-secret";
process.env.JWT_SECRET = jwtSecret;

function createTestDatabase() {
  const connection = new sqlite3.Database(":memory:");
  return {
    exec(sql) {
      return new Promise((resolve, reject) => {
        connection.exec(sql, (error) => error ? reject(error) : resolve());
      });
    },
    get(sql, ...params) {
      return new Promise((resolve, reject) => {
        connection.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
      });
    },
    all(sql, ...params) {
      return new Promise((resolve, reject) => {
        connection.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
      });
    },
    run(sql, ...params) {
      return new Promise((resolve, reject) => {
        connection.run(sql, params, function onRun(error) {
          if (error) return reject(error);
          return resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        connection.close((error) => error ? reject(error) : resolve());
      });
    }
  };
}

function tokenFor(userId) {
  return jwt.sign({ userId }, jwtSecret);
}

test("consent ledger records decisions and gates family report access", async (t) => {
  const database = createTestDatabase();
  await database.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL);
    CREATE TABLE reports (
      id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, type TEXT NOT NULL,
      originalFileUrl TEXT NOT NULL, extractedValues TEXT NOT NULL, status TEXT NOT NULL,
      explanations TEXT NOT NULL DEFAULT '{}', documentDetails TEXT NOT NULL DEFAULT '{}',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ownerId INTEGER NOT NULL, sharedWithEmail TEXT NOT NULL,
      reportId INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'active', includeOriginal INTEGER NOT NULL DEFAULT 0,
      consentId TEXT, createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, expiresAt TEXT, revokedAt TEXT
    );
    CREATE TABLE sharedQuestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ownerId INTEGER NOT NULL, reportId INTEGER NOT NULL,
      authorId INTEGER NOT NULL, authorEmail TEXT NOT NULL, authorName TEXT NOT NULL, text TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, shareId INTEGER
    );
    CREATE UNIQUE INDEX shares_active_owner_email_report
      ON shares (ownerId, sharedWithEmail, reportId) WHERE status = 'active';
    CREATE TABLE accessLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, ownerId INTEGER, viewerId INTEGER,
      viewerEmail TEXT, reportId INTEGER, action TEXT NOT NULL, details TEXT, timestamp TEXT NOT NULL
    );
    CREATE TABLE profiles (userId INTEGER PRIMARY KEY, fullName TEXT);
    CREATE TABLE consents (
      consentId TEXT PRIMARY KEY, userId INTEGER NOT NULL, dataCategories TEXT NOT NULL,
      resourceId INTEGER, recipientType TEXT NOT NULL, recipient TEXT NOT NULL, purpose TEXT NOT NULL,
      optional INTEGER NOT NULL, grantedAt TEXT, expiresAt TEXT, status TEXT NOT NULL,
      revokedAt TEXT, consentVersion TEXT NOT NULL
    );
    CREATE TABLE consentEvents (
      id INTEGER PRIMARY KEY AUTOINCREMENT, consentId TEXT NOT NULL, userId INTEGER NOT NULL,
      eventType TEXT NOT NULL, timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consentVersion TEXT NOT NULL, details TEXT NOT NULL DEFAULT ''
    );
    INSERT INTO users (id, email) VALUES (1, 'owner@example.test'), (2, 'viewer@example.test');
    INSERT INTO reports (id, userId, type, originalFileUrl, extractedValues, status, explanations)
      VALUES (10, 1, 'blood_test', '/uploads/sample.pdf', '[{"name":"Glucose","value":"5","unit":"mmol/L","printedRange":"3-6"}]', 'confirmed', '{}');
    INSERT INTO reports (id, userId, type, originalFileUrl, extractedValues, status, explanations)
      VALUES (11, 1, 'blood_test', '/uploads/another.pdf', '[]', 'confirmed', '{}');
    INSERT INTO shares
      (id, ownerId, sharedWithEmail, reportId, status, includeOriginal, consentId)
      VALUES (99, 1, 'viewer@example.test', 11, 'active', 0, NULL);
  `);

  const app = express();
  app.use(express.json());
  app.use(requireAuth);
  app.use("/api/consents", createConsentRouter(database));
  app.use("/api/shares", createSharesRouter(database));
  app.use("/api/shared", sharedRoutes.createSharedRouter(database));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  async function request(userId, endpoint, options = {}) {
    const headers = { Authorization: `Bearer ${tokenFor(userId)}`, ...(options.headers || {}) };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const body = await response.json();
    return { response, body };
  }

  const consentDetails = (overrides = {}) => ({
    action: "grant",
    dataCategories: ["health_report_values", "health_report_explanation"],
    resourceId: 10,
    recipientType: "person",
    recipient: "viewer@example.test",
    purpose: "family_report_sharing",
    optional: true,
    ...overrides
  });

  try {
    await t.test("explicit grants and denials are persisted with audit events", async () => {
      const grant = await request(1, "/consents", { method: "POST", body: consentDetails() });
      assert.equal(grant.response.status, 201);
      assert.equal(grant.body.status, "granted");
      assert.ok(grant.body.grantedAt);

      const denial = await request(1, "/consents", {
        method: "POST",
        body: consentDetails({ action: "deny", recipient: "declined@example.test" })
      });
      assert.equal(denial.response.status, 201);
      assert.equal(denial.body.status, "denied");
      assert.equal(denial.body.grantedAt, null);

      const history = await request(1, "/consents");
      assert.equal(history.response.status, 200);
      const granted = history.body.find((item) => item.consentId === grant.body.consentId);
      assert.deepEqual(granted.events.map((event) => event.eventType), ["grant"]);
      const declined = history.body.find((item) => item.consentId === denial.body.consentId);
      assert.equal(declined.status, "denied");
      assert.deepEqual(declined.events.map((event) => event.eventType), ["denial"]);
      assert.equal((await request(2, "/consents")).body.length, 0);
    });

    await t.test("sharing needs matching live consent and revocation immediately blocks later reads", async () => {
      assert.equal((await request(2, "/shared/99")).response.status, 403);
      const deniedAccess = await request(1, "/shares", {
        method: "POST",
        body: { email: "viewer@example.test", reportId: 10, includeOriginal: false, consentId: "missing" }
      });
      assert.equal(deniedAccess.response.status, 403);

      const grant = await request(1, "/consents", { method: "POST", body: consentDetails() });
      const wrongReportScope = await request(1, "/shares", {
        method: "POST",
        body: {
          email: "viewer@example.test", reportId: 11, includeOriginal: false,
          consentId: grant.body.consentId
        }
      });
      assert.equal(wrongReportScope.response.status, 403);
      const originalDocumentNotAuthorized = await request(1, "/shares", {
        method: "POST",
        body: {
          email: "viewer@example.test", reportId: 10, includeOriginal: true,
          consentId: grant.body.consentId
        }
      });
      assert.equal(originalDocumentNotAuthorized.response.status, 403);
      const createdShare = await request(1, "/shares", {
        method: "POST",
        body: {
          email: "viewer@example.test", reportId: 10, includeOriginal: false,
          consentId: grant.body.consentId
        }
      });
      assert.equal(createdShare.response.status, 201);
      assert.equal((await request(2, `/shared/${createdShare.body.id}`)).response.status, 200);
      assert.equal((await request(2, "/shares/with-me")).body.length, 1);

      const revoked = await request(1, `/consents/${grant.body.consentId}/revoke`, { method: "POST" });
      assert.equal(revoked.response.status, 200);
      assert.equal(revoked.body.status, "revoked");
      assert.equal((await request(2, `/shared/${createdShare.body.id}`)).response.status, 403);
      assert.equal((await request(2, `/shared/${createdShare.body.id}/file`)).response.status, 403);
      assert.equal((await request(2, "/shares/with-me")).body.length, 0);

      const history = await request(1, "/consents");
      const entry = history.body.find((item) => item.consentId === grant.body.consentId);
      assert.equal(entry.status, "revoked");
      assert.deepEqual(entry.events.map((event) => event.eventType), ["revocation", "grant"]);

      const secondGrant = await request(1, "/consents", { method: "POST", body: consentDetails() });
      const secondShare = await request(1, "/shares", {
        method: "POST",
        body: {
          email: "viewer@example.test", reportId: 10, includeOriginal: false,
          consentId: secondGrant.body.consentId
        }
      });
      const stopped = await request(1, `/shares/${secondShare.body.id}`, { method: "DELETE" });
      assert.equal(stopped.response.status, 200);
      const secondHistory = await request(1, "/consents");
      const secondEntry = secondHistory.body.find((item) => item.consentId === secondGrant.body.consentId);
      assert.equal(secondEntry.status, "revoked");
      assert.ok(secondEntry.events.some((event) => event.eventType === "revocation"));
      assert.equal((await request(2, `/shared/${secondShare.body.id}`)).response.status, 403);
    });

    await t.test("expired consent cannot create or retain access and is recorded as expired", async () => {
      const grant = await request(1, "/consents", {
        method: "POST",
        body: consentDetails({ expiresAt: "2099-01-01" })
      });
      const createdShare = await request(1, "/shares", {
        method: "POST",
        body: {
          email: "viewer@example.test", reportId: 10, includeOriginal: false,
          consentId: grant.body.consentId, expiresAt: "2099-01-01"
        }
      });
      assert.equal(createdShare.response.status, 201);
      assert.equal((await request(2, `/shared/${createdShare.body.id}`)).response.status, 200);
      await database.run(
        "UPDATE consents SET expiresAt = '2000-01-01T00:00:00.000Z' WHERE consentId = ?",
        grant.body.consentId
      );
      assert.equal((await request(2, `/shared/${createdShare.body.id}`)).response.status, 403);
      const shareAttempt = await request(1, "/shares", {
        method: "POST",
        body: {
          email: "viewer@example.test", reportId: 10, includeOriginal: false,
          consentId: grant.body.consentId
        }
      });
      assert.equal(shareAttempt.response.status, 403);

      const history = await request(1, "/consents");
      const expired = history.body.find((item) => item.consentId === grant.body.consentId);
      assert.equal(expired.status, "expired");
      assert.ok(expired.events.some((event) => event.eventType === "expiry"));
    });

    await t.test("invalid consent values and unauthorized revocation are rejected", async () => {
      const invalid = await request(1, "/consents", {
        method: "POST",
        body: consentDetails({ dataCategories: ["invented_category"] })
      });
      assert.equal(invalid.response.status, 400);
      const grant = await request(1, "/consents", { method: "POST", body: consentDetails() });
      const otherUserRevoke = await request(2, `/consents/${grant.body.consentId}/revoke`, { method: "POST" });
      assert.equal(otherUserRevoke.response.status, 404);
      const noAuth = await fetch(`${baseUrl}/consents`);
      assert.equal(noAuth.status, 401);
    });

    await t.test("consent history labels exist in every supported locale", () => {
      const clientRoot = path.resolve(__dirname, "../../client/src/locales");
      for (const language of ["en", "ar", "hi", "ml"]) {
        const locale = JSON.parse(fs.readFileSync(path.join(clientRoot, `${language}.json`), "utf8"));
        for (const key of [
          "title", "description", "loading", "loadFailed", "empty", "purpose", "data",
          "recipientType", "scope", "grantedAt", "expiresAt", "revokedAt", "version",
          "optional", "revoke", "revoking", "revokeFailed", "auditTrail"
        ]) {
          assert.ok(locale.consentHistory[key]?.trim(), `${language} missing ${key}`);
        }
        assert.ok(locale.navigation.consents?.trim(), `${language} missing consent navigation`);
        assert.ok(Object.values(locale.consentHistory.categories).every((label) => label.trim()));
        assert.ok(Object.values(locale.consentHistory.statuses).every((label) => label.trim()));
        assert.ok(Object.values(locale.consentHistory.events).every((label) => label.trim()));
      }
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await database.close();
  }
});
