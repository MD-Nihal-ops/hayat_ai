const jwt = require("jsonwebtoken");
const { isJudgeDemoEnabled, isJudgeDemoToken } = require("../config/judgeDemo");

function requireAuth(req, res, next) {
  const authorization = req.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: "Please log in again" });
  }

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET);
    if (payload.demo === true) {
      if (!isJudgeDemoEnabled() || !isJudgeDemoToken(payload)) {
        return res.status(401).json({ error: "Please log in again" });
      }
      req.userId = null;
      req.isDemoSession = true;
      return next();
    }
    if (!Number.isInteger(payload.userId) || payload.userId <= 0) {
      return res.status(401).json({ error: "Please log in again" });
    }
    req.userId = payload.userId;
    req.isDemoSession = false;
    return next();
  } catch {
    return res.status(401).json({ error: "Please log in again" });
  }
}

module.exports = requireAuth;
