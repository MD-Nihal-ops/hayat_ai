const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");
const demoSessionGuard = require("../middleware/demoSessionGuard");
const rejectDemoPublicSession = require("../middleware/rejectDemoPublicSession");
const {
  createJudgeDemoToken,
  isJudgeDemoEnabled
} = require("../config/judgeDemo");

const secret = "judge-demo-test-secret-that-is-long-enough";

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function runProtectedRequest(token, path, method = "GET") {
  const req = {
    method,
    path,
    get: () => `Bearer ${token}`
  };
  const res = makeResponse();
  let continued = false;
  requireAuth(req, res, () => {
    demoSessionGuard(req, res, () => { continued = true; });
  });
  return { req, res, continued };
}

test("judge demo mode requires an explicit true flag", () => {
  assert.equal(isJudgeDemoEnabled({ JUDGE_DEMO_ENABLED: "true" }), true);
  assert.equal(isJudgeDemoEnabled({ JUDGE_DEMO_ENABLED: "1" }), false);
  assert.equal(isJudgeDemoEnabled({}), false);
});

test("demo token returns only the synthetic Hasan profile", (context) => {
  const previousSecret = process.env.JWT_SECRET;
  const previousFlag = process.env.JUDGE_DEMO_ENABLED;
  context.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousFlag === undefined) delete process.env.JUDGE_DEMO_ENABLED;
    else process.env.JUDGE_DEMO_ENABLED = previousFlag;
  });
  process.env.JWT_SECRET = secret;
  process.env.JUDGE_DEMO_ENABLED = "true";

  const { req, res, continued } = runProtectedRequest(createJudgeDemoToken(secret), "/profile");
  assert.equal(continued, false);
  assert.equal(req.isDemoSession, true);
  assert.equal(req.userId, null);
  assert.equal(res.body.fullName, "Hasan");
  assert.equal(res.body.demoProfile, true);
});

test("demo token cannot read private records or write to protected APIs", (context) => {
  const previousSecret = process.env.JWT_SECRET;
  const previousFlag = process.env.JUDGE_DEMO_ENABLED;
  context.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousFlag === undefined) delete process.env.JUDGE_DEMO_ENABLED;
    else process.env.JUDGE_DEMO_ENABLED = previousFlag;
  });
  process.env.JWT_SECRET = secret;
  process.env.JUDGE_DEMO_ENABLED = "true";
  const token = createJudgeDemoToken(secret);

  const privateRead = runProtectedRequest(token, "/reports/1");
  assert.equal(privateRead.res.statusCode, 403);
  assert.equal(privateRead.continued, false);

  const attemptedWrite = runProtectedRequest(token, "/profile", "PUT");
  assert.equal(attemptedWrite.res.statusCode, 403);
  assert.equal(attemptedWrite.continued, false);
});

test("demo token cannot use a public shared-record route", (context) => {
  const previousSecret = process.env.JWT_SECRET;
  context.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  process.env.JWT_SECRET = secret;
  const req = { get: () => `Bearer ${createJudgeDemoToken(secret)}` };
  const res = makeResponse();
  let continued = false;
  rejectDemoPublicSession(req, res, () => { continued = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(continued, false);
});

test("normal signed-in users retain their user ID and pass the demo guard", (context) => {
  const previousSecret = process.env.JWT_SECRET;
  const previousFlag = process.env.JUDGE_DEMO_ENABLED;
  context.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousFlag === undefined) delete process.env.JUDGE_DEMO_ENABLED;
    else process.env.JUDGE_DEMO_ENABLED = previousFlag;
  });
  process.env.JWT_SECRET = secret;
  process.env.JUDGE_DEMO_ENABLED = "true";
  const token = jwt.sign({ userId: 7 }, secret, { expiresIn: "1h" });

  const { req, continued } = runProtectedRequest(token, "/reports/1");
  assert.equal(continued, true);
  assert.equal(req.userId, 7);
  assert.equal(req.isDemoSession, false);
});

test("a demo token is rejected when server demo mode is disabled", (context) => {
  const previousSecret = process.env.JWT_SECRET;
  const previousFlag = process.env.JUDGE_DEMO_ENABLED;
  context.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousFlag === undefined) delete process.env.JUDGE_DEMO_ENABLED;
    else process.env.JUDGE_DEMO_ENABLED = previousFlag;
  });
  process.env.JWT_SECRET = secret;
  process.env.JUDGE_DEMO_ENABLED = "true";
  const token = createJudgeDemoToken(secret);
  process.env.JUDGE_DEMO_ENABLED = "false";

  const { res, continued } = runProtectedRequest(token, "/profile");
  assert.equal(res.statusCode, 401);
  assert.equal(continued, false);
});
