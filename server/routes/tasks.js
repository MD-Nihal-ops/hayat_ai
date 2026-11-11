const express = require("express");
const database = require("../database");
const { getActiveMembership } = require("../utils/familyAccess");

const taskStatuses = new Set(["open", "claimed", "done"]);

function validDueDate(value) {
  if (value === "" || value === null || value === undefined) return true;
  if (typeof value !== "string") return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }
  const dateTime = value.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/);
  if (!dateTime || !validDueDate(dateTime[1])) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function createTasksRouter(databaseClient = database) {
  const router = express.Router();
  router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  function userIdFromRequest(req, res) {
    if (!Number.isInteger(req.userId) || req.userId <= 0) {
      res.status(401).json({ error: "Please log in again" });
      return null;
    }
    return req.userId;
  }

  async function logTaskAccess(ownerId, actorId, actorEmail, action) {
    await databaseClient.run(
      `INSERT INTO accessLog (userId, ownerId, viewerId, viewerEmail, action, details, timestamp)
       VALUES (?, ?, ?, ?, ?, 'Care task activity', CURRENT_TIMESTAMP)`,
      ownerId,
      ownerId,
      actorId,
      actorEmail,
      action
    );
  }

  async function getTask(taskId, ownerId) {
    return databaseClient.get(
      `SELECT t.id, t.ownerId, t.reportId, t.sourceKey, t.title, t.dueDate, t.status,
              t.claimedById, t.claimedByEmail, t.claimedAt, t.doneAt, t.createdAt, t.updatedAt,
              COALESCE(
                (SELECT fm.memberName FROM familyMembers fm
                 WHERE fm.ownerId = t.ownerId AND lower(fm.memberEmail) = lower(t.claimedByEmail)
                 ORDER BY fm.createdAt DESC, fm.id DESC LIMIT 1),
                (SELECT p.fullName FROM profiles p WHERE p.userId = t.claimedById),
                ''
              ) AS claimedByName
       FROM careTasks t WHERE t.id = ? AND t.ownerId = ?`,
      taskId,
      ownerId
    );
  }

  router.get("/mine", async (req, res, next) => {
    const ownerId = userIdFromRequest(req, res);
    if (ownerId === null) return;
    try {
      const tasks = await databaseClient.all(
        `SELECT t.id, t.reportId, t.sourceKey, t.title, t.dueDate, t.status,
                t.claimedById, t.claimedByEmail, t.claimedAt, t.doneAt, t.createdAt, t.updatedAt,
                COALESCE(
                  (SELECT fm.memberName FROM familyMembers fm
                   WHERE fm.ownerId = t.ownerId AND lower(fm.memberEmail) = lower(t.claimedByEmail)
                   ORDER BY fm.createdAt DESC, fm.id DESC LIMIT 1),
                  (SELECT p.fullName FROM profiles p WHERE p.userId = t.claimedById),
                  ''
                ) AS claimedByName
         FROM careTasks t WHERE t.ownerId = ?
         ORDER BY CASE t.status WHEN 'open' THEN 0 WHEN 'claimed' THEN 1 ELSE 2 END,
                  CASE WHEN t.dueDate IS NULL OR t.dueDate = '' THEN 1 ELSE 0 END,
                  t.dueDate, t.id`,
        ownerId
      );
      return res.json(tasks);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    const ownerId = userIdFromRequest(req, res);
    if (ownerId === null) return;
    const { title, dueDate = "", reportId = null } = req.body || {};
    const taskTitle = typeof title === "string" ? title.trim() : "";
    const numericReportId = reportId == null || reportId === "" ? null : Number(reportId);
    if (taskTitle.length < 1 || taskTitle.length > 120 || !validDueDate(dueDate) ||
        (numericReportId !== null && (!Number.isInteger(numericReportId) || numericReportId <= 0))) {
      return res.status(400).json({ error: "Enter a task title up to 120 characters and a valid due date" });
    }
    try {
      if (numericReportId !== null) {
        const report = await databaseClient.get(
          "SELECT id FROM reports WHERE id = ? AND userId = ?",
          numericReportId,
          ownerId
        );
        if (!report) return res.status(400).json({ error: "Report does not belong to this account" });
      }
      const result = await databaseClient.run(
        `INSERT INTO careTasks (ownerId, reportId, title, dueDate)
         SELECT ?, ?, ?, ?
         WHERE (SELECT COUNT(*) FROM careTasks WHERE ownerId = ?) < 100`,
        ownerId,
        numericReportId,
        taskTitle,
        dueDate || null,
        ownerId
      );
      if (!result.changes) return res.status(409).json({ error: "The 100 task limit has been reached" });
      return res.status(201).json(await getTask(result.lastID, ownerId));
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    const ownerId = userIdFromRequest(req, res);
    if (ownerId === null) return;
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) return res.status(404).json({ error: "Task not found" });
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some((key) => !["title", "dueDate", "status", "releaseClaim"].includes(key)) ||
        Object.keys(body).length === 0) {
      return res.status(400).json({ error: "Valid task changes are required" });
    }
    if (body.releaseClaim !== undefined &&
        (body.releaseClaim !== true || Object.keys(body).length !== 1)) {
      return res.status(400).json({ error: "A claim release must be requested on its own" });
    }
    const title = body.title === undefined ? undefined : typeof body.title === "string" ? body.title.trim() : "";
    const dueDate = body.dueDate;
    if ((title !== undefined && (title.length < 1 || title.length > 120)) ||
        (dueDate !== undefined && !validDueDate(dueDate)) ||
        (body.status !== undefined && (!taskStatuses.has(body.status) || body.status === "claimed"))) {
      return res.status(400).json({ error: "Invalid task title, due date, or status" });
    }
    try {
      const existing = await databaseClient.get(
        "SELECT id, status FROM careTasks WHERE id = ? AND ownerId = ?",
        taskId,
        ownerId
      );
      if (!existing) return res.status(404).json({ error: "Task not found" });
      if (body.releaseClaim === true) {
        if (existing.status !== "claimed") return res.status(409).json({ error: "Task is not claimed" });
        await databaseClient.run(
          `UPDATE careTasks SET status = 'open', claimedById = NULL, claimedByEmail = NULL,
           claimedAt = NULL, doneAt = NULL, updatedAt = CURRENT_TIMESTAMP
           WHERE id = ? AND ownerId = ? AND status = 'claimed'`,
          taskId,
          ownerId
        );
        await logTaskAccess(ownerId, ownerId, null, "task_released");
      } else {
        const nextStatus = body.status;
        const clearClaim = nextStatus === "open";
        const doneAt = nextStatus === "done" ? "CURRENT_TIMESTAMP" : nextStatus === "open" ? "NULL" : "doneAt";
        const columns = [];
        const values = [];
        if (title !== undefined) { columns.push("title = ?"); values.push(title); }
        if (dueDate !== undefined) { columns.push("dueDate = ?"); values.push(dueDate || null); }
        if (nextStatus !== undefined) {
          columns.push("status = ?");
          values.push(nextStatus);
          columns.push(`doneAt = ${doneAt}`);
          if (clearClaim) columns.push("claimedById = NULL", "claimedByEmail = NULL", "claimedAt = NULL");
        }
        columns.push("updatedAt = CURRENT_TIMESTAMP");
        await databaseClient.run(
          `UPDATE careTasks SET ${columns.join(", ")} WHERE id = ? AND ownerId = ?`,
          ...values,
          taskId,
          ownerId
        );
        if (existing.status === "claimed" && nextStatus === "open") {
          await logTaskAccess(ownerId, ownerId, null, "task_released");
        }
        if (existing.status !== "done" && nextStatus === "done") {
          await logTaskAccess(ownerId, ownerId, null, "task_done");
        }
      }
      return res.json(await getTask(taskId, ownerId));
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    const ownerId = userIdFromRequest(req, res);
    if (ownerId === null) return;
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) return res.status(404).json({ error: "Task not found" });
    try {
      const result = await databaseClient.run("DELETE FROM careTasks WHERE id = ? AND ownerId = ?", taskId, ownerId);
      if (!result.changes) return res.status(404).json({ error: "Task not found" });
      return res.json({ deleted: true });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/from-referral/:reportId", async (req, res, next) => {
    const ownerId = userIdFromRequest(req, res);
    if (ownerId === null) return;
    const reportId = Number(req.params.reportId);
    if (!Number.isInteger(reportId) || reportId <= 0) return res.status(400).json({ error: "Invalid reportId" });
    try {
      const report = await databaseClient.get(
        "SELECT id FROM reports WHERE id = ? AND userId = ?",
        reportId,
        ownerId
      );
      if (!report) return res.status(404).json({ error: "Report not found" });
      const steps = await databaseClient.all(
        "SELECT id, text FROM referralSteps WHERE userId = ? AND reportId = ? ORDER BY sortOrder, id",
        ownerId,
        reportId
      );
      let created = 0;
      let skipped = 0;
      for (const step of steps) {
        const title = String(step.text || "").trim().slice(0, 120);
        if (!title) {
          skipped += 1;
          continue;
        }
        const result = await databaseClient.run(
          `INSERT OR IGNORE INTO careTasks (ownerId, reportId, sourceKey, title)
           SELECT ?, ?, ?, ?
           WHERE (SELECT COUNT(*) FROM careTasks WHERE ownerId = ?) < 100`,
          ownerId,
          reportId,
          `step:${step.id}`,
          title,
          ownerId
        );
        if (result.changes) created += 1;
        else skipped += 1;
      }
      return res.json({ created, skipped });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/with-me/:ownerId", async (req, res, next) => {
    const callerId = userIdFromRequest(req, res);
    if (callerId === null) return;
    const ownerId = Number(req.params.ownerId);
    if (!Number.isInteger(ownerId) || ownerId <= 0 || ownerId === callerId) {
      return res.status(403).json({ error: "Task access is not allowed" });
    }
    try {
      const caller = await databaseClient.get("SELECT email FROM users WHERE id = ?", callerId);
      if (!caller) return res.status(401).json({ error: "Please log in again" });
      const permissions = await getActiveMembership(ownerId, caller.email, databaseClient);
      if (!permissions?.canClaimTasks) return res.status(403).json({ error: "Task access is not allowed" });
      const tasks = await databaseClient.all(
        `SELECT t.id, t.title, t.dueDate, t.status,
                CASE WHEN t.claimedById = ? THEN 1 ELSE 0 END AS claimedByMe,
                COALESCE(
                  (SELECT fm.memberName FROM familyMembers fm
                   WHERE fm.ownerId = t.ownerId AND lower(fm.memberEmail) = lower(t.claimedByEmail)
                   ORDER BY fm.createdAt DESC, fm.id DESC LIMIT 1),
                  ''
                ) AS claimedByName
         FROM careTasks t
         WHERE t.ownerId = ?
           AND EXISTS (
             SELECT 1 FROM familyMembers fm
             WHERE fm.ownerId = t.ownerId
               AND lower(fm.memberEmail) = lower(?)
               AND fm.status = 'active'
               AND fm.permissions LIKE '%"canClaimTasks":true%'
           )
         ORDER BY CASE t.status WHEN 'open' THEN 0 WHEN 'claimed' THEN 1 ELSE 2 END,
                  CASE WHEN t.dueDate IS NULL OR t.dueDate = '' THEN 1 ELSE 0 END,
                  t.dueDate, t.id`,
        callerId,
        ownerId,
        caller.email
      );
      if (!await getActiveMembership(ownerId, caller.email, databaseClient)) {
        return res.status(403).json({ error: "Task access is not allowed" });
      }
      return res.json(tasks.map((task) => ({ ...task, claimedByMe: task.claimedByMe === 1 })));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:id/claim", async (req, res, next) => {
    const callerId = userIdFromRequest(req, res);
    if (callerId === null) return;
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) return res.status(404).json({ error: "Task not found" });
    try {
      const caller = await databaseClient.get("SELECT email FROM users WHERE id = ?", callerId);
      if (!caller) return res.status(401).json({ error: "Please log in again" });
      const task = await databaseClient.get("SELECT id, ownerId FROM careTasks WHERE id = ?", taskId);
      if (!task) return res.status(404).json({ error: "Task not found" });
      const permissions = await getActiveMembership(task.ownerId, caller.email, databaseClient);
      if (!permissions?.canClaimTasks) return res.status(403).json({ error: "Task access is not allowed" });
      const result = await databaseClient.run(
        `UPDATE careTasks SET status = 'claimed', claimedById = ?, claimedByEmail = ?,
         claimedAt = CURRENT_TIMESTAMP, doneAt = NULL, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ? AND ownerId = ? AND status = 'open'
           AND EXISTS (
             SELECT 1 FROM familyMembers fm
             WHERE fm.ownerId = careTasks.ownerId
               AND lower(fm.memberEmail) = lower(?)
               AND fm.status = 'active'
               AND fm.permissions LIKE '%"canClaimTasks":true%'
           )`,
        callerId,
        caller.email,
        taskId,
        task.ownerId,
        caller.email
      );
      if (!result.changes) {
        const stillAllowed = await getActiveMembership(task.ownerId, caller.email, databaseClient);
        if (!stillAllowed?.canClaimTasks) return res.status(403).json({ error: "Task access is not allowed" });
        return res.status(409).json({ error: "Task is no longer open" });
      }
      await logTaskAccess(task.ownerId, callerId, caller.email, "task_claimed");
      return res.json({ claimed: true });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:id/done", async (req, res, next) => {
    const callerId = userIdFromRequest(req, res);
    if (callerId === null) return;
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) return res.status(404).json({ error: "Task not found" });
    try {
      const caller = await databaseClient.get("SELECT email FROM users WHERE id = ?", callerId);
      if (!caller) return res.status(401).json({ error: "Please log in again" });
      const result = await databaseClient.run(
        `UPDATE careTasks SET status = 'done', doneAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ? AND claimedById = ? AND lower(claimedByEmail) = lower(?) AND status = 'claimed'`,
        taskId,
        callerId,
        caller.email
      );
      if (!result.changes) return res.status(403).json({ error: "Only the person who claimed this task can complete it" });
      const task = await databaseClient.get("SELECT ownerId FROM careTasks WHERE id = ?", taskId);
      await logTaskAccess(task.ownerId, callerId, caller.email, "task_done");
      return res.json({ done: true });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createTasksRouter, validDueDate };
