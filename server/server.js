const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const helmet = require("helmet");
const { assertJwtSecret } = require("./config/auth");

dotenv.config({ path: path.join(__dirname, ".env") });

assertJwtSecret(process.env.JWT_SECRET);

const app = express();
fs.mkdirSync(path.join(__dirname, "uploads"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "private-uploads"), { recursive: true });

app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use((req, res, next) => {
  if (req.path === "/link") res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(express.json());

app.use("/api/health", require("./routes/health"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/link", require("./middleware/rejectDemoPublicSession"));
app.use("/api/link", require("./routes/link").router);
app.use("/api", require("./middleware/requireAuth"));
app.use("/api", require("./middleware/demoSessionGuard"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/records", require("./routes/records"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/sos", require("./routes/sos"));
app.use("/api/facilities", require("./routes/facilities"));
app.use("/api/places", require("./routes/places"));
app.use("/api/explore", require("./routes/explore"));
app.use("/api/medicines", require("./routes/medicines"));
app.use("/api/care", require("./routes/care"));
app.use("/api/insurance", require("./routes/insurance"));
app.use("/api/geocode", require("./routes/geocode"));
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/shares", require("./routes/shares").createSharesRouter());
app.use("/api/shared", require("./routes/shared").createSharedRouter());
app.use("/api/questions", require("./routes/questions").createQuestionsRouter(require("./database")));
app.use("/api/family-circle", require("./routes/familyCircle").createFamilyCircleRouter(require("./database")));
app.use("/api/tasks", require("./routes/tasks").createTasksRouter(require("./database")));
app.use("/api/consents", require("./routes/consents").createConsentRouter());
app.use("/api/access-log", require("./routes/accessLog"));
app.use("/api/family-first", require("./routes/familyFirst"));
app.use("/api/wellness", require("./routes/wellness"));
app.use("/api/referrals", require("./routes/referrals"));
app.use("/api/account", require("./routes/account"));

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large" });
  }

  if (error.message === "Invalid file type") {
    return res.status(400).json({ error: "Invalid file type" });
  }

  console.error("[server] request failed:", error?.name || "Error");
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status === 502 ? "Document extraction failed" : "Internal server error";
  return res.status(status).json({ error: message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Hayat AI server listening on port ${port}`);
});
