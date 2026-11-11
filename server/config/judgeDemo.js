const jwt = require("jsonwebtoken");

const demoIssuer = "hayat-ai";
const demoAudience = "hayat-ai-judge-demo";

function isJudgeDemoEnabled(env = process.env) {
  return env.JUDGE_DEMO_ENABLED === "true";
}

function createJudgeDemoToken(secret) {
  return jwt.sign({ demo: true }, secret, {
    expiresIn: "2h",
    issuer: demoIssuer,
    audience: demoAudience,
    subject: "judge-demo"
  });
}

function isJudgeDemoToken(payload) {
  return payload.demo === true &&
    payload.userId === undefined &&
    payload.iss === demoIssuer &&
    payload.aud === demoAudience &&
    payload.sub === "judge-demo";
}

module.exports = { createJudgeDemoToken, isJudgeDemoEnabled, isJudgeDemoToken };
