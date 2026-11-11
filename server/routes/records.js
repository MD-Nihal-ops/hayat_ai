const express = require("express");
const database = require("../database");
const metricAliases = require("../config/metricAliases.json");

const router = express.Router();
const metricKeys = new Set(Object.values(metricAliases));
const selfMetricRanges = {
  heart_rate: [20, 300],
  blood_pressure: [50, 300],
  glucose: [0.1, 2000],
  weight: [0.1, 1000]
};
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

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

function finiteNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

router.get("/", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const readings = await database.all(
      `SELECT id, metricKey, label, value, value2, unit, recordedAt, source, reportId, rangeMin, rangeMax
       FROM healthMetrics WHERE userId = ? ORDER BY recordedAt DESC, id DESC`,
      userId
    );
    const readingsByMetric = new Map();
    for (const reading of readings) {
      const metricReadings = readingsByMetric.get(reading.metricKey) || [];
      if (metricReadings.length < 6) metricReadings.push(reading);
      readingsByMetric.set(reading.metricKey, metricReadings);
    }
    return res.json([...readingsByMetric.values()].map((metricReadings) => ({
      ...metricReadings[0],
      recentReadings: metricReadings.slice().reverse()
    })));
  } catch (error) {
    return next(error);
  }
});

router.get("/:metricKey", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const { metricKey } = req.params;
  if (!metricKeys.has(metricKey)) return res.status(404).json({ error: "Metric not found" });
  try {
    const readings = await database.all(
      `SELECT id, metricKey, label, value, value2, unit, recordedAt, source, reportId, rangeMin, rangeMax
       FROM healthMetrics WHERE userId = ? AND metricKey = ? ORDER BY recordedAt, id`,
      userId,
      metricKey
    );
    return res.json(readings);
  } catch (error) {
    return next(error);
  }
});

router.post("/self", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const { metric, unit } = req.body || {};
  const metricRange = selfMetricRanges[metric];
  const value = finiteNumber(req.body?.value);
  const value2 = finiteNumber(req.body?.value2);
  const recordedAt = req.body?.date || new Date().toISOString().slice(0, 10);
  if (!metricRange) return res.status(400).json({ error: "Unsupported self-entered metric" });
  if (value === null || value < metricRange[0] || value > metricRange[1]) {
    return res.status(400).json({ error: "Value is outside the accepted range" });
  }
  if (metric === "blood_pressure" && value2 !== null && (value2 < 20 || value2 > 200)) {
    return res.status(400).json({ error: "Second value is outside the accepted range" });
  }
  if (
    metric === "blood_pressure" &&
    req.body?.value2 !== undefined &&
    req.body.value2 !== null &&
    value2 === null
  ) {
    return res.status(400).json({ error: "Invalid second value" });
  }
  if (metric !== "blood_pressure" && req.body?.value2 !== undefined && value2 === null) {
    return res.status(400).json({ error: "Invalid second value" });
  }
  if (typeof unit !== "string" || !unit.trim() || unit.trim().length > 24) {
    return res.status(400).json({ error: "Unit is required" });
  }
  const label = req.body?.label === undefined ? metric : req.body.label;
  if (typeof label !== "string" || !label.trim() || label.trim().length > 80) {
    return res.status(400).json({ error: "Label must be 80 characters or fewer" });
  }
  if (!isValidDate(recordedAt)) return res.status(400).json({ error: "Date must use YYYY-MM-DD" });

  try {
    const result = await database.run(
      `INSERT INTO healthMetrics
        (userId, metricKey, label, value, value2, unit, recordedAt, source, reportId, rangeMin, rangeMax)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'self', NULL, NULL, NULL)`,
      userId,
      metric,
      label.trim(),
      value,
      metric === "blood_pressure" ? value2 : null,
      unit.trim(),
      recordedAt
    );
    const reading = await database.get(
      `SELECT id, metricKey, label, value, value2, unit, recordedAt, source, reportId, rangeMin, rangeMax
       FROM healthMetrics WHERE id = ? AND userId = ?`,
      result.lastID,
      userId
    );
    return res.status(201).json(reading);
  } catch (error) {
    return next(error);
  }
});

router.delete("/self/:id", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const result = await database.run(
      "DELETE FROM healthMetrics WHERE id = ? AND userId = ? AND source = 'self'",
      req.params.id,
      userId
    );
    if (!result.changes) return res.status(404).json({ error: "Self-entered reading not found" });
    return res.json({ deleted: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;