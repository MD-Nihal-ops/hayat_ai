const express = require("express");
const { randomUUID } = require("node:crypto");
const {
  eventDefinitions,
  supportedEventKeys,
  buildJourneySteps
} = require("../config/familyFirstEvents");
const { evaluateFamilyFirstEvent, validateAnswers } = require("../services/familyFirstRules");

const relationships = new Set(["self", "child", "partner", "parent", "other"]);

function userIdFromRequest(req, res) {
  const userId = Number(req.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: "Please log in again" });
    return null;
  }
  return userId;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function journeyResponse(journey, rows) {
  const allowedStepKeys = new Set(buildJourneySteps(journey.eventKey).map((step) => step.stepKey));
  const steps = rows
    .map((row) => ({ ...row, parsedDetails: parseJson(row.details, {}) }))
    .filter((row) => allowedStepKeys.has(row.stepKey) ||
      (row.stepKey.startsWith("user_") && row.parsedDetails.userEntered === true))
    .map((row) => ({
      id: row.id,
      stepKey: row.stepKey,
      position: row.position,
      details: row.parsedDetails,
      origin: row.parsedDetails.userEntered === true ? "user_entered" : "official",
      progressStatus: ["not_started", "in_progress", "completed"].includes(row.progressStatus)
        ? row.progressStatus
        : row.completed === 1 ? "completed" : "not_started",
      completed: row.progressStatus === "completed" || row.completed === 1,
      updatedAt: row.updatedAt
    }));
  const completedKeys = new Set(steps.filter((step) => step.completed).map((step) => step.stepKey));
  let pendingAssigned = false;
  const stepsWithStatus = steps.map((step) => {
    if (step.completed) return { ...step, status: "completed" };
    if (step.details.dependsOn?.some((key) => !completedKeys.has(key))) {
      return { ...step, status: "blocked" };
    }
    if (!pendingAssigned) {
      pendingAssigned = true;
      return { ...step, status: "pending" };
    }
    return { ...step, status: "upcoming" };
  });
  const completedCount = steps.filter((step) => step.progressStatus === "completed").length;
  const inProgressCount = steps.filter((step) => step.progressStatus === "in_progress").length;
  const nextStep = stepsWithStatus.find((step) => step.progressStatus !== "completed") || null;
  const event = eventDefinitions[journey.eventKey];

  return {
    id: journey.id,
    eventKey: journey.eventKey,
    titleKey: event.titleKey,
    descriptionKey: event.descriptionKey,
    journeyStatus: event.journeyStatus,
    missingInformationKey: event.missingInformationKey,
    sources: event.sources,
    entities: event.entities,
    services: event.services,
    informationStatus: event.informationStatus,
    affectedMembers: parseJson(journey.affectedMembers, []),
    createdAt: journey.createdAt,
    updatedAt: journey.updatedAt,
    progress: {
      completed: completedCount,
      inProgress: inProgressCount,
      total: steps.length,
      percent: steps.length ? Math.round((completedCount / steps.length) * 100) : null
    },
    nextStepKey: nextStep?.stepKey || null,
    steps: stepsWithStatus
  };
}

