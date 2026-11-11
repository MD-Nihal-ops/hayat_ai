const express = require("express");
const database = require("../database");

const router = express.Router();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function userIdFromRequest(req, res) {
  const userId = req.userId;
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: "Please log in again" });
    return null;
  }
  return userId;
}

function isValidDate(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function weekdaysFromRequest(days) {
  if (days === undefined) return "0,1,2,3,4,5,6";
  if (!Array.isArray(days) || days.length === 0 ||
      days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    return null;
  }
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

function respondError(res, error) {
  console.error("[care] request failed:", error?.name || "Error");
  return res.status(500).json({ error: "Unable to complete care request" });
}

router.get("/reminders", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const reminders = await database.all(
      "SELECT id, medicineName, time, days FROM reminders WHERE userId = ? ORDER BY time, id",
      userId
    );
    return res.json(reminders);
  } catch (error) {
    return respondError(res, error);
  }
});

router.post("/reminders", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const { medicineName, time } = req.body || {};
  const days = weekdaysFromRequest(req.body?.days);
  if (typeof medicineName !== "string" || !medicineName.trim()) {
    return res.status(400).json({ error: "Medicine name is required" });
  }
  if (typeof time !== "string" || !timePattern.test(time)) {
    return res.status(400).json({ error: "Time must use HH:MM" });
  }
  if (days === null) return res.status(400).json({ error: "Select at least one valid weekday" });
  try {
    const result = await database.run(
      "INSERT INTO reminders (userId, medicineName, time, days) VALUES (?, ?, ?, ?)",
      userId,
      medicineName.trim(),
      time,
      days
    );
    const reminder = await database.get(
      "SELECT id, medicineName, time, days FROM reminders WHERE id = ? AND userId = ?",
      result.lastID,
      userId
    );
    return res.status(201).json(reminder);
  } catch (error) {
    return respondError(res, error);
  }
});

router.delete("/reminders/:id", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const result = await database.run(
      "DELETE FROM reminders WHERE id = ? AND userId = ?",
      req.params.id,
      userId
    );
    if (!result.changes) return res.status(404).json({ error: "Reminder not found" });
    return res.json({ deleted: true });
  } catch (error) {
    return respondError(res, error);
  }
});

router.get("/doses", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const { date } = req.query;
  if (!isValidDate(date)) return res.status(400).json({ error: "Date must use YYYY-MM-DD" });
  try {
    const doses = await database.all(
      "SELECT id, medicineName, doseTime, date, taken FROM doseLog WHERE userId = ? AND date = ? ORDER BY doseTime",
      userId,
      date
    );
    return res.json(doses.map((dose) => ({ ...dose, taken: dose.taken === 1 })));
  } catch (error) {
    return respondError(res, error);
  }
});

router.put("/doses", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const { medicineName, doseTime, date, taken } = req.body || {};
  if (typeof medicineName !== "string" || !medicineName.trim()) {
    return res.status(400).json({ error: "Medicine name is required" });
  }
  if (typeof doseTime !== "string" || !timePattern.test(doseTime)) {
    return res.status(400).json({ error: "Time must use HH:MM" });
  }
  if (!isValidDate(date)) return res.status(400).json({ error: "Date must use YYYY-MM-DD" });
  if (typeof taken !== "boolean") return res.status(400).json({ error: "Taken must be true or false" });
  try {
    await database.run(
      `INSERT INTO doseLog (userId, medicineName, doseTime, date, taken)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(userId, medicineName, doseTime, date)
       DO UPDATE SET taken = excluded.taken`,
      userId,
      medicineName.trim(),
      doseTime,
      date,
      taken ? 1 : 0
    );
    const dose = await database.get(
      "SELECT id, medicineName, doseTime, date, taken FROM doseLog WHERE userId = ? AND medicineName = ? AND doseTime = ? AND date = ?",
      userId,
      medicineName.trim(),
      doseTime,
      date
    );
    return res.json({ ...dose, taken: dose.taken === 1 });
  } catch (error) {
    return respondError(res, error);
  }
});

router.get("/medicines", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const reports = await database.all(
      "SELECT extractedValues FROM reports WHERE userId = ? AND type = 'prescription' AND status = 'confirmed'",
      userId
    );
    const medicines = reports.flatMap((report) => {
      const values = JSON.parse(report.extractedValues);
      return values
        .filter((item) => typeof item.name === "string" && item.name.trim())
        .map((item) => ({
          medicineName: item.name.trim(),
          printedDose: [item.value, item.unit].filter((value) =>
            value !== null && value !== undefined && String(value).trim()
          ).map(String).join(" ")
        }));
    });
    return res.json(medicines);
  } catch (error) {
    return respondError(res, error);
  }
});

router.get("/appointments", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const appointments = await database.all(
      "SELECT id, title, dateTime, place, notes, sourceReportId FROM appointments WHERE userId = ? ORDER BY dateTime, id",
      userId
    );
    return res.json(appointments);
  } catch (error) {
    return respondError(res, error);
  }
});

router.post("/appointments", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const { title, date, time, place = "", notes = "", sourceReportId = null } = req.body || {};
  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Appointment title is required" });
  }
  if (!isValidDate(date)) return res.status(400).json({ error: "Date must use YYYY-MM-DD" });
  if (typeof time !== "string" || !timePattern.test(time)) {
    return res.status(400).json({ error: "Time must use HH:MM" });
  }
  if (typeof place !== "string" || typeof notes !== "string") {
    return res.status(400).json({ error: "Place and notes must be text" });
  }
  if (sourceReportId !== null && (!Number.isInteger(Number(sourceReportId)) || Number(sourceReportId) <= 0)) {
    return res.status(400).json({ error: "Invalid source report" });
  }
  try {
    if (sourceReportId !== null) {
      const report = await database.get(
        "SELECT id FROM reports WHERE id = ? AND userId = ?",
        sourceReportId,
        userId
      );
      if (!report) return res.status(400).json({ error: "Source report not found" });
    }
    const result = await database.run(
      `INSERT INTO appointments (userId, title, dateTime, place, notes, sourceReportId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      userId,
      title.trim(),
      `${date}T${time}`,
      place.trim(),
      notes.trim(),
      sourceReportId
    );
    const appointment = await database.get(
      "SELECT id, title, dateTime, place, notes, sourceReportId FROM appointments WHERE id = ? AND userId = ?",
      result.lastID,
      userId
    );
    return res.status(201).json(appointment);
  } catch (error) {
    return respondError(res, error);
  }
});

router.delete("/appointments/:id", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const result = await database.run(
      "DELETE FROM appointments WHERE id = ? AND userId = ?",
      req.params.id,
      userId
    );
    if (!result.changes) return res.status(404).json({ error: "Appointment not found" });
    return res.json({ deleted: true });
  } catch (error) {
    return respondError(res, error);
  }
});

module.exports = router;
