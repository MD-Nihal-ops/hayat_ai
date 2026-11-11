const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const database = require("../database");
const { extractPolicy } = require("../services/ai");

const router = express.Router();
const privateUploadsDirectory = path.join(__dirname, "..", "private-uploads");
fs.mkdirSync(privateUploadsDirectory, { recursive: true });
const pendingUploads = new Map();
const fieldNames = [
  "insurerName",
  "planName",
  "policyholderName",
  "organizationName",
  "policyNumber",
  "memberId",
  "startDate",
  "endDate",
  "insurerPhone"
];
const allowedTypes = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".pdf", "application/pdf"]
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: privateUploadsDirectory,
    filename: (req, file, callback) => {
      callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
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

function userIdFromRequest(req, res) {
  const userId = req.userId;
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: "Please log in again" });
    return null;
  }
  return userId;
}

function isISODate(value) {
  if (value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizedText(value) {
  return typeof value === "string" ? value : "";
}

function fieldsFromRequest(body, includeOptionalNumbers = false) {
  const values = {};
  for (const field of fieldNames) {
    const value = body[field] ?? "";
    if (typeof value !== "string") {
      return { error: `${field} must be text` };
    }
    values[field] = value.trim();
  }
  for (const field of ["startDate", "endDate"]) {
    if (!isISODate(values[field])) return { error: `${field} must be an ISO date or empty` };
  }
  if (includeOptionalNumbers) {
    for (const field of ["coveragePercent", "deductible", "copay"]) {
      const value = body[field] ?? "";
      if (value === "") {
        values[field] = null;
      } else if (typeof value !== "number" || !Number.isFinite(value) || value < 0 ||
          (field === "coveragePercent" && value > 100)) {
        return { error: `${field} must be a non-negative number${field === "coveragePercent" ? " no greater than 100" : ""} or empty` };
      } else {
        values[field] = value;
      }
    }
  }
  return { values };
}

function policyForResponse(policy) {
  const { filePath, ...safePolicy } = policy;
  return safePolicy;
}

function removeFile(filePath) {
  if (!filePath) return;
  fs.rm(filePath, { force: true }, (error) => {
    if (error) console.error("[insurance] unable to remove private file:", error.name || "Error");
  });
}

router.clearPendingUploadsForUser = async (userId) => {
  const pending = [...pendingUploads.entries()].filter(([, upload]) => upload.userId === userId);
  await Promise.all(pending.map(async ([fileId, upload]) => {
    await fs.promises.rm(upload.filePath, { force: true });
    pendingUploads.delete(fileId);
  }));
};

router.post("/extract", (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  upload.single("policy")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(uploadError.code === "LIMIT_FILE_SIZE" ? 400 : 400)
        .json({ error: uploadError.message === "Invalid file type" ? "Invalid file type" : "File upload failed" });
    }
    if (!req.file) return res.status(400).json({ error: "Policy file is required" });

    try {
      const extraction = await extractPolicy(req.file.path, req.file.mimetype);
      if (extraction?.notInsurance === true) {
        removeFile(req.file.path);
        return res.json({ fileId: null, fields: null, notInsurance: true });
      }
      const fields = Object.fromEntries(fieldNames.map((field) => [
        field,
        normalizedText(extraction?.[field])
      ]));
      for (const field of ["startDate", "endDate"]) {
        if (!isISODate(fields[field])) fields[field] = "";
      }
      const fileId = crypto.randomUUID();
      pendingUploads.set(fileId, {
        userId,
        filePath: req.file.path,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        createdAt: Date.now()
      });
      return res.json({ fileId, fields, notInsurance: false });
    } catch (error) {
      console.error("[insurance] extraction failed:", error.name || "Error");
      removeFile(req.file.path);
      return res.status(503).json({
        error: "Extraction failed",
        detail: "The AI is very busy right now. Please wait a minute and try again."
      });
    }
  });
});

router.delete("/pending/:fileId", (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const pending = pendingUploads.get(req.params.fileId);
  if (!pending || pending.userId !== userId) {
    return res.status(404).json({ error: "Uploaded policy file not found" });
  }
  pendingUploads.delete(req.params.fileId);
  removeFile(pending.filePath);
  return res.json({ deleted: true });
});

