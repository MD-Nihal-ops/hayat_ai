const express = require("express");
const multer = require("multer");
const fs = require("node:fs/promises");
const path = require("node:path");
const database = require("../database");
const { extractDocument } = require("../services/ai");
const { explainReport } = require("../services/explain");
const { evaluateValue } = require("../utils/valueChecker");
const metricAliases = require("../config/metricAliases.json");

const router = express.Router();
const uploadsDirectory = path.join(__dirname, "..", "uploads");
const allowedTypes = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".pdf", "application/pdf"]
]);
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDirectory,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.get(extension) !== file.mimetype) {
      return callback(new Error("Invalid file type"));
    }
    return callback(null, true);
  }
});

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function numericValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function metricKeyForName(name) {
  const normalizedName = String(name || "").toLowerCase().trim();
  if (/\b(name|age|date of birth|dob|gender|sex|patient|mrn|id|address|phone|contact)\b/i.test(normalizedName)) {
    return null;
  }
  const words = normalizedName.match(/[\p{L}\p{N}]+/gu) || [];
  if ((words.includes("hb") && words.includes("electrophoresis")) ||
      (words.includes("cholesterol") && words.includes("ratio"))) {
    return null;
  }
  const aliases = Object.keys(metricAliases).sort((left, right) => right.length - left.length);
  const matchedAlias = aliases.find((alias) => {
    if (normalizedName === alias) return true;
    if (alias.length <= 3) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^\\p{L}\\p{N}])${escapedAlias}(?=$|[^\\p{L}\\p{N}])`, "u")
        .test(normalizedName);
    }
    return normalizedName.includes(alias);
  });
  return matchedAlias ? metricAliases[matchedAlias] : null;
}

function metricValuesFromReport(values) {
  return values.flatMap((item) => {
    const metricKey = metricKeyForName(item?.name);
    if (!metricKey) return [];

    let value = numericValue(item.value);
    let value2 = null;
    if (metricKey === "blood_pressure" && typeof item.value === "string") {
      const pressure = item.value.trim().match(/^(\d{2,3}(?:\.\d+)?)\s*\/\s*(\d{2,3}(?:\.\d+)?)$/);
      if (pressure) {
        value = Number(pressure[1]);
        value2 = Number(pressure[2]);
      }
    }
    if (value === null) return [];

    return [{
      metricKey,
      label: String(item.name).trim(),
      value,
      value2,
      unit: typeof item.unit === "string" && item.unit.trim() ? item.unit.trim() : null,
      rangeMin: numericValue(item.printedRange?.min),
      rangeMax: numericValue(item.printedRange?.max)
    }];
  });
}

function reportForResponse(report) {
  return {
    ...report,
    originalFileUrl: `/api/reports/${report.id}/file`,
    extractedValues: JSON.parse(report.extractedValues),
    explanations: JSON.parse(report.explanations || "{}"),
    documentDetails: JSON.parse(report.documentDetails || "{}")
  };
}

router.post("/upload", upload.single("report"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "Report file is required" });
  }
  const userId = req.userId;

  let extraction;
  try {
    extraction = await extractDocument(req.file.path, req.file.mimetype);
  } catch (err) {
    console.error("[upload] extraction failed:", err?.name || "Error");
    if (["503", "429", "busy", "quota"].some((phrase) => err.message.toLowerCase().includes(phrase))) {
      return res.status(503).json({
        error: "Extraction failed",
        detail: "The AI is very busy right now. Please wait a minute and try again."
      });
    }
    return res.status(502).json({ error: "Extraction failed", detail: err.message });
  }

  try {
    const dbResult = await database.run(`
      INSERT INTO reports (userId, type, originalFileUrl, extractedValues, documentDetails, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    userId,
    extraction.reportType,
    `/uploads/${req.file.filename}`,
    JSON.stringify(extraction.extractedValues),
    JSON.stringify(extraction.documentDetails),
    "pending");
    const savedReport = await database.get(
      "SELECT createdAt FROM reports WHERE id = ?",
      dbResult.lastID
    );

    return res.status(201).json({
      reportId: dbResult.lastID,
      reportType: extraction.reportType,
      originalFileUrl: `/api/reports/${dbResult.lastID}/file`,
      createdAt: savedReport.createdAt,
      extractedValues: extraction.extractedValues,
      documentDetails: extraction.documentDetails,
      documentDate: isValidDate(extraction.documentDate) ? extraction.documentDate : null,
      multiplePatients: extraction.multiplePatients === true,
      needsUserConfirmation: true
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  const userId = req.userId;

  try {
    const [reports, reviewMessages] = await Promise.all([
      database.all(
        `SELECT id, type, status, createdAt, extractedValues
         FROM reports WHERE userId = ? ORDER BY createdAt DESC, id DESC`,
        userId
      ),
      database.all(
        `SELECT payload FROM chatMessages
         WHERE userId = ? AND messageType = 'review' ORDER BY id DESC`,
        userId
      )
    ]);
    const documentDates = new Map();
    for (const message of reviewMessages) {
      let payload;
      try {
        payload = JSON.parse(message.payload || "{}");
      } catch {
        continue;
      }
      const reportId = Number(payload.reportId);
      if (
        Number.isInteger(reportId) &&
        !documentDates.has(reportId) &&
        isValidDate(payload.documentDate)
      ) {
        documentDates.set(reportId, payload.documentDate);
      }
    }
    return res.json(reports.map((report) => ({
      ...report,
      extractedValues: JSON.parse(report.extractedValues),
      documentDate: documentDates.get(Number(report.id)) || null
    })));
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const userId = req.userId;

  try {
    const report = await database.get(
      "SELECT * FROM reports WHERE id = ? AND userId = ?",
      req.params.id,
      userId
    );
    if (!report) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json(reportForResponse(report));
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/file", async (req, res, next) => {
  try {
    const report = await database.get(
      "SELECT originalFileUrl FROM reports WHERE id = ? AND userId = ?",
      req.params.id,
      req.userId
    );
    if (!report || typeof report.originalFileUrl !== "string") {
      return res.status(404).json({ error: "Document not found" });
    }
    const match = report.originalFileUrl.match(/^\/uploads\/([^/\\]+)$/);
    if (!match) return res.status(404).json({ error: "Document not found" });
    const filePath = path.join(uploadsDirectory, path.basename(match[1]));
    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const userId = req.userId;
  try {
    const report = await database.get(
      "SELECT id, originalFileUrl FROM reports WHERE id = ? AND userId = ?",
      req.params.id,
      userId
    );
    if (!report) return res.status(404).json({ error: "Not found" });
    if (typeof report.originalFileUrl === "string" && /^\/uploads\/[^/\\]+$/.test(report.originalFileUrl)) {
      const filePath = path.join(uploadsDirectory, path.basename(report.originalFileUrl));
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        if (fileError.code !== "ENOENT") throw fileError;
      }
    }
    const result = await database.run(
      "DELETE FROM reports WHERE id = ? AND userId = ?",
      req.params.id,
      userId
    );
    if (result.changes === 0) return res.status(404).json({ error: "Not found" });
    await database.run(
      "DELETE FROM sharedQuestions WHERE ownerId = ? AND reportId = ?",
      userId,
      req.params.id
    );
    await database.run(
      "DELETE FROM healthMetrics WHERE reportId = ? AND userId = ? AND source = 'report'",
      req.params.id,
      userId
    );
    return res.json({ deleted: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/confirm", async (req, res, next) => {
  const extractedValues = req.body && req.body.extractedValues;
  if (!Array.isArray(extractedValues)) {
    return res.status(400).json({ error: "extractedValues must be an array" });
  }
  const userId = req.userId;

  try {
    const reportId = Number(req.params.id);
    const recordedAt = req.body?.documentDate === undefined
      ? new Date().toISOString().slice(0, 10)
      : req.body.documentDate;
    if (!isValidDate(recordedAt)) {
      return res.status(400).json({ error: "documentDate must use YYYY-MM-DD" });
    }

    const result = await database.run(
      "UPDATE reports SET extractedValues = ?, explanations = '{}', status = ? WHERE id = ? AND userId = ?",
      JSON.stringify(extractedValues),
      "confirmed",
      reportId,
      userId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    await database.run(
      "DELETE FROM healthMetrics WHERE userId = ? AND reportId = ? AND source = 'report'",
      userId,
      reportId
    );
    const metricValues = metricValuesFromReport(extractedValues);
    for (const metric of metricValues) {
      await database.run(
        `INSERT INTO healthMetrics
          (userId, metricKey, label, value, value2, unit, recordedAt, source, reportId, rangeMin, rangeMax)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'report', ?, ?, ?)`,
        userId,
        metric.metricKey,
        metric.label,
        metric.value,
        metric.value2,
        metric.unit,
        recordedAt,
        reportId,
        metric.rangeMin,
        metric.rangeMax
      );
    }

    return res.json({ reportId, status: "confirmed", metricsCreated: metricValues.length });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/explain", async (req, res) => {
  const { language, easyRead = false } = req.body || {};
  if (
    typeof language !== "string" ||
    !["en", "ar", "hi", "ml"].includes(language) ||
    typeof easyRead !== "boolean"
  ) {
    return res.status(400).json({ error: "A supported language and easyRead setting are required" });
  }

  try {
    const reportId = Number(req.params.id);
    const userId = req.userId;
    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(404).json({ error: "Not found" });
    }
    const report = await database.get(
      `SELECT id, type, status, extractedValues, documentDetails, explanations
       FROM reports WHERE id = ? AND userId = ?`,
      reportId,
      userId
    );
    if (!report) return res.status(404).json({ error: "Not found" });
    if (report.status !== "confirmed") return res.status(409).json({ error: "Confirm the report values before requesting an explanation" });
    const cacheKey = easyRead ? `${language}_easy` : language;
    const explanations = JSON.parse(report.explanations || "{}");
    const cached = explanations[cacheKey];
    if (cached?.schemaVersion === 2) return res.json(cached);

    const extractedValues = JSON.parse(report.extractedValues || "[]").map((item) => ({
      ...item,
      status: evaluateValue(item.name, item.value, item.printedRange)
    }));
    const explanation = await explainReport({
      reportType: report.type,
      language,
      easyRead,
      extractedValues,
      documentDetails: JSON.parse(report.documentDetails || "{}")
    });
    explanations[cacheKey] = explanation;
    await database.run(
      "UPDATE reports SET explanations = ? WHERE id = ? AND userId = ? AND status = 'confirmed'",
      JSON.stringify(explanations),
      reportId,
      userId
    );
    return res.json(explanation);
  } catch (error) {
    console.error("[reports] explanation failed:", error?.name || "Error");
    return res.status(503).json({
      error: "Explanation failed",
      detail: "The AI is very busy right now. Please wait a minute and try again."
    });
  }
});

module.exports = router;
