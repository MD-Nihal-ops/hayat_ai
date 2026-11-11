const database = require("../database");

function parsePermissions(value) {
  try {
    const permissions = JSON.parse(value);
    if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) return null;
    return {
      canViewMedicines: permissions.canViewMedicines === true,
      canViewAppointments: permissions.canViewAppointments === true,
      canClaimTasks: permissions.canClaimTasks === true
    };
  } catch {
    return null;
  }
}

async function getActiveMembership(ownerId, callerEmail, databaseClient = database) {
  const member = await databaseClient.get(
    `SELECT permissions FROM familyMembers
     WHERE ownerId = ? AND lower(memberEmail) = lower(?) AND status = 'active'
     ORDER BY id DESC LIMIT 1`,
    ownerId,
    callerEmail
  );
  if (!member) return null;
  return parsePermissions(member.permissions);
}

module.exports = { getActiveMembership };
