const express = require("express");
const database = require("../database");
const sources = require("../data/wellnessSources.json");

const router = express.Router();
const sampleChallenges = new Map(sources.filter((source) => source.kind === "sample").map((source) => [source.id, source]));
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const goalLimits = {
  stepsTarget: [0, 150000, true],
  activityMinutesTarget: [0, 1440, true],
  waterGlassesTarget: [0, 100, true],
  sleepHoursTarget: [0, 24, false]
};
const logLimits = {
  steps: [0, 150000, true],
  activityMinutes: [0, 1440, true],
  waterGlasses: [0, 100, true],
  sleepHours: [0, 24, false]
};

function userIdFromRequest(req, res) {
  const userId = Number(req.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: "Please log in again" });
    return null;
  }
  return userId;
}

function isValidDate(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function dateOffset(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculateStreak(logs, targetDate) {
  if (!logs.length) return 0;
  let expectedDate = logs[0].date === targetDate ? targetDate : dateOffset(targetDate, -1);
  let missedDayUsed = false;
  let streak = 0;
  for (const log of logs) {
    const gap = Math.round((Date.parse(`${expectedDate}T00:00:00Z`) - Date.parse(`${log.date}T00:00:00Z`)) / 86400000);
    if (gap === 1 && !missedDayUsed) missedDayUsed = true;
    else if (gap !== 0) break;
    streak += 1;
    expectedDate = dateOffset(log.date, -1);
  }
  return streak;
}

function numberInRange(value, [minimum, maximum, integer]) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum || (integer && !Number.isInteger(number))) {
    return null;
  }
  return number;
}

function parseNumberFields(body, limits) {
  const result = {};
  for (const [field, range] of Object.entries(limits)) {
    const value = numberInRange(body[field], range);
    if (value === null) return null;
    result[field] = value;
  }
  return result;
}

