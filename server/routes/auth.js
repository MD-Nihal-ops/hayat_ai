const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");
const database = require("../database");
const { createJudgeDemoToken, isJudgeDemoEnabled } = require("../config/judgeDemo");

const router = express.Router();
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." }
});
const emailPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const wrongCredentialsMessage = "Email or password is incorrect";

function isValidEmail(email) {
  if (typeof email !== "string" || email.length > 254 || !emailPattern.test(email)) return false;
  const localPart = email.split("@")[0];
  return !localPart.startsWith(".") && !localPart.endsWith(".") && !localPart.includes("..");
}

router.post("/register", async (req, res, next) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Enter a valid email and a password of at least 8 characters" });
  }

  try {
    const existing = await database.get("SELECT id FROM users WHERE lower(email) = ?", email.trim().toLowerCase());
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await database.run(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      email.trim().toLowerCase(),
      passwordHash
    );

    return res.status(201).json({ userId: result.lastID });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") {
      return res.status(409).json({ error: "Email already registered" });
    }
    return next(error);
  }
});

router.post("/login", loginRateLimit, async (req, res, next) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(401).json({ error: wrongCredentialsMessage });
  }

  try {
    const user = await database.get(
      "SELECT id, password FROM users WHERE lower(email) = ?",
      email.trim().toLowerCase()
    );
    if (!user) return res.status(401).json({ error: wrongCredentialsMessage });

    let passwordMatches;
    if (user.password.startsWith("$2")) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      passwordMatches = password === user.password;
      if (passwordMatches) {
        const passwordHash = await bcrypt.hash(password, 10);
        await database.run("UPDATE users SET password = ? WHERE id = ?", passwordHash, user.id);
      }
    }
    if (!passwordMatches) return res.status(401).json({ error: wrongCredentialsMessage });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, userId: user.id });
  } catch (error) {
    return next(error);
  }
});

router.post("/demo", loginRateLimit, (req, res) => {
  if (!isJudgeDemoEnabled()) {
    return res.status(404).json({ error: "Judge demo mode is not enabled" });
  }
  return res.json({
    token: createJudgeDemoToken(process.env.JWT_SECRET),
    demo: true
  });
});

module.exports = router;