function createFamilyFirstRouter(databaseClient) {
  if (!databaseClient) throw new Error("Family First requires a database client");
  const router = express.Router();

  async function loadJourney(userId, journeyId) {
    const journey = await databaseClient.get(
      "SELECT id, userId, eventKey, affectedMembers, createdAt, updatedAt FROM familyJourneys WHERE id = ? AND userId = ?",
      journeyId,
      userId
    );
    if (!journey) return null;
    const steps = await databaseClient.all(
      `SELECT id, stepKey, position, details, completed, progressStatus, updatedAt
       FROM familyJourneySteps WHERE journeyId = ? AND userId = ? ORDER BY position, id`,
      journeyId,
      userId
    );
    return journeyResponse(journey, steps);
  }

  function normalizeMembers(value) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 8) return null;
    const members = [];
    for (const member of value) {
      const label = typeof member?.label === "string" ? member.label.trim() : "";
      if (!label || label.length > 40 || !relationships.has(member?.relationship)) return null;
      members.push({ label, relationship: member.relationship });
    }
    return members;
  }

  function hasCompletedDependents(stepKey, steps) {
    const affectedKeys = new Set([stepKey]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const step of steps) {
        if (step.completed && step.details.dependsOn?.some((key) => affectedKeys.has(key))) {
          return true;
        }
        if (step.details.dependsOn?.some((key) => affectedKeys.has(key)) && !affectedKeys.has(step.stepKey)) {
          affectedKeys.add(step.stepKey);
          changed = true;
        }
      }
    }
    return false;
  }

  router.get("/events", (req, res) => {
    const userId = userIdFromRequest(req, res);
    if (userId === null) return;
    return res.json(supportedEventKeys
      .filter((eventKey) => eventDefinitions[eventKey])
      .map((eventKey) => {
        const event = eventDefinitions[eventKey];
        return {
          eventKey,
          titleKey: event.titleKey,
          descriptionKey: event.descriptionKey,
          journeyStatus: event.journeyStatus,
          missingInformationKey: event.missingInformationKey,
          sources: event.sources,
          entities: event.entities,
          services: event.services,
          informationStatus: event.informationStatus
        };
      }));
  });

  router.post("/evaluate", (req, res) => {
    const userId = userIdFromRequest(req, res);
    if (userId === null) return;
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some((key) => !["eventKey", "answers"].includes(key)) ||
        !supportedEventKeys.includes(body.eventKey)) {
      return res.status(400).json({ error: "Select one supported life event" });
    }
    const answers = body.answers === undefined ? {} : body.answers;
    if (!validateAnswers(body.eventKey, answers)) {
      return res.status(400).json({ error: "Answers contain an unsupported field or value" });
    }
    return res.json(evaluateFamilyFirstEvent(body.eventKey, answers));
  });

  router.get("/", async (req, res, next) => {
    const userId = userIdFromRequest(req, res);
    if (userId === null) return;
    try {
      const journeys = await databaseClient.all(
        `SELECT id, userId, eventKey, affectedMembers, createdAt, updatedAt
         FROM familyJourneys WHERE userId = ? ORDER BY updatedAt DESC, id DESC`,
        userId
      );
      const result = await Promise.all(journeys.map(async (journey) => {
        const steps = await databaseClient.all(
          `SELECT id, stepKey, position, details, completed, progressStatus, updatedAt
           FROM familyJourneySteps WHERE journeyId = ? AND userId = ? ORDER BY position, id`,
          journey.id,
          userId
        );
        return journeyResponse(journey, steps);
      }));
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    const userId = userIdFromRequest(req, res);
    if (userId === null) return;
    const { eventKey } = req.body || {};
    const members = normalizeMembers(req.body?.affectedMembers);
    if (!supportedEventKeys.includes(eventKey) || !members) {
      return res.status(400).json({ error: "Select an event and add 1 to 8 sample family member labels" });
    }

    try {
      await databaseClient.run("BEGIN IMMEDIATE");
      let journeyId;
      try {
        const inserted = await databaseClient.run(
          "INSERT INTO familyJourneys (userId, eventKey, affectedMembers) VALUES (?, ?, ?)",
          userId,
          eventKey,
          JSON.stringify(members)
        );
        journeyId = inserted.lastID;
        const steps = buildJourneySteps(eventKey);
        for (let position = 0; position < steps.length; position += 1) {
          const step = steps[position];
          await databaseClient.run(
            `INSERT INTO familyJourneySteps
             (journeyId, userId, stepKey, position, details)
             VALUES (?, ?, ?, ?, ?)`,
            journeyId,
            userId,
            step.stepKey,
            position,
            JSON.stringify(step)
          );
        }
        await databaseClient.run("COMMIT");
      } catch (error) {
        await databaseClient.run("ROLLBACK");
        throw error;
      }
      return res.status(201).json(await loadJourney(userId, journeyId));
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:journeyId", async (req, res, next) => {
    const userId = userIdFromRequest(req, res);
    if (userId === null) return;
    const journeyId = Number(req.params.journeyId);
    if (!Number.isInteger(journeyId) || journeyId <= 0) {
      return res.status(404).json({ error: "Journey not found" });
    }
    try {
      const journey = await loadJourney(userId, journeyId);
      if (!journey) return res.status(404).json({ error: "Journey not found" });
      return res.json(journey);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:journeyId/steps", async (req, res, next) => {
    const userId = userIdFromRequest(req, res);
    if (userId === null) return;
    const journeyId = Number(req.params.journeyId);
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!Number.isInteger(journeyId) || journeyId <= 0 || !text || text.length > 180) {
      return res.status(400).json({ error: "Enter a progress item of 1 to 180 characters" });
    }

    try {
      const journey = await databaseClient.get(
        "SELECT id FROM familyJourneys WHERE id = ? AND userId = ?",
        journeyId,
        userId
      );
      if (!journey) return res.status(404).json({ error: "Journey not found" });
      const rows = await databaseClient.all(
        "SELECT position FROM familyJourneySteps WHERE journeyId = ? AND userId = ? ORDER BY position DESC LIMIT 1",
        journeyId,
        userId
      );
      const position = rows.length ? rows[0].position + 1 : 0;
      const stepKey = `user_${randomUUID()}`;
      await databaseClient.run(
        `INSERT INTO familyJourneySteps (journeyId, userId, stepKey, position, details, progressStatus)
         VALUES (?, ?, ?, ?, ?, 'not_started')`,
        journeyId,
        userId,
        stepKey,
        position,
        JSON.stringify({ text, userEntered: true })
      );
      await databaseClient.run(
        "UPDATE familyJourneys SET updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?",
        journeyId,
        userId
      );
      return res.status(201).json(await loadJourney(userId, journeyId));
    } catch (error) {
      return next(error);
    }
  });

  router.patch("/:journeyId/steps/:stepId", async (req, res, next) => {
    const userId = userIdFromRequest(req, res);
    if (userId === null) return;
    const journeyId = Number(req.params.journeyId);
    const stepId = Number(req.params.stepId);
    if (!Number.isInteger(journeyId) || journeyId <= 0 || !Number.isInteger(stepId) || stepId <= 0 ||
        !req.body || typeof req.body !== "object" || Array.isArray(req.body) ||
        Object.keys(req.body).some((key) => !["completed", "status"].includes(key)) ||
        (typeof req.body.status !== "string" && typeof req.body.completed !== "boolean") ||
        (req.body.status !== undefined && !["not_started", "in_progress", "completed"].includes(req.body.status)) ||
        (req.body.status !== undefined && req.body.completed !== undefined)) {
      return res.status(400).json({ error: "A valid user progress status is required" });
    }
    const progressStatus = req.body.status ||
      (req.body.completed ? "completed" : "not_started");

    try {
      const journey = await databaseClient.get(
        "SELECT id, eventKey FROM familyJourneys WHERE id = ? AND userId = ?",
        journeyId,
        userId
      );
      if (!journey) return res.status(404).json({ error: "Journey not found" });
      const rows = await databaseClient.all(
        `SELECT id, stepKey, details, completed, progressStatus FROM familyJourneySteps
         WHERE journeyId = ? AND userId = ? ORDER BY position, id`,
        journeyId,
        userId
      );
      const target = rows.find((row) => row.id === stepId);
      const supportedStepKeys = new Set(buildJourneySteps(journey.eventKey).map((step) => step.stepKey));
      const targetDetails = parseJson(target?.details, {});
      const isUserEntered = target?.stepKey.startsWith("user_") && targetDetails.userEntered === true;
      if (!target || (!supportedStepKeys.has(target.stepKey) && !isUserEntered)) {
        return res.status(404).json({ error: "Journey step not found" });
      }
      const steps = rows.map((row) => ({ ...row, details: parseJson(row.details, {}) }));
      const completedKeys = new Set(steps.filter((step) => step.completed === 1).map((step) => step.stepKey));
      if (progressStatus === "completed" && targetDetails.dependsOn?.some((key) => !completedKeys.has(key))) {
        return res.status(409).json({ error: "Complete this step's prerequisites first" });
      }
      if (progressStatus !== "completed" && hasCompletedDependents(target.stepKey, steps)) {
        return res.status(409).json({ error: "Uncomplete dependent steps first" });
      }

      await databaseClient.run(
        `UPDATE familyJourneySteps SET completed = ?, progressStatus = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ? AND journeyId = ? AND userId = ?`,
        progressStatus === "completed" ? 1 : 0,
        progressStatus,
        stepId,
        journeyId,
        userId
      );
      await databaseClient.run(
        "UPDATE familyJourneys SET updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?",
        journeyId,
        userId
      );
      return res.json(await loadJourney(userId, journeyId));
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

let defaultRouter;

function familyFirstRouter(req, res, next) {
  if (!defaultRouter) {
    defaultRouter = createFamilyFirstRouter(require("../database"));
  }
  return defaultRouter(req, res, next);
}

familyFirstRouter.createFamilyFirstRouter = createFamilyFirstRouter;

module.exports = familyFirstRouter;