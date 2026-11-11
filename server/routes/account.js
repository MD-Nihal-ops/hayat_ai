const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const database = require("../database");
const insuranceRouter = require("./insurance");

const router = express.Router();
const uploadsDirectory = path.resolve(__dirname, "..", "uploads");
const privateUploadsDirectory = path.resolve(__dirname, "..", "private-uploads");

function safePathWithin(directory, candidate) {
  if (typeof candidate !== "string" || !candidate) return null;
  const resolved = path.resolve(candidate);
  return resolved.startsWith(`${directory}${path.sep}`) ? resolved : null;
}

function reportFilePath(url) {
  const match = typeof url === "string" ? url.match(/^\/uploads\/([^/\\]+)$/) : null;
  return match ? safePathWithin(uploadsDirectory, path.join(uploadsDirectory, path.basename(match[1]))) : null;
}

function maskPolicyNumber(value) {
  if (!value) return "";
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

async function getUserFiles(userId) {
  const [reports, policies] = await Promise.all([
    database.all("SELECT originalFileUrl FROM reports WHERE userId = ?", userId),
    database.all("SELECT filePath FROM insurancePolicies WHERE userId = ?", userId)
  ]);
  const paths = [
    ...reports.map((report) => reportFilePath(report.originalFileUrl)),
    ...policies.map((policy) => safePathWithin(privateUploadsDirectory, policy.filePath))
  ].filter(Boolean);
  return paths;
}

router.get("/export", async (req, res, next) => {
  try {
    const userId = req.userId;
    const [
      user,
      profile,
      reports,
      appointments,
      reminders,
      healthMetrics,
      wellnessGoals,
      wellnessLogs,
      preventionReminders,
      wellnessChallenges,
      wellnessChallengeMembers,
      doseLog,
      insurancePolicies,
      chatMessages,
      conversations,
      referralSteps,
      familyJourneys,
      familyJourneySteps,
      familyMembers,
      familyAccess,
      careTasks,
      sharedQuestions,
      shares,
      consents,
      consentEvents
    ] = await Promise.all([
      database.get("SELECT email, language FROM users WHERE id = ?", userId),
      database.get("SELECT fullName, dateOfBirth, bloodType, allergies, emergencyContactName, emergencyContactPhone, easyRead, accessNeeds FROM profiles WHERE userId = ?", userId),
      database.all(
        `SELECT id, type, createdAt, extractedValues, documentDetails
         FROM reports WHERE userId = ? AND status = 'confirmed'
         ORDER BY createdAt DESC, id DESC`,
        userId
      ),
      database.all(
        "SELECT title, dateTime, place, notes FROM appointments WHERE userId = ? ORDER BY dateTime, id",
        userId
      ),
      database.all(
        "SELECT medicineName, time, days FROM reminders WHERE userId = ? ORDER BY time, id",
        userId
      ),
      database.all(
        `SELECT id, metricKey, label, value, value2, unit, recordedAt, source, reportId, rangeMin, rangeMax
         FROM healthMetrics WHERE userId = ? ORDER BY recordedAt, id`,
        userId
      ),
      database.get(
        `SELECT stepsTarget, activityMinutesTarget, waterGlassesTarget, sleepHoursTarget, habitText, updatedAt
         FROM wellnessGoals WHERE userId = ?`,
        userId
      ),
      database.all(
        `SELECT id, date, steps, activityMinutes, waterGlasses, sleepHours, habitDone, createdAt, updatedAt
         FROM wellnessLogs WHERE userId = ? ORDER BY date, id`,
        userId
      ),
      database.all(
        `SELECT id, kind, title, remindOn, done, doneAt, createdAt, updatedAt
         FROM preventionReminders WHERE userId = ? ORDER BY remindOn, id`,
        userId
      ),
      database.all(
        `SELECT id, ownerId, challengeKey, name, startDate, endDate, status, createdAt
         FROM wellnessChallenges
         WHERE ownerId = ? OR id IN (
           SELECT challengeId FROM wellnessChallengeMembers
           WHERE userId = ? OR lower(memberEmail) = (SELECT lower(email) FROM users WHERE id = ?)
         )
         ORDER BY createdAt, id`,
        userId,
        userId,
        userId
      ),
      database.all(
        `SELECT id, challengeId, familyMemberId, userId, memberEmail, memberName, status,
                shareTotals, shareHabit, createdAt, joinedAt, leftAt
         FROM wellnessChallengeMembers
         WHERE userId = ? OR lower(memberEmail) = (SELECT lower(email) FROM users WHERE id = ?)
            OR challengeId IN (SELECT id FROM wellnessChallenges WHERE ownerId = ?)
         ORDER BY challengeId, createdAt, id`,
        userId,
        userId,
        userId
      ),
      database.all(
        `SELECT id, medicineName, doseTime, date, taken
         FROM doseLog WHERE userId = ? ORDER BY date, doseTime, id`,
        userId
      ),
      database.all(
        `SELECT id, fileName, mimeType, insurerName, planName, policyholderName, organizationName,
                policyNumber, memberId, startDate, endDate, insurerPhone, coveragePercent, deductible,
                copay, createdAt
         FROM insurancePolicies WHERE userId = ? ORDER BY createdAt DESC, id DESC`,
        userId
      ),
      database.all(
        `SELECT id, role, content, language, kind, category, conversationId, messageType, payload, reportIds, createdAt
         FROM chatMessages WHERE userId = ? ORDER BY createdAt, id`,
        userId
      ),
      database.all(
        `SELECT id, title, createdAt, updatedAt
         FROM conversations WHERE userId = ? ORDER BY updatedAt DESC, id DESC`,
        userId
      ),
      database.all(
        `SELECT id, reportId, text, documents, done, doneAt, sortOrder
         FROM referralSteps WHERE userId = ? ORDER BY reportId, sortOrder, id`,
        userId
      ),
      database.all(
        `SELECT id, eventKey, affectedMembers, createdAt, updatedAt
         FROM familyJourneys WHERE userId = ? ORDER BY createdAt, id`,
        userId
      ),
      database.all(
        `SELECT id, journeyId, stepKey, position, details, completed, createdAt, updatedAt
         FROM familyJourneySteps WHERE userId = ? ORDER BY journeyId, position, id`,
        userId
      ),
      database.all(
        `SELECT memberName, memberEmail, role, permissions, status, createdAt,
                consentAcknowledgedAt, consentVersion, revokedAt
         FROM familyMembers WHERE ownerId = ? ORDER BY createdAt, id`,
        userId
      ),
      database.all(
        `SELECT role, permissions, status, createdAt, consentAcknowledgedAt, consentVersion, revokedAt
         FROM familyMembers
         WHERE lower(memberEmail) = (SELECT lower(email) FROM users WHERE id = ?)
         ORDER BY createdAt, id`,
        userId
      ),
      database.all(
        `SELECT id, reportId, sourceKey, title, dueDate, status, claimedById, claimedByEmail,
                claimedAt, doneAt, createdAt, updatedAt
         FROM careTasks WHERE ownerId = ? ORDER BY createdAt, id`,
        userId
      ),
      database.all(
        `SELECT id, reportId, authorId, authorEmail, authorName, text, resolved, createdAt
         FROM sharedQuestions WHERE ownerId = ? OR authorId = ? ORDER BY createdAt, id`,
        userId,
        userId
      ),
      database.all(
        `SELECT id, reportId, status, includeOriginal, createdAt, expiresAt, revokedAt
         FROM shares WHERE ownerId = ? ORDER BY createdAt DESC, id DESC`,
        userId
      ),
      database.all(
        `SELECT consentId, dataCategories, resourceId, recipientType, recipient, purpose, optional,
                grantedAt, expiresAt, status, revokedAt, consentVersion
         FROM consents WHERE userId = ? ORDER BY COALESCE(grantedAt, expiresAt), consentId`,
        userId
      ),
      database.all(
        `SELECT consentId, eventType, timestamp, consentVersion, details
         FROM consentEvents WHERE userId = ? ORDER BY timestamp, id`,
        userId
      )
    ]);
    if (!user) return res.status(401).json({ error: "Please log in again" });
    const result = {
      exportedAt: new Date().toISOString(),
      profile: profile ? {
        ...profile,
        allergies: JSON.parse(profile.allergies || "[]"),
        easyRead: profile.easyRead === 1,
        accessNeeds: JSON.parse(profile.accessNeeds || '{"needs":[],"note":"","includeOnCareCard":false}')
      } : null,
      reports: reports.map((report) => ({
        id: report.id,
        type: report.type,
        date: report.createdAt,
        confirmedValues: JSON.parse(report.extractedValues || "[]"),
        documentDetails: JSON.parse(report.documentDetails || "{}")
      })),
      appointments,
      reminders,
      healthMetrics,
      wellnessGoals,
      wellnessLogs,
      preventionReminders,
      wellnessChallenges,
      wellnessChallengeMembers,
      doseLog,
      insurancePolicies: insurancePolicies.map((policy) => ({
        ...policy,
        policyNumber: maskPolicyNumber(policy.policyNumber)
      })),
      chatMessages,
      conversations,
      referralSteps,
      familyJourneys: familyJourneys.map((journey) => ({
        ...journey,
        affectedMembers: JSON.parse(journey.affectedMembers || "[]")
      })),
      familyJourneySteps: familyJourneySteps.map((step) => ({
        ...step,
        details: JSON.parse(step.details || "{}"),
        completed: step.completed === 1
      })),
      familyMembers: familyMembers.map((member) => ({
        ...member,
        permissions: JSON.parse(member.permissions || "{}")
      })),
      familyAccess: familyAccess.map((access) => ({
        ...access,
        permissions: JSON.parse(access.permissions || "{}")
      })),
      careTasks,
      sharedQuestions: sharedQuestions.map((question) => ({
        ...question,
        resolved: question.resolved === 1
      })),
      shares,
      consents: consents.map((consent) => ({
        ...consent,
        dataCategories: JSON.parse(consent.dataCategories || "[]"),
        optional: consent.optional === 1
      })),
      consentEvents,
      account: { email: user.email, language: user.language }
    };
    res.set("Cache-Control", "no-store");
    res.set("Content-Disposition", 'attachment; filename="hayat-ai-data.json"');
    return res.type("application/json").send(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    return next(error);
  }
});

router.delete("/", async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await database.get("SELECT email FROM users WHERE id = ?", userId);
    if (!user) return res.status(401).json({ error: "Please log in again" });

    const userFiles = await getUserFiles(userId);
    await database.run("BEGIN IMMEDIATE");
    try {
      await database.run(
        `UPDATE accessLog
         SET userId = 0, ownerId = NULL, viewerId = NULL, viewerEmail = NULL, reportId = NULL,
             details = 'Account deleted'
         WHERE userId = ? OR ownerId = ? OR viewerId = ? OR lower(COALESCE(viewerEmail, '')) = lower(?)`,
        userId,
        userId,
        userId,
        user.email
      );
      await database.run(
        `INSERT INTO consentEvents (consentId, userId, eventType, consentVersion, details)
         SELECT consentId, userId, 'revocation', consentVersion, 'Consent revoked because the account was deleted'
         FROM consents WHERE userId = ? AND status = 'granted'`,
        userId
      );
      await database.run(
        `UPDATE consentEvents
         SET userId = 0, details = 'Account deleted'
         WHERE userId = ?`,
        userId
      );
      await database.run(
        `UPDATE consents
         SET userId = 0, dataCategories = '[]', resourceId = NULL, recipient = 'Account deleted',
             purpose = 'account_deleted', optional = 0,
             revokedAt = CASE WHEN status = 'granted' THEN CURRENT_TIMESTAMP ELSE revokedAt END,
             status = CASE WHEN status = 'granted' THEN 'revoked' ELSE status END
         WHERE userId = ?`,
        userId
      );
      await database.run(
        `DELETE FROM sharedTranslationGenerations
         WHERE viewerId = ? OR shareId IN (
           SELECT id FROM shares WHERE ownerId = ? OR lower(sharedWithEmail) = lower(?)
         )`,
        userId,
        userId,
        user.email
      );
      await database.run(
        "DELETE FROM shares WHERE ownerId = ? OR lower(sharedWithEmail) = lower(?)",
        userId,
        user.email
      );
      await database.run(
        "DELETE FROM sharedQuestions WHERE ownerId = ? OR authorId = ?",
        userId,
        userId
      );
      await database.run(
        `DELETE FROM wellnessChallengeMembers
         WHERE userId = ? OR lower(memberEmail) = lower(?)
            OR challengeId IN (SELECT id FROM wellnessChallenges WHERE ownerId = ?)`,
        userId,
        user.email,
        userId
      );
      await database.run("DELETE FROM wellnessChallenges WHERE ownerId = ?", userId);
      await database.run("DELETE FROM wellnessGoals WHERE userId = ?", userId);
      await database.run("DELETE FROM wellnessLogs WHERE userId = ?", userId);
      await database.run("DELETE FROM preventionReminders WHERE userId = ?", userId);
      await database.run(
        "DELETE FROM familyMembers WHERE ownerId = ? OR lower(memberEmail) = lower(?)",
        userId,
        user.email
      );
      await database.run(
        `UPDATE careTasks SET status = 'open', claimedById = NULL, claimedByEmail = NULL,
         claimedAt = NULL, doneAt = NULL, updatedAt = CURRENT_TIMESTAMP
         WHERE claimedById = ?`,
        userId
      );
      await database.run("DELETE FROM careTasks WHERE ownerId = ?", userId);
      await database.run("DELETE FROM referralSteps WHERE userId = ?", userId);
      await database.run("DELETE FROM familyJourneySteps WHERE userId = ?", userId);
      await database.run("DELETE FROM familyJourneys WHERE userId = ?", userId);
      await database.run("DELETE FROM chatMessages WHERE userId = ?", userId);
      await database.run("DELETE FROM conversations WHERE userId = ?", userId);
      await database.run("DELETE FROM healthMetrics WHERE userId = ?", userId);
      await database.run("DELETE FROM reports WHERE userId = ?", userId);
      await database.run("DELETE FROM insurancePolicies WHERE userId = ?", userId);
      await database.run("DELETE FROM profiles WHERE userId = ?", userId);
      await database.run("DELETE FROM reminders WHERE userId = ?", userId);
      await database.run("DELETE FROM doseLog WHERE userId = ?", userId);
      await database.run("DELETE FROM appointments WHERE userId = ?", userId);
      await database.run("DELETE FROM users WHERE id = ?", userId);
      await database.run("COMMIT");
    } catch (error) {
      await database.run("ROLLBACK");
      throw error;
    }
    await Promise.all(userFiles.map((filePath) => fs.rm(filePath, { force: true })));
    await insuranceRouter.clearPendingUploadsForUser?.(userId);
    return res.json({ deleted: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
