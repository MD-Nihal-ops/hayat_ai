const express = require("express");

const permissionKeys = ["canViewMedicines", "canViewAppointments", "canClaimTasks", "canViewAccessNeeds"];
const roles = new Set(["caregiver", "emergency_contact_only"]);
const emailPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const consentVersion = "f1-v1";

function normalizePermissions(value, role) {
  const permissions = Object.fromEntries(permissionKeys.map((key) => [key, false]));
  if (value !== undefined) {
    if (!value || typeof value !== "object" || Array.isArray(value) ||
        Object.keys(value).some((key) => !permissionKeys.includes(key)) ||
        permissionKeys.some((key) => value[key] !== undefined && typeof value[key] !== "boolean")) return null;
    for (const key of permissionKeys) permissions[key] = value[key] === true;
  }
  if (role === "emergency_contact_only" && permissionKeys.some((key) => permissions[key])) return null;
  return permissions;
}

function parsePermissions(value) {
  try {
    return normalizePermissions(JSON.parse(value), "caregiver") || Object.fromEntries(permissionKeys.map((key) => [key, false]));
  } catch {
    return Object.fromEntries(permissionKeys.map((key) => [key, false]));
  }
}

function maskEmail(email) {
  const [name, domain] = String(email || "").split("@");
  return name && domain ? `${name.slice(0, 1)}***@${domain}` : "Family account";
}

