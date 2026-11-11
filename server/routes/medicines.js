const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const { checkMedicine } = require("../services/medicineList");

const router = express.Router();
const sourcePath = path.join(__dirname, "..", "data", "official", "medicinesSource.json");
const sourceDetails = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const source = {
  title: typeof sourceDetails.title === "string" && sourceDetails.title.trim()
    ? sourceDetails.title.trim()
    : "TO VERIFY",
  date: typeof sourceDetails.date === "string" && sourceDetails.date.trim()
    ? sourceDetails.date.trim()
    : "TO VERIFY"
};

function validNames(names, maximum) {
  return Array.isArray(names) &&
    names.length <= maximum &&
    names.every((name) => typeof name === "string" && name.length <= 200);
}

router.post("/search", (req, res) => {
  const names = req.body?.names;
  if (!validNames(names, 5)) {
    return res.status(400).json({ error: "names must be an array of up to 5 medicine names" });
  }
  return res.json({
    results: names.map((query) => ({
      query,
      ...checkMedicine(query)
    })),
    source
  });
});

router.post("/check", (req, res) => {
  const names = req.body?.names;
  if (!validNames(names, 10)) {
    return res.status(400).json({ error: "names must be an array of up to 10 medicine names" });
  }
  return res.json({
    results: names.map((name) => ({
      name,
      ...checkMedicine(name)
    })),
    source
  });
});

module.exports = router;
