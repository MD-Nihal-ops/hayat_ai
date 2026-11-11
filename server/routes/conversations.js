const express = require("express");
const database = require("../database");

const router = express.Router();

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getUserId(req, res) {
  const userId = Number(req.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "Valid user ID is required" });
    return null;
  }
  return userId;
}

async function ownedConversation(userId, conversationId) {
  return database.get(
    "SELECT id, userId, title, createdAt, updatedAt FROM conversations WHERE id = ? AND userId = ?",
    conversationId,
    userId
  );
}

router.get("/", async (req, res, next) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  try {
    const conversations = await database.all(
      `SELECT c.id, c.title, c.createdAt, c.updatedAt,
        (SELECT substr(content, 1, 140) FROM chatMessages m
         WHERE m.conversationId = c.id
         ORDER BY m.id DESC LIMIT 1) AS lastMessagePreview
       FROM conversations c
       WHERE c.userId = ?
       ORDER BY c.updatedAt DESC, c.id DESC`,
      userId
    );
    return res.json(conversations);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  try {
    const result = await database.run(
      "INSERT INTO conversations (userId, title) VALUES (?, ?)",
      userId,
      "New chat"
    );
    const conversation = await ownedConversation(userId, result.lastID);
    return res.status(201).json(conversation);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  if (!title || title.length > 80) {
    return res.status(400).json({ error: "Title must be between 1 and 80 characters" });
  }
  try {
    const conversation = await ownedConversation(userId, req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    await database.run(
      "UPDATE conversations SET title = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?",
      title,
      conversation.id,
      userId
    );
    return res.json(await ownedConversation(userId, conversation.id));
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  try {
    const conversation = await ownedConversation(userId, req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    await database.run("DELETE FROM chatMessages WHERE conversationId = ? AND userId = ?", conversation.id, userId);
    await database.run("DELETE FROM conversations WHERE id = ? AND userId = ?", conversation.id, userId);
    return res.json({ deleted: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/messages", async (req, res, next) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  try {
    const conversation = await ownedConversation(userId, req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    const messages = await database.all(
      `SELECT id, role, content, language, kind, category, messageType, payload, reportIds, createdAt
       FROM chatMessages
       WHERE conversationId = ? AND userId = ?
       ORDER BY id DESC LIMIT 100`,
      conversation.id,
      userId
    );
    const chronologicalMessages = messages.reverse();
    const reportIds = [...new Set(chronologicalMessages.flatMap((message) =>
      JSON.parse(message.reportIds || "[]").filter((id) => Number.isInteger(id) && id > 0)
    ))];
    const sourceReports = reportIds.length
      ? await database.all(
        `SELECT id, type, createdAt FROM reports
         WHERE userId = ? AND id IN (${reportIds.map(() => "?").join(",")})`,
        userId,
        ...reportIds
      )
      : [];
    const reportTypeLabels = {
      lab_report: "Lab report",
      prescription: "Prescription",
      discharge_summary: "Discharge summary",
      imaging_report: "Imaging report",
      bill: "Bill",
      referral_letter: "Referral letter",
      other: "Other"
    };
    const reportsById = new Map(sourceReports.map((report) => [Number(report.id), report]));
    const normalized = chronologicalMessages.map((message) => {
      const messageReportIds = JSON.parse(message.reportIds || "[]")
        .filter((id) => Number.isInteger(id) && id > 0);
      const payload = JSON.parse(message.payload || "{}");
      return {
        ...message,
        payload,
        reportIds: messageReportIds,
        suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
        sources: Array.isArray(payload.sources) && payload.sources.length ? payload.sources : messageReportIds.filter((id) => reportsById.has(id)).map((id) => {
          const report = reportsById.get(id);
          return {
            reportId: id,
            label: reportTypeLabels[report.type] || report.type,
            date: report.createdAt ? String(report.createdAt).slice(0, 10) : ""
          };
        })
      };
    });
    return res.json(normalized);
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/messages", async (req, res, next) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const { role, content = "", language, messageType = "text", payload = {} } = req.body || {};
  const allowedTypes = new Set(["text", "attachment", "review", "explanation"]);
  if (
    !["user", "assistant"].includes(role) ||
    typeof content !== "string" ||
    content.length > 500 ||
    !["en", "ar", "hi", "ml"].includes(language) ||
    !allowedTypes.has(messageType) ||
    !payload || typeof payload !== "object" || Array.isArray(payload)
  ) {
    return res.status(400).json({ error: "Invalid message" });
  }
  if (
    (messageType === "attachment" && role !== "user") ||
    (["review", "explanation"].includes(messageType) && role !== "assistant")
  ) {
    return res.status(400).json({ error: "Invalid message type" });
  }
  const reportId = messageType === "review" || messageType === "explanation"
    ? Number(payload.reportId)
    : null;
  if (reportId !== null && (!Number.isInteger(reportId) || reportId <= 0)) {
    return res.status(400).json({ error: "Invalid reportId" });
  }
  try {
    const conversation = await ownedConversation(userId, req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (reportId !== null) {
      const report = await database.get("SELECT id, status FROM reports WHERE id = ? AND userId = ?", reportId, userId);
      if (!report) return res.status(404).json({ error: "Report not found" });
      if (messageType === "explanation" && report.status !== "confirmed") {
        return res.status(400).json({ error: "Report values must be confirmed before saving an explanation" });
      }
    }
    const safePayload = reportId === null
      ? {}
      : {
        reportId,
        language: ["en", "ar", "hi", "ml"].includes(payload.language) ? payload.language : language,
        ...(messageType === "review" && isValidDate(payload.documentDate)
          ? { documentDate: payload.documentDate }
          : {})
      };
    const kind = messageType === "text" ? (req.body.kind || "message") : messageType;
    const result = await database.run(
      `INSERT INTO chatMessages
        (userId, conversationId, role, content, language, kind, messageType, payload, reportIds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      userId,
      conversation.id,
      role,
      content,
      language,
      kind,
      messageType,
      JSON.stringify(safePayload),
      reportId === null ? "[]" : JSON.stringify([reportId])
    );
    if (role === "user" && conversation.title === "New chat" && content.trim()) {
      await database.run(
        "UPDATE conversations SET title = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?",
        content.trim().slice(0, 40),
        conversation.id,
        userId
      );
    } else {
      await database.run(
        "UPDATE conversations SET updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?",
        conversation.id,
        userId
      );
    }
    const savedMessage = await database.get(
      `SELECT id, role, content, language, kind, category, messageType, payload, reportIds, createdAt
       FROM chatMessages WHERE id = ? AND userId = ?`,
      result.lastID,
      userId
    );
    return res.status(201).json({ ...savedMessage, payload: JSON.parse(savedMessage.payload) });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/messages/:messageId", async (req, res, next) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const reportId = Number(req.body?.reportId);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return res.status(400).json({ error: "Invalid reportId" });
  }
  try {
    const conversation = await ownedConversation(userId, req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    const report = await database.get(
      "SELECT id FROM reports WHERE id = ? AND userId = ?",
      reportId,
      userId
    );
    if (!report) return res.status(404).json({ error: "Report not found" });
    const message = await database.get(
      `SELECT id, language FROM chatMessages
       WHERE id = ? AND conversationId = ? AND userId = ? AND role = 'user' AND messageType = 'attachment'`,
      req.params.messageId,
      conversation.id,
      userId
    );
    if (!message) return res.status(404).json({ error: "Attachment not found" });
    const payload = { reportId, language: message.language };
    await database.run(
      `UPDATE chatMessages SET payload = ?, reportIds = ?
       WHERE id = ? AND conversationId = ? AND userId = ?`,
      JSON.stringify(payload),
      JSON.stringify([reportId]),
      message.id,
      conversation.id,
      userId
    );
    const updated = await database.get(
      `SELECT id, role, content, language, kind, category, messageType, payload, reportIds, createdAt
       FROM chatMessages WHERE id = ? AND userId = ?`,
      message.id,
      userId
    );
    return res.json({ ...updated, payload: JSON.parse(updated.payload) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