function createFamilyCircleRouter(database) {
  const router = express.Router();

  function userIdFromRequest(req, res) {
    if (!Number.isInteger(req.userId) || req.userId <= 0) {
      res.status(401).json({ error: "Please log in again" });
      return null;
    }
    return req.userId;
  }

  async function logAccess({ ownerId, viewerId, viewerEmail, action, details }) {
    await database.run(
      `INSERT INTO accessLog (userId, ownerId, viewerId, viewerEmail, action, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      ownerId,
      ownerId,
      viewerId,
      viewerEmail,
      action,
      details
    );
  }

  function memberForResponse(row) {
    return {
      id: row.id,
      name: row.memberName,
      email: row.memberEmail,
      role: row.role,
      language: row.memberLanguage || null,
      permissions: parsePermissions(row.permissions),
      status: row.status,
      createdAt: row.createdAt,
      revokedAt: row.revokedAt
    };
  }

  router.post("/", async (req, res, next) => {
    const ownerId = userIdFromRequest(req, res);
    if (ownerId === null) return;
    const { name, email, role, permissions, consentAcknowledged } = req.body || {};
    const memberName = typeof name === "string" ? name.trim() : "";
    const memberEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!memberName || memberName.length > 80 || !emailPattern.test(memberEmail) ||
        memberEmail.length > 254 || !roles.has(role) || consentAcknowledged !== true) {
      return res.status(400).json({ error: "Valid member details and explicit consent acknowledgement are required" });
    }
    const parsedPermissions = normalizePermissions(permissions, role);
    if (!parsedPermissions) return res.status(400).json({ error: "Invalid permissions for this role" });

    try {
      const owner = await database.get("SELECT email FROM users WHERE id = ?", ownerId);
      if (!owner) return res.status(401).json({ error: "Please log in again" });
      if (owner.email.toLowerCase() === memberEmail) {
        return res.status(400).json({ error: "You cannot add your own account" });
      }
      const existing = await database.get(
        "SELECT id FROM familyMembers WHERE ownerId = ? AND lower(memberEmail) = lower(?) AND status = 'active'",
        ownerId,
        memberEmail
      );
      if (existing) return res.status(409).json({ error: "This person already has active access" });

      const result = await database.run(
        `INSERT INTO familyMembers (ownerId, memberName, memberEmail, role, permissions)
         VALUES (?, ?, ?, ?, ?)`,
        ownerId,
        memberName,
        memberEmail,
        role,
        JSON.stringify(parsedPermissions)
      );
      await logAccess({
        ownerId,
        viewerId: ownerId,
        viewerEmail: memberEmail,
        action: "family_member_added",
        details: `Added ${role} access; explicit consent ${consentVersion} acknowledged`
      });
      const row = await database.get("SELECT * FROM familyMembers WHERE id = ? AND ownerId = ?", result.lastID, ownerId);
      return res.status(201).json(memberForResponse(row));
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE" ||
          error.message.includes("familyMembers_active_owner_email")) {
        return res.status(409).json({ error: "This person already has active access" });
      }
      return next(error);
    }
  });

  router.get("/", async (req, res, next) => {
    const ownerId = userIdFromRequest(req, res);
    if (ownerId === null) return;
    try {
      const rows = await database.all(
        `SELECT fm.*, member.language AS memberLanguage
         FROM familyMembers fm
         LEFT JOIN users member ON lower(member.email) = lower(fm.memberEmail)
         WHERE fm.ownerId = ? ORDER BY fm.createdAt DESC, fm.id DESC`,
        ownerId
      );
      return res.json(rows.map(memberForResponse));
    } catch (error) {
      return next(error);
    }
  });

  router.patch("/:memberId/permissions", async (req, res, next) => {
    const ownerId = userIdFromRequest(req, res);
    if (ownerId === null) return;
    const memberId = Number(req.params.memberId);
    if (!Number.isInteger(memberId) || memberId <= 0) return res.status(404).json({ error: "Family member not found" });
    try {
      const member = await database.get(
        "SELECT * FROM familyMembers WHERE id = ? AND ownerId = ?",
        memberId,
        ownerId
      );
      if (!member) return res.status(404).json({ error: "Family member not found" });
      if (member.status !== "active") return res.status(409).json({ error: "Access has ended" });
      const permissions = normalizePermissions(req.body?.permissions, member.role);
      if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) ||
          !Object.hasOwn(req.body, "permissions") ||
          Object.keys(req.body).some((key) => key !== "permissions") || !permissions) {
        return res.status(400).json({ error: "Valid permissions are required" });
      }
      await database.run(
        "UPDATE familyMembers SET permissions = ? WHERE id = ? AND ownerId = ? AND status = 'active'",
        JSON.stringify(permissions),
        memberId,
        ownerId
      );
      await logAccess({
        ownerId,
        viewerId: ownerId,
        viewerEmail: member.memberEmail,
        action: "family_permissions_updated",
        details: "Family member permissions updated"
      });
      const updated = await database.get("SELECT * FROM familyMembers WHERE id = ? AND ownerId = ?", memberId, ownerId);
      return res.json(memberForResponse(updated));
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:memberId", async (req, res, next) => {
    const ownerId = userIdFromRequest(req, res);
    if (ownerId === null) return;
    const memberId = Number(req.params.memberId);
    if (!Number.isInteger(memberId) || memberId <= 0) return res.status(404).json({ error: "Family member not found" });
    try {
      const result = await database.run(
        `UPDATE familyMembers SET status = 'revoked', revokedAt = CURRENT_TIMESTAMP
         WHERE id = ? AND ownerId = ? AND status = 'active'`,
        memberId,
        ownerId
      );
      if (!result.changes) return res.status(404).json({ error: "Active family member not found" });
      const member = await database.get("SELECT memberEmail FROM familyMembers WHERE id = ? AND ownerId = ?", memberId, ownerId);
      const released = await database.run(
        `UPDATE careTasks SET status = 'open', claimedById = NULL, claimedByEmail = NULL,
         claimedAt = NULL, doneAt = NULL, updatedAt = CURRENT_TIMESTAMP
         WHERE ownerId = ? AND lower(claimedByEmail) = lower(?) AND status = 'claimed'`,
        ownerId,
        member.memberEmail
      );
      if (released.changes) {
        await logAccess({
          ownerId,
          viewerId: ownerId,
          viewerEmail: member.memberEmail,
          action: "task_released",
          details: "Claim released because family access was revoked"
        });
      }
      await logAccess({
        ownerId,
        viewerId: ownerId,
        viewerEmail: member.memberEmail,
        action: "family_access_revoked",
        details: "Family access revoked"
      });
      return res.json({ revoked: true });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/helping", async (req, res, next) => {
    const memberId = userIdFromRequest(req, res);
    if (memberId === null) return;
    try {
      const viewer = await database.get("SELECT email FROM users WHERE id = ?", memberId);
      if (!viewer) return res.status(401).json({ error: "Please log in again" });
      const rows = await database.all(
        `SELECT fm.id, fm.ownerId, fm.memberName, fm.role, fm.permissions, fm.status, fm.createdAt, fm.revokedAt,
                owner.email AS ownerEmail, p.fullName AS ownerName
         FROM familyMembers fm
         JOIN users owner ON owner.id = fm.ownerId
         LEFT JOIN profiles p ON p.userId = fm.ownerId
         WHERE lower(fm.memberEmail) = lower(?)
         ORDER BY fm.createdAt DESC, fm.id DESC`,
        viewer.email
      );
      return res.json(rows.map((row) => ({
        id: row.id,
        ownerId: row.ownerId,
        name: row.ownerName?.trim() || maskEmail(row.ownerEmail),
        role: row.role,
        permissions: parsePermissions(row.permissions),
        status: row.status,
        createdAt: row.createdAt,
        revokedAt: row.revokedAt
      })));
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:memberId/overview", async (req, res, next) => {
    const viewerId = userIdFromRequest(req, res);
    if (viewerId === null) return;
    const memberId = Number(req.params.memberId);
    if (!Number.isInteger(memberId) || memberId <= 0) return res.status(403).json({ error: "Access ended" });
    try {
      const viewer = await database.get("SELECT email FROM users WHERE id = ?", viewerId);
      if (!viewer) return res.status(401).json({ error: "Please log in again" });
      const member = await database.get(
        `SELECT id, ownerId, memberEmail, role, permissions, status
         FROM familyMembers WHERE id = ? AND lower(memberEmail) = lower(?)`,
        memberId,
        viewer.email
      );
      if (!member || member.status !== "active") return res.status(403).json({ error: "Access ended" });

      if (member.role === "emergency_contact_only") {
        const profile = await database.get(
          "SELECT bloodType, allergies, emergencyContactName, emergencyContactPhone FROM profiles WHERE userId = ?",
          member.ownerId
        );
        const allergies = JSON.parse(profile?.allergies || "[]");
        if (!Array.isArray(allergies)) throw new Error("Stored profile allergies are invalid");
        await logAccess({
          ownerId: member.ownerId,
          viewerId,
          viewerEmail: viewer.email,
          action: "caregiver_overview_viewed",
          details: "Emergency contact card viewed"
        });
        return res.json({
          emergencyCard: {
            contactName: profile?.emergencyContactName || "",
            contactPhone: profile?.emergencyContactPhone || "",
            bloodType: profile?.bloodType || "",
            allergies
          }
        });
      }

      const permissions = parsePermissions(member.permissions);
      const overview = {};
      if (permissions.canViewMedicines) {
        const today = new Date().getDay();
        overview.todaysMedicines = await database.all(
          `SELECT medicineName, time FROM reminders
           WHERE userId = ? AND instr(',' || days || ',', ',' || ? || ',') > 0
           ORDER BY time, id`,
          member.ownerId,
          today
        );
      }
      if (permissions.canViewAppointments) {
        const appointments = await database.all(
          `SELECT title, dateTime, place FROM appointments
           WHERE userId = ? AND datetime(dateTime) >= datetime('now')
           ORDER BY dateTime, id`,
          member.ownerId
        );
        overview.nextAppointments = appointments;
      }
      if (permissions.canViewAccessNeeds) {
        const profile = await database.get("SELECT accessNeeds FROM profiles WHERE userId = ?", member.ownerId);
        try {
          const accessNeeds = JSON.parse(profile?.accessNeeds || "{}");
          overview.accessNeeds = {
            needs: Array.isArray(accessNeeds.needs) ? accessNeeds.needs : [],
            note: typeof accessNeeds.note === "string" ? accessNeeds.note : ""
          };
        } catch {
          overview.accessNeeds = { needs: [], note: "" };
        }
      }
      const sharedReports = await database.all(
        `SELECT s.id AS shareId, r.type, r.createdAt, c.dataCategories
         FROM shares s
         JOIN reports r ON r.id = s.reportId AND r.userId = s.ownerId AND r.status = 'confirmed'
         JOIN consents c ON c.consentId = s.consentId AND c.userId = s.ownerId AND c.resourceId = s.reportId
         WHERE s.ownerId = ? AND lower(s.sharedWithEmail) = lower(?) AND s.status = 'active'
           AND c.status = 'granted' AND c.purpose = 'family_report_sharing'
           AND c.recipientType = 'person' AND lower(c.recipient) = lower(s.sharedWithEmail)
           AND (c.expiresAt IS NULL OR datetime(c.expiresAt) > CURRENT_TIMESTAMP)
           AND (s.expiresAt IS NULL OR datetime(s.expiresAt) > CURRENT_TIMESTAMP)
         ORDER BY s.createdAt DESC, s.id DESC`,
        member.ownerId,
        viewer.email
      );
      overview.sharedReports = sharedReports.filter((report) => {
        try {
          const categories = JSON.parse(report.dataCategories);
          return Array.isArray(categories) &&
            categories.includes("health_report_values") &&
            categories.includes("health_report_explanation");
        } catch {
          return false;
        }
      }).map((report) => ({
        shareId: report.shareId,
        type: report.type,
        createdAt: report.createdAt
      }));
      await logAccess({
        ownerId: member.ownerId,
        viewerId,
        viewerEmail: viewer.email,
        action: "caregiver_overview_viewed",
        details: "Authorized caregiver overview viewed"
      });
      return res.json(overview);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createFamilyCircleRouter, permissionKeys, normalizePermissions };
