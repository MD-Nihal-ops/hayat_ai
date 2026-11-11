const express = require("express");
const database = require("../database");

const router = express.Router();
const bloodTypes = new Set(["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
const accessNeedKeys = new Set([
  "wheelchair", "low_vision_or_blind", "deaf_or_hard_of_hearing",
  "simple_language", "interpreter", "quiet_space"
]);

function parseAccessNeeds(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid access needs");
    return {
      needs: Array.isArray(parsed.needs)
        ? [...new Set(parsed.needs.filter((need) => accessNeedKeys.has(need)))]
        : [],
      note: typeof parsed.note === "string" ? parsed.note.slice(0, 200) : "",
      includeOnCareCard: parsed.includeOnCareCard === true
    };
  } catch {
    return { needs: [], note: "", includeOnCareCard: false };
  }
}

function validAccessNeeds(value) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).every((key) => ["needs", "note", "includeOnCareCard"].includes(key)) &&
    Array.isArray(value.needs) && value.needs.every((need) => accessNeedKeys.has(need)) &&
    new Set(value.needs).size === value.needs.length &&
    typeof value.note === "string" && value.note.length <= 200 &&
    typeof value.includeOnCareCard === "boolean";
}

function userIdFromRequest(req, res) {
  const userId = req.userId;
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: "Please log in again" });
    return null;
  }
  return userId;
}

function profileForResponse(profile) {
  if (!profile) {
    return {
      fullName: "",
      dateOfBirth: "",
      bloodType: "",
      allergies: [],
      emergencyContactName: "",
      emergencyContactPhone: "",
      easyRead: false,
      accessNeeds: { needs: [], note: "", includeOnCareCard: false },
      updatedAt: ""
    };
  }
  return {
    ...profile,
    allergies: JSON.parse(profile.allergies || "[]"),
    easyRead: profile.easyRead === 1,
    accessNeeds: parseAccessNeeds(profile.accessNeeds)
  };
}

router.get("/", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;

  try {
    const profile = await database.get("SELECT * FROM profiles WHERE userId = ?", userId);
    return res.json(profileForResponse(profile));
  } catch (error) {
    return next(error);
  }
});

router.get("/accessibility", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  try {
    const profile = await database.get("SELECT easyRead, accessNeeds FROM profiles WHERE userId = ?", userId);
    return res.json({
      easyRead: profile?.easyRead === 1,
      accessNeeds: parseAccessNeeds(profile?.accessNeeds)
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/accessibility", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !["easyRead", "accessNeeds"].includes(key)) ||
      !Object.keys(body).length ||
      (Object.hasOwn(body, "easyRead") && typeof body.easyRead !== "boolean") ||
      (Object.hasOwn(body, "accessNeeds") && !validAccessNeeds(body.accessNeeds))) {
    return res.status(400).json({ error: "Enter valid accessibility preferences" });
  }
  try {
    const current = await database.get("SELECT easyRead, accessNeeds FROM profiles WHERE userId = ?", userId);
    const easyRead = Object.hasOwn(body, "easyRead") ? body.easyRead : current?.easyRead === 1;
    const accessNeeds = Object.hasOwn(body, "accessNeeds")
      ? body.accessNeeds
      : parseAccessNeeds(current?.accessNeeds);
    await database.run(
      `INSERT INTO profiles (userId, easyRead, accessNeeds)
       VALUES (?, ?, ?)
       ON CONFLICT(userId) DO UPDATE SET
         easyRead = excluded.easyRead,
         accessNeeds = excluded.accessNeeds,
         updatedAt = CURRENT_TIMESTAMP`,
      userId,
      easyRead ? 1 : 0,
      JSON.stringify(accessNeeds)
    );
    return res.json({ easyRead, accessNeeds });
  } catch (error) {
    return next(error);
  }
});

router.put("/", async (req, res, next) => {
  const userId = userIdFromRequest(req, res);
  if (userId === null) return;

  const profile = req.body || {};
  if (typeof profile.bloodType !== "string" || !bloodTypes.has(profile.bloodType)) {
    return res.status(400).json({ error: "Invalid bloodType" });
  }
  if (!Array.isArray(profile.allergies) || profile.allergies.some((allergy) => typeof allergy !== "string")) {
    return res.status(400).json({ error: "allergies must be an array of strings" });
  }

  const values = {
    fullName: typeof profile.fullName === "string" ? profile.fullName.trim() : "",
    dateOfBirth: typeof profile.dateOfBirth === "string" ? profile.dateOfBirth : "",
    bloodType: profile.bloodType,
    allergies: JSON.stringify(profile.allergies.map((allergy) => allergy.trim()).filter(Boolean)),
    emergencyContactName: typeof profile.emergencyContactName === "string"
      ? profile.emergencyContactName.trim()
      : "",
    emergencyContactPhone: typeof profile.emergencyContactPhone === "string"
      ? profile.emergencyContactPhone.trim()
      : ""
  };

  try {
    await database.run(`
      INSERT INTO profiles
        (userId, fullName, dateOfBirth, bloodType, allergies, emergencyContactName, emergencyContactPhone, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId) DO UPDATE SET
        fullName = excluded.fullName,
        dateOfBirth = excluded.dateOfBirth,
        bloodType = excluded.bloodType,
        allergies = excluded.allergies,
        emergencyContactName = excluded.emergencyContactName,
        emergencyContactPhone = excluded.emergencyContactPhone,
        updatedAt = CURRENT_TIMESTAMP
    `,
    userId,
    values.fullName,
    values.dateOfBirth,
    values.bloodType,
    values.allergies,
    values.emergencyContactName,
    values.emergencyContactPhone);

    const savedProfile = await database.get("SELECT * FROM profiles WHERE userId = ?", userId);
    return res.json(profileForResponse(savedProfile));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
