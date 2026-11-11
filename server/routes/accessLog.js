const express = require("express");
const database = require("../database");

const router = express.Router();

router.get("/", async (req, res, next) => {
  const pageValue = Number(req.query.page || 1);
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const offset = (page - 1) * 50;
  try {
    const rows = await database.all(
      `SELECT l.id, l.ownerId, l.viewerId, l.viewerEmail, l.reportId, l.action, l.details, l.timestamp,
              r.type AS reportType, r.createdAt AS reportDate
       FROM accessLog l
       LEFT JOIN reports r ON r.id = l.reportId
       WHERE (l.ownerId = ? OR l.viewerId = ? OR (l.userId = ? AND l.ownerId IS NULL))
         AND l.action IN (
           'share_created', 'share_revoked', 'report_viewed', 'sos_contact_opened',
           'family_member_added', 'family_permissions_updated', 'family_access_revoked',
           'caregiver_overview_viewed', 'task_claimed', 'task_released', 'task_done',
           'wellness_challenge_started', 'wellness_challenge_invited', 'wellness_challenge_joined',
           'wellness_challenge_declined', 'wellness_challenge_sharing_updated',
           'wellness_challenge_left', 'wellness_challenge_viewed'
         )
       ORDER BY l.timestamp DESC, l.id DESC
       LIMIT 50 OFFSET ?`,
      req.userId,
      req.userId,
      req.userId,
      offset
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