async function logChallengeAccess({ ownerId, viewerId, viewerEmail, action, details }) {
  await database.run(
    `INSERT INTO accessLog (userId, ownerId, viewerId, viewerEmail, action, details, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    ownerId,
    ownerId,
    viewerId,
    viewerEmail,
    action,
    details
  );
}

async function hasActiveFamilyLink(ownerId, familyMemberId, email) {
  if (!familyMemberId) return false;
  return Boolean(await database.get(
    `SELECT id FROM familyMembers
     WHERE id = ? AND ownerId = ? AND lower(memberEmail) = lower(?) AND role = 'caregiver' AND status = 'active'`,
    familyMemberId,
    ownerId,
    email
  ));
}

async function getSharedTotals(challenge, viewerId, viewerEmail) {
  const linkCheck = `(
    cm.userId = ? OR EXISTS (
      SELECT 1 FROM familyMembers fm
      WHERE fm.id = cm.familyMemberId AND fm.ownerId = ? AND fm.role = 'caregiver'
        AND fm.status = 'active' AND lower(fm.memberEmail) = lower(cm.memberEmail)
    )
  )`;
  const totals = await database.get(
    `SELECT
       SUM(wl.steps) AS steps,
       SUM(wl.activityMinutes) AS activityMinutes,
       SUM(wl.waterGlasses) AS waterGlasses,
       ROUND(SUM(wl.sleepHours), 1) AS sleepHours
     FROM wellnessLogs wl
     JOIN wellnessChallengeMembers cm ON cm.userId = wl.userId
     WHERE cm.challengeId = ? AND cm.status = 'joined' AND cm.shareTotals = 1
       AND ${linkCheck} AND wl.date BETWEEN ? AND ?`,
    challenge.id,
    challenge.ownerId,
    challenge.ownerId,
    challenge.startDate,
    challenge.endDate
  );
  const habit = await database.get(
    `SELECT SUM(wl.habitDone) AS habitTicks
     FROM wellnessLogs wl
     JOIN wellnessChallengeMembers cm ON cm.userId = wl.userId
     WHERE cm.challengeId = ? AND cm.status = 'joined' AND cm.shareHabit = 1
       AND ${linkCheck} AND wl.date BETWEEN ? AND ?`,
    challenge.id,
    challenge.ownerId,
    challenge.ownerId,
    challenge.startDate,
    challenge.endDate
  );
  await logChallengeAccess({
    ownerId: challenge.ownerId,
    viewerId,
    viewerEmail,
    action: "wellness_challenge_viewed",
    details: "Viewed opted-in family challenge totals"
  });
  const sharedTotals = Object.values(totals || {}).some((value) => value !== null && value !== undefined);
  return {
    sharedTotals: sharedTotals ? {
      steps: Number(totals.steps || 0),
      activityMinutes: Number(totals.activityMinutes || 0),
      waterGlasses: Number(totals.waterGlasses || 0),
      sleepHours: Number(totals.sleepHours || 0)
    } : null,
    sharedHabitTicks: habit?.habitTicks == null ? null : Number(habit.habitTicks)
  };
}

async function membershipFor(challengeId, userId, email) {
  return database.get(
    `SELECT cm.*, c.ownerId, c.startDate, c.endDate, c.name
     FROM wellnessChallengeMembers cm
     JOIN wellnessChallenges c ON c.id = cm.challengeId
     WHERE cm.challengeId = ? AND cm.status IN ('invited', 'joined')
       AND (cm.userId = ? OR lower(cm.memberEmail) = lower(?))`,
    challengeId,
    userId,
    email
  );
}

router.get("/", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const date = isValidDate(req.query.date) ? req.query.date : todayDate();
  const weekStart = dateOffset(date, -6);
  try {
    const [goals, todayLog, weeklyLogs, preventionReminders, streakLogs] = await Promise.all([
      database.get("SELECT stepsTarget, activityMinutesTarget, waterGlassesTarget, sleepHoursTarget, habitText, updatedAt FROM wellnessGoals WHERE userId = ?", userId),
      database.get("SELECT date, steps, activityMinutes, waterGlasses, sleepHours, habitDone FROM wellnessLogs WHERE userId = ? AND date = ?", userId, date),
      database.all(
        `SELECT date, steps, activityMinutes, waterGlasses, sleepHours, habitDone
         FROM wellnessLogs WHERE userId = ? AND date BETWEEN ? AND ? ORDER BY date DESC`,
        userId,
        weekStart,
        date
      ),
      database.all(
        `SELECT id, kind, title, remindOn, done, doneAt
         FROM preventionReminders WHERE userId = ? ORDER BY done, remindOn, id`,
        userId
      ),
      database.all("SELECT date FROM wellnessLogs WHERE userId = ? ORDER BY date DESC", userId)
    ]);
    return res.json({
      sources,
      goals: goals || null,
      todayLog: todayLog || null,
      weeklyLogs,
      preventionReminders,
      streak: calculateStreak(streakLogs, date)
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/goals", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => ![...Object.keys(goalLimits), "habitText"].includes(key)) ||
      Object.keys(goalLimits).some((key) => !Object.hasOwn(body, key)) || typeof body.habitText !== "string" ||
      body.habitText.trim().length > 60) {
    return res.status(400).json({ error: "Enter valid daily goals and a habit of 60 characters or fewer" });
  }
  const goals = parseNumberFields(body, goalLimits);
  if (!goals) return res.status(400).json({ error: "One or more daily goals are invalid" });
  try {
    await database.run(
      `INSERT INTO wellnessGoals
        (userId, stepsTarget, activityMinutesTarget, waterGlassesTarget, sleepHoursTarget, habitText, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(userId) DO UPDATE SET
         stepsTarget = excluded.stepsTarget,
         activityMinutesTarget = excluded.activityMinutesTarget,
         waterGlassesTarget = excluded.waterGlassesTarget,
         sleepHoursTarget = excluded.sleepHoursTarget,
         habitText = excluded.habitText,
         updatedAt = CURRENT_TIMESTAMP`,
      userId,
      goals.stepsTarget,
      goals.activityMinutesTarget,
      goals.waterGlassesTarget,
      goals.sleepHoursTarget,
      body.habitText.trim()
    );
    return res.json(await database.get(
      "SELECT stepsTarget, activityMinutesTarget, waterGlassesTarget, sleepHoursTarget, habitText, updatedAt FROM wellnessGoals WHERE userId = ?",
      userId
    ));
  } catch (error) {
    return next(error);
  }
});

router.put("/logs", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const body = req.body;
  const date = body?.date;
  if (!body || typeof body !== "object" || Array.isArray(body) || !isValidDate(date) || date > dateOffset(todayDate(), 1) ||
      date < dateOffset(todayDate(), -365) || typeof body.habitDone !== "boolean") {
    return res.status(400).json({ error: "Enter a valid daily check-in date and habit status" });
  }
  const values = {};
  for (const [field, range] of Object.entries(logLimits)) {
    if (body[field] === null || body[field] === undefined || body[field] === "") {
      values[field] = null;
      continue;
    }
    values[field] = numberInRange(body[field], range);
    if (values[field] === null) return res.status(400).json({ error: "One or more check-in values are invalid" });
  }
  if (Object.values(values).every((value) => value === null) && !body.habitDone) {
    return res.status(400).json({ error: "Enter at least one check-in value" });
  }
  try {
    await database.run(
      `INSERT INTO wellnessLogs
        (userId, date, steps, activityMinutes, waterGlasses, sleepHours, habitDone, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(userId, date) DO UPDATE SET
         steps = excluded.steps,
         activityMinutes = excluded.activityMinutes,
         waterGlasses = excluded.waterGlasses,
         sleepHours = excluded.sleepHours,
         habitDone = excluded.habitDone,
         updatedAt = CURRENT_TIMESTAMP`,
      userId,
      date,
      values.steps,
      values.activityMinutes,
      values.waterGlasses,
      values.sleepHours,
      body.habitDone ? 1 : 0
    );
    return res.json(await database.get(
      "SELECT date, steps, activityMinutes, waterGlasses, sleepHours, habitDone FROM wellnessLogs WHERE userId = ? AND date = ?",
      userId,
      date
    ));
  } catch (error) {
    return next(error);
  }
});

router.post("/prevention", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const { kind, title, remindOn } = req.body || {};
  const cleanTitle = typeof title === "string" ? title.trim() : "";
  if (!["checkup", "vaccination"].includes(kind) || !cleanTitle || cleanTitle.length > 100 || !isValidDate(remindOn)) {
    return res.status(400).json({ error: "Enter a type, title, and valid date" });
  }
  try {
    const result = await database.run(
      "INSERT INTO preventionReminders (userId, kind, title, remindOn) VALUES (?, ?, ?, ?)",
      userId,
      kind,
      cleanTitle,
      remindOn
    );
    return res.status(201).json(await database.get(
      "SELECT id, kind, title, remindOn, done, doneAt FROM preventionReminders WHERE id = ? AND userId = ?",
      result.lastID,
      userId
    ));
  } catch (error) {
    return next(error);
  }
});

router.patch("/prevention/:id", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  if (typeof req.body?.done !== "boolean" || Object.keys(req.body).some((key) => key !== "done")) {
    return res.status(400).json({ error: "A reminder status is required" });
  }
  try {
    const result = await database.run(
      `UPDATE preventionReminders SET done = ?, doneAt = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ? AND userId = ?`,
      req.body.done ? 1 : 0,
      req.body.done ? new Date().toISOString() : null,
      req.params.id,
      userId
    );
    if (!result.changes) return res.status(404).json({ error: "Reminder not found" });
    return res.json(await database.get(
      "SELECT id, kind, title, remindOn, done, doneAt FROM preventionReminders WHERE id = ? AND userId = ?",
      req.params.id,
      userId
    ));
  } catch (error) {
    return next(error);
  }
});

router.delete("/prevention/:id", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const result = await database.run("DELETE FROM preventionReminders WHERE id = ? AND userId = ?", req.params.id, userId);
    if (!result.changes) return res.status(404).json({ error: "Reminder not found" });
    return res.json({ deleted: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/challenges", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const user = await database.get("SELECT email FROM users WHERE id = ?", userId);
    if (!user) return res.status(401).json({ error: "Please log in again" });
    const owned = await database.all(
      `SELECT c.*, cm.id AS membershipId, cm.status AS memberStatus, cm.shareTotals, cm.shareHabit
       FROM wellnessChallenges c
       LEFT JOIN wellnessChallengeMembers cm ON cm.challengeId = c.id AND cm.userId = c.ownerId
       WHERE c.ownerId = ? ORDER BY c.createdAt DESC, c.id DESC`,
      userId
    );
    const incoming = await database.all(
      `SELECT c.*, cm.id AS membershipId, cm.status AS memberStatus, cm.shareTotals, cm.shareHabit,
              owner.email AS ownerEmail, p.fullName AS ownerName
       FROM wellnessChallengeMembers cm
       JOIN wellnessChallenges c ON c.id = cm.challengeId
       JOIN users owner ON owner.id = c.ownerId
       LEFT JOIN profiles p ON p.userId = c.ownerId
       WHERE c.ownerId != ? AND cm.status IN ('invited', 'joined')
         AND (cm.userId = ? OR (cm.userId IS NULL AND lower(cm.memberEmail) = lower(?)))
       ORDER BY c.createdAt DESC, c.id DESC`,
      userId,
      userId,
      user.email
    );
    const format = async (challenge, ownerView) => {
      const familyMemberId = ownerView ? null : challenge.familyMemberId;
      const familyLinkActive = ownerView || await hasActiveFamilyLink(challenge.ownerId, familyMemberId, user.email);
      if (!familyLinkActive && challenge.memberStatus === "invited") return null;
      const response = {
        id: challenge.id,
        challengeKey: challenge.challengeKey,
        name: challenge.name,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        status: challenge.endDate < todayDate() ? "ended" : "active",
        memberStatus: challenge.memberStatus,
        familyLinkActive,
        shareTotals: challenge.shareTotals === 1,
        shareHabit: challenge.shareHabit === 1,
        ownerName: ownerView ? "" : challenge.ownerName?.trim() || challenge.ownerEmail,
        invitedMembers: []
      };
      if (ownerView) {
        const members = await database.all(
          `SELECT id, memberName, status FROM wellnessChallengeMembers
           WHERE challengeId = ? AND (userId IS NULL OR userId != ?) ORDER BY createdAt, id`,
          challenge.id,
          userId
        );
        response.invitedMembers = members.map((member) => ({
          id: member.id,
          name: member.memberName,
          status: member.status
        }));
      }
      if (challenge.memberStatus === "joined" && familyLinkActive) {
        Object.assign(response, await getSharedTotals(challenge, userId, user.email));
      }
      return response;
    };
    const [ownedChallenges, incomingChallenges] = await Promise.all([
      Promise.all(owned.map((challenge) => format(challenge, true))),
      Promise.all(incoming.map((challenge) => format(challenge, false)))
    ]);
    return res.json({ owned: ownedChallenges.filter(Boolean), incoming: incomingChallenges.filter(Boolean) });
  } catch (error) {
    return next(error);
  }
});

router.post("/challenges", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const challengeKey = req.body?.challengeKey;
  const sample = sampleChallenges.get(challengeKey);
  const memberIds = req.body?.familyMemberIds === undefined ? [] : req.body.familyMemberIds;
  if (!sample || !Array.isArray(memberIds) || memberIds.length > 20 ||
      memberIds.some((id) => !Number.isInteger(id) || id <= 0) || new Set(memberIds).size !== memberIds.length) {
    return res.status(400).json({ error: "Choose a sample challenge and valid Family Circle members" });
  }
  try {
    const owner = await database.get(
      `SELECT u.email, COALESCE(NULLIF(trim(p.fullName), ''), u.email) AS name
       FROM users u LEFT JOIN profiles p ON p.userId = u.id WHERE u.id = ?`,
      userId
    );
    if (!owner) return res.status(401).json({ error: "Please log in again" });
    const familyRows = memberIds.length ? await database.all(
      `SELECT id, memberName, memberEmail FROM familyMembers
       WHERE ownerId = ? AND status = 'active' AND role = 'caregiver' AND id IN (${memberIds.map(() => "?").join(",")})`,
      userId,
      ...memberIds
    ) : [];
    if (familyRows.length !== memberIds.length) {
      return res.status(400).json({ error: "Choose active caregiver members from your Family Circle" });
    }
    await database.run("BEGIN IMMEDIATE");
    try {
      const startDate = todayDate();
      const endDate = dateOffset(startDate, 6);
      const challengeResult = await database.run(
        `INSERT INTO wellnessChallenges (ownerId, challengeKey, name, startDate, endDate)
         VALUES (?, ?, ?, ?, ?)`,
        userId,
        sample.id,
        sample.name,
        startDate,
        endDate
      );
      await database.run(
        `INSERT INTO wellnessChallengeMembers
          (challengeId, userId, memberEmail, memberName, status, joinedAt)
         VALUES (?, ?, ?, ?, 'joined', CURRENT_TIMESTAMP)`,
        challengeResult.lastID,
        userId,
        owner.email,
        owner.name
      );
      await logChallengeAccess({
        ownerId: userId,
        viewerId: userId,
        viewerEmail: owner.email,
        action: "wellness_challenge_started",
        details: "Started a sample family challenge"
      });
      for (const member of familyRows) {
        const account = await database.get("SELECT id FROM users WHERE lower(email) = lower(?)", member.memberEmail);
        if (account?.id === userId) throw new Error("Cannot invite your own account");
        await database.run(
          `INSERT INTO wellnessChallengeMembers
            (challengeId, familyMemberId, userId, memberEmail, memberName, status)
           VALUES (?, ?, ?, ?, ?, 'invited')`,
          challengeResult.lastID,
          member.id,
          account?.id || null,
          member.memberEmail,
          member.memberName
        );
        await logChallengeAccess({
          ownerId: userId,
          viewerId: userId,
          viewerEmail: member.memberEmail,
          action: "wellness_challenge_invited",
          details: "Invited a Family Circle member to a sample challenge"
        });
      }
      await database.run("COMMIT");
      return res.status(201).json({ id: challengeResult.lastID });
    } catch (error) {
      await database.run("ROLLBACK");
      throw error;
    }
  } catch (error) {
    return next(error);
  }
});

router.post("/challenges/:id/join", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const { shareTotals, shareHabit } = req.body || {};
  if (typeof shareTotals !== "boolean" || typeof shareHabit !== "boolean" ||
      Object.keys(req.body || {}).some((key) => !["shareTotals", "shareHabit"].includes(key))) {
    return res.status(400).json({ error: "Choose explicit sharing settings before joining" });
  }
  try {
    const user = await database.get("SELECT email FROM users WHERE id = ?", userId);
    const membership = await membershipFor(req.params.id, userId, user?.email || "");
    if (!membership || membership.status !== "invited" || membership.ownerId === userId ||
        !await hasActiveFamilyLink(membership.ownerId, membership.familyMemberId, user.email)) {
      return res.status(404).json({ error: "Invitation not found" });
    }
    await database.run(
      `UPDATE wellnessChallengeMembers SET userId = ?, status = 'joined', shareTotals = ?, shareHabit = ?,
         joinedAt = CURRENT_TIMESTAMP, leftAt = NULL WHERE id = ? AND status = 'invited'`,
      userId,
      shareTotals ? 1 : 0,
      shareHabit ? 1 : 0,
      membership.id
    );
    await logChallengeAccess({
      ownerId: membership.ownerId,
      viewerId: userId,
      viewerEmail: user.email,
      action: "wellness_challenge_joined",
      details: "Joined a sample family challenge"
    });
    return res.json({ joined: true });
  } catch (error) {
    return next(error);
  }
});

router.patch("/challenges/:id/sharing", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const { shareTotals, shareHabit } = req.body || {};
  if (typeof shareTotals !== "boolean" || typeof shareHabit !== "boolean" ||
      Object.keys(req.body || {}).some((key) => !["shareTotals", "shareHabit"].includes(key))) {
    return res.status(400).json({ error: "Choose explicit sharing settings" });
  }
  try {
    const user = await database.get("SELECT email FROM users WHERE id = ?", userId);
    const membership = await database.get(
      `SELECT cm.id, cm.familyMemberId, c.ownerId FROM wellnessChallengeMembers cm
       JOIN wellnessChallenges c ON c.id = cm.challengeId
       WHERE cm.challengeId = ? AND cm.userId = ? AND cm.status = 'joined'`,
      req.params.id,
      userId
    );
    if (!membership || (membership.ownerId !== userId &&
        !await hasActiveFamilyLink(membership.ownerId, membership.familyMemberId, user.email))) {
      return res.status(404).json({ error: "Joined challenge not found" });
    }
    await database.run(
      "UPDATE wellnessChallengeMembers SET shareTotals = ?, shareHabit = ? WHERE id = ?",
      shareTotals ? 1 : 0,
      shareHabit ? 1 : 0,
      membership.id
    );
    await logChallengeAccess({
      ownerId: membership.ownerId,
      viewerId: userId,
      viewerEmail: user.email,
      action: "wellness_challenge_sharing_updated",
      details: "Updated family challenge sharing choices"
    });
    return res.json({ shareTotals, shareHabit });
  } catch (error) {
    return next(error);
  }
});

router.post("/challenges/:id/decline", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const user = await database.get("SELECT email FROM users WHERE id = ?", userId);
    const membership = await membershipFor(req.params.id, userId, user?.email || "");
    if (!membership || membership.status !== "invited" || membership.ownerId === userId ||
        !await hasActiveFamilyLink(membership.ownerId, membership.familyMemberId, user.email)) {
      return res.status(404).json({ error: "Invitation not found" });
    }
    await database.run(
      `UPDATE wellnessChallengeMembers SET status = 'declined', shareTotals = 0, shareHabit = 0,
         leftAt = CURRENT_TIMESTAMP WHERE id = ? AND status = 'invited'`,
      membership.id
    );
    await logChallengeAccess({
      ownerId: membership.ownerId,
      viewerId: userId,
      viewerEmail: user.email,
      action: "wellness_challenge_declined",
      details: "Declined a sample family challenge invitation"
    });
    return res.json({ declined: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/challenges/:id/leave", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const user = await database.get("SELECT email FROM users WHERE id = ?", userId);
    const membership = await membershipFor(req.params.id, userId, user?.email || "");
    if (!membership || membership.ownerId === userId) {
      return res.status(404).json({ error: "Challenge membership not found" });
    }
    await database.run(
      `UPDATE wellnessChallengeMembers SET status = 'left', shareTotals = 0, shareHabit = 0,
         leftAt = CURRENT_TIMESTAMP WHERE id = ?`,
      membership.id
    );
    await logChallengeAccess({
      ownerId: membership.ownerId,
      viewerId: userId,
      viewerEmail: user.email,
      action: "wellness_challenge_left",
      details: "Left a family challenge and stopped sharing"
    });
    return res.json({ left: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
