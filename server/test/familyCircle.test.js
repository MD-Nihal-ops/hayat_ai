const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const { createFamilyCircleRouter } = require("../routes/familyCircle");
const requireAuth = require("../middleware/requireAuth");

const jwtSecret = "family-circle-test-secret";
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

test("Family Circle consent, permission scope, emergency-only view, and revocation", async (t) => {
  const database = createTestDatabase();
  const today = new Date().getDay();
  const appointment = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  await database.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, language TEXT);
    CREATE TABLE familyMembers (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ownerId INTEGER NOT NULL, memberName TEXT NOT NULL,
      memberEmail TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('caregiver', 'emergency_contact_only')),
      permissions TEXT NOT NULL DEFAULT '{"canViewMedicines":false,"canViewAppointments":false,"canClaimTasks":false,"canViewAccessNeeds":false}',
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consentAcknowledgedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consentVersion TEXT NOT NULL DEFAULT 'f1-v1',
      revokedAt TEXT
    );
    CREATE TABLE careTasks (
      id INTEGER PRIMARY KEY, ownerId INTEGER NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL,
      claimedById INTEGER, claimedByEmail TEXT, claimedAt TEXT, doneAt TEXT, updatedAt TEXT
    );
    CREATE UNIQUE INDEX familyMembers_active_owner_email
      ON familyMembers (ownerId, lower(memberEmail)) WHERE status = 'active';
    CREATE TABLE accessLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, ownerId INTEGER, viewerId INTEGER,
      viewerEmail TEXT, reportId INTEGER, action TEXT NOT NULL, details TEXT, timestamp TEXT NOT NULL
    );
    CREATE TABLE profiles (
      userId INTEGER PRIMARY KEY, fullName TEXT, bloodType TEXT, allergies TEXT,
      emergencyContactName TEXT, emergencyContactPhone TEXT, dateOfBirth TEXT
    );
    CREATE TABLE reminders (id INTEGER PRIMARY KEY, userId INTEGER, medicineName TEXT, time TEXT, days TEXT);
    CREATE TABLE appointments (
      id INTEGER PRIMARY KEY, userId INTEGER, title TEXT, dateTime TEXT, place TEXT, notes TEXT, sourceReportId INTEGER
    );
    CREATE TABLE reports (
      id INTEGER PRIMARY KEY, userId INTEGER, type TEXT, status TEXT, createdAt TEXT,
      extractedValues TEXT, explanations TEXT, originalFileUrl TEXT
    );
    CREATE TABLE shares (
      id INTEGER PRIMARY KEY, ownerId INTEGER, sharedWithEmail TEXT, reportId INTEGER, status TEXT,
      includeOriginal INTEGER, consentId TEXT, createdAt TEXT, expiresAt TEXT
    );
    CREATE TABLE consents (
      consentId TEXT PRIMARY KEY, userId INTEGER, resourceId INTEGER, dataCategories TEXT,
      status TEXT, purpose TEXT, recipientType TEXT, recipient TEXT, expiresAt TEXT
    );
    CREATE TABLE insurancePolicies (id INTEGER PRIMARY KEY, userId INTEGER, policyNumber TEXT);
    CREATE TABLE chatMessages (id INTEGER PRIMARY KEY, userId INTEGER, content TEXT);
    INSERT INTO users (id, email) VALUES
      (1, 'owner@example.test'), (2, 'caregiver@example.test'), (3, 'emergency@example.test'), (4, 'other@example.test');
    INSERT INTO profiles (userId, fullName, bloodType, allergies, emergencyContactName, emergencyContactPhone, dateOfBirth)
      VALUES (1, 'Private Owner Profile', 'O+', '["Peanuts"]', 'Emergency Person', '0501234567', '1980-01-01');
    INSERT INTO reminders (userId, medicineName, time, days) VALUES (1, 'Daily tablet', '08:00', '${today}');
    INSERT INTO appointments (userId, title, dateTime, place, notes) VALUES
      (1, 'Clinic appointment', '${appointment}', 'Clinic A', 'Private appointment note');
    INSERT INTO reports (id, userId, type, status, createdAt, extractedValues, explanations, originalFileUrl)
      VALUES (20, 1, 'blood_test', 'confirmed', '2026-11-01 10:00:00', '[{"name":"Glucose","value":"5"}]', '{"en":"Private explanation"}', '/uploads/private.pdf');
    INSERT INTO shares (id, ownerId, sharedWithEmail, reportId, status, includeOriginal, consentId, createdAt)
      VALUES (30, 1, 'caregiver@example.test', 20, 'active', 0, 'consent-20', CURRENT_TIMESTAMP);
    INSERT INTO consents (consentId, userId, resourceId, dataCategories, status, purpose, recipientType, recipient)
      VALUES ('consent-20', 1, 20, '["health_report_values","health_report_explanation"]',
        'granted', 'family_report_sharing', 'person', 'caregiver@example.test');
    INSERT INTO insurancePolicies (userId, policyNumber) VALUES (1, 'PRIVATE-POLICY');
    INSERT INTO chatMessages (userId, content) VALUES (1, 'private chat content');
  `);

  const app = express();
  app.use(express.json());
  app.use(requireAuth);
  app.use("/api/family-circle", createFamilyCircleRouter(database));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/family-circle`;

  async function request(userId, endpoint, options = {}) {
    const headers = { Authorization: `Bearer ${tokenFor(userId)}`, ...(options.headers || {}) };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    return { response, body: await response.json() };
  }

  try {
    await t.test("adds caregiver only after consent and defaults omitted permissions to off", async () => {
      const missingConsent = await request(1, "/", {
        method: "POST",
        body: { name: "Caregiver", email: "caregiver@example.test", role: "caregiver" }
      });
      assert.equal(missingConsent.response.status, 400);

      const added = await request(1, "/", {
        method: "POST",
        body: {
          name: "Caregiver",
          email: "caregiver@example.test",
          role: "caregiver",
          consentAcknowledged: true
        }
      });
      assert.equal(added.response.status, 201);
      assert.deepEqual(added.body.permissions, {
        canViewMedicines: false,
        canViewAppointments: false,
        canClaimTasks: false,
        canViewAccessNeeds: false
      });
      const consent = await database.get(
        "SELECT consentAcknowledgedAt, consentVersion FROM familyMembers WHERE id = ?",
        added.body.id
      );
      assert.ok(consent.consentAcknowledgedAt);
      assert.equal(consent.consentVersion, "f1-v1");
      const duplicate = await request(1, "/", {
        method: "POST",
        body: {
          name: "Caregiver",
          email: "CAREGIVER@example.test",
          role: "caregiver",
          consentAcknowledged: true
        }
      });
      assert.equal(duplicate.response.status, 409);
    });

    await t.test("caregiver overview contains only selected data and existing explicitly shared reports", async () => {
      const ownerMembers = await request(1, "/");
      const caregiver = ownerMembers.body.find((member) => member.email === "caregiver@example.test");
      const updated = await request(1, `/${caregiver.id}/permissions`, {
        method: "PATCH",
        body: { permissions: { canViewMedicines: true, canViewAppointments: true, canClaimTasks: true } }
      });
      assert.equal(updated.response.status, 200);
      assert.equal(updated.body.permissions.canClaimTasks, true);

      const helping = await request(2, "/helping");
      assert.equal(helping.response.status, 200);
      assert.equal(helping.body[0].status, "active");
      assert.equal(helping.body[0].name, "Private Owner Profile");
      const result = await request(2, `/${caregiver.id}/overview`);
      assert.equal(result.response.status, 200);
      assert.deepEqual(result.body.todaysMedicines, [{ medicineName: "Daily tablet", time: "08:00" }]);
      assert.deepEqual(result.body.nextAppointments, [{
        title: "Clinic appointment",
        dateTime: appointment,
        place: "Clinic A"
      }]);
      assert.deepEqual(result.body.sharedReports, [{
        shareId: 30,
        type: "blood_test",
        createdAt: "2026-11-01 10:00:00"
      }]);
      const serialized = JSON.stringify(result.body);
      for (const hidden of ["PRIVATE-POLICY", "private chat content", "Private appointment note", "Private explanation", "1980-01-01", "0501234567"]) {
        assert.equal(serialized.includes(hidden), false);
      }
      assert.equal(Object.hasOwn(result.body, "insurance"), false);

      await request(1, `/${caregiver.id}/permissions`, {
        method: "PATCH",
        body: { permissions: { canViewMedicines: false, canViewAppointments: true, canClaimTasks: false } }
      });
      const reduced = await request(2, `/${caregiver.id}/overview`);
      assert.equal(reduced.response.status, 200);
      assert.equal(Object.hasOwn(reduced.body, "todaysMedicines"), false);
      assert.equal(Object.hasOwn(reduced.body, "nextAppointments"), true);
    });

    await t.test("emergency-only view returns only emergency contact, blood type, and allergies", async () => {
      const added = await request(1, "/", {
        method: "POST",
        body: {
          name: "Emergency Contact",
          email: "emergency@example.test",
          role: "emergency_contact_only",
          consentAcknowledged: true
        }
      });
      assert.equal(added.response.status, 201);
      const result = await request(3, `/${added.body.id}/overview`);
      assert.equal(result.response.status, 200);
      assert.deepEqual(Object.keys(result.body), ["emergencyCard"]);
      assert.deepEqual(result.body.emergencyCard, {
        contactName: "Emergency Person",
        contactPhone: "0501234567",
        bloodType: "O+",
        allergies: ["Peanuts"]
      });
    });

    await t.test("revocation immediately returns 403 to direct overview access", async () => {
      const member = (await request(1, "/")).body.find((entry) => entry.email === "caregiver@example.test");
      const revoked = await request(1, `/${member.id}`, { method: "DELETE" });
      assert.equal(revoked.response.status, 200);
      const denied = await request(2, `/${member.id}/overview`);
      assert.equal(denied.response.status, 403);
      const helping = await request(2, "/helping");
      assert.equal(helping.body.find((entry) => entry.id === member.id).status, "revoked");
      const audit = await database.all("SELECT action FROM accessLog ORDER BY id");
      assert.ok(audit.some((entry) => entry.action === "family_member_added"));
      assert.ok(audit.some((entry) => entry.action === "family_permissions_updated"));
      assert.ok(audit.some((entry) => entry.action === "caregiver_overview_viewed"));
      assert.ok(audit.some((entry) => entry.action === "family_access_revoked"));
    });

    await t.test("rejects cross-account permission changes and invalid permissions", async () => {
      const member = (await request(1, "/")).body.find((entry) => entry.email === "emergency@example.test");
      const crossAccount = await request(4, `/${member.id}/permissions`, {
        method: "PATCH",
        body: { permissions: { canViewMedicines: true } }
      });
      assert.equal(crossAccount.response.status, 404);
      const invalid = await request(1, `/${member.id}/permissions`, {
        method: "PATCH",
        body: { permissions: { canViewMedicines: true } }
      });
      assert.equal(invalid.response.status, 400);
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await database.close();
  }
});
