const express = require("express");
const database = require("../database");

const router = express.Router();

router.post("/notify-family", async (req, res, next) => {
  try {
    await database.run(
      "INSERT INTO accessLog (userId, action, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)",
      req.userId,
      "sos_demo_notify"
    );
    return res.json({ message: "Demo: family would be notified now." });
  } catch (error) {
    return next(error);
  }
});

router.post("/contact-opened", async (req, res, next) => {
  try {
    await database.run(
      "INSERT INTO accessLog (userId, action, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)",
      req.userId,
      "sos_contact_opened"
    );
  } catch (err) {
    console.error("[sos] log failed:", err?.name || "Error");
  }
  return res.json({ ok: true });
});

module.exports = router;
