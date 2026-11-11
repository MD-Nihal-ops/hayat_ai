const jwt = require("jsonwebtoken");
const { isJudgeDemoToken } = require("../config/judgeDemo");

function rejectDemoPublicSession(req, res, next) {
  const authorization = req.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return next();

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET);
    if (isJudgeDemoToken(payload)) {
      return res.status(403).json({ error: "The judge demo session cannot open shared records" });
    }
  } catch {
    return next();
  }
  return next();
}

module.exports = rejectDemoPublicSession;