router.post("/", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const { fileId } = req.body || {};
  const pending = typeof fileId === "string" ? pendingUploads.get(fileId) : null;
  if (!pending || pending.userId !== userId) {
    return res.status(400).json({ error: "Uploaded policy file is no longer available. Please upload it again." });
  }
  const parsed = fieldsFromRequest(req.body || {}, true);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    const values = parsed.values;
    const result = await database.run(
      `INSERT INTO insurancePolicies
        (userId, fileName, filePath, mimeType, insurerName, planName, policyholderName,
         organizationName, policyNumber, memberId, startDate, endDate, insurerPhone,
         coveragePercent, deductible, copay)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      userId,
      pending.fileName,
      pending.filePath,
      pending.mimeType,
      ...fieldNames.map((field) => values[field]),
      values.coveragePercent,
      values.deductible,
      values.copay
    );
    pendingUploads.delete(fileId);
    const policy = await database.get(
      "SELECT * FROM insurancePolicies WHERE id = ? AND userId = ?",
      result.lastID,
      userId
    );
    return res.status(201).json(policyForResponse(policy));
  } catch (error) {
    console.error("[insurance] save failed:", error.name || "Error");
    return res.status(500).json({ error: "Unable to save insurance policy" });
  }
});

router.get("/", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const policies = await database.all(
      "SELECT * FROM insurancePolicies WHERE userId = ? ORDER BY createdAt DESC, id DESC",
      userId
    );
    return res.json(policies.map(policyForResponse));
  } catch (error) {
    console.error("[insurance] list failed:", error.name || "Error");
    return res.status(500).json({ error: "Unable to load insurance policies" });
  }
});

router.put("/:id", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const parsed = fieldsFromRequest(req.body || {}, true);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    const values = parsed.values;
    const result = await database.run(
      `UPDATE insurancePolicies SET
        insurerName = ?, planName = ?, policyholderName = ?, organizationName = ?,
        policyNumber = ?, memberId = ?, startDate = ?, endDate = ?, insurerPhone = ?,
        coveragePercent = ?, deductible = ?, copay = ?
       WHERE id = ? AND userId = ?`,
      ...fieldNames.map((field) => values[field]),
      values.coveragePercent,
      values.deductible,
      values.copay,
      req.params.id,
      userId
    );
    if (!result.changes) return res.status(404).json({ error: "Insurance policy not found" });
    const policy = await database.get(
      "SELECT * FROM insurancePolicies WHERE id = ? AND userId = ?",
      req.params.id,
      userId
    );
    return res.json(policyForResponse(policy));
  } catch (error) {
    console.error("[insurance] update failed:", error.name || "Error");
    return res.status(500).json({ error: "Unable to update insurance policy" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const policy = await database.get(
      "SELECT filePath FROM insurancePolicies WHERE id = ? AND userId = ?",
      req.params.id,
      userId
    );
    if (!policy) return res.status(404).json({ error: "Insurance policy not found" });
    await database.run(
      "DELETE FROM insurancePolicies WHERE id = ? AND userId = ?",
      req.params.id,
      userId
    );
    removeFile(policy.filePath);
    return res.json({ deleted: true });
  } catch (error) {
    console.error("[insurance] delete failed:", error.name || "Error");
    return res.status(500).json({ error: "Unable to delete insurance policy" });
  }
});

router.get("/:id/file", async (req, res) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const policy = await database.get(
      "SELECT filePath, fileName, mimeType FROM insurancePolicies WHERE id = ? AND userId = ?",
      req.params.id,
      userId
    );
    if (!policy) return res.status(404).json({ error: "Insurance policy not found" });
    if (!fs.existsSync(policy.filePath)) return res.status(404).json({ error: "Policy document not found" });
    res.type(policy.mimeType);
    res.set("Content-Disposition", `inline; filename="${path.basename(policy.fileName).replace(/["\\\r\n]/g, "")}"`);
    return res.sendFile(path.resolve(policy.filePath));
  } catch (error) {
    console.error("[insurance] file read failed:", error.name || "Error");
    return res.status(500).json({ error: "Unable to open policy document" });
  }
});

module.exports = router;
