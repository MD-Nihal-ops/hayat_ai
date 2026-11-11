const demoResponses = new Map([
  ["/profile", {
    fullName: "Hasan",
    dateOfBirth: "",
    bloodType: "",
    allergies: [],
    emergencyContactName: "",
    emergencyContactPhone: "",
    easyRead: false,
    accessNeeds: { needs: [], note: "", includeOnCareCard: false },
    updatedAt: "",
    demoProfile: true
  }],
  ["/profile/accessibility", {
    easyRead: false,
    accessNeeds: { needs: [], note: "", includeOnCareCard: false }
  }],
  ["/reports", []],
  ["/records", []],
  ["/care/reminders", []],
  ["/care/doses", []],
  ["/care/appointments", []],
  ["/insurance", []],
  ["/tasks/mine", []],
  ["/family-first", []]
]);

function demoSessionGuard(req, res, next) {
  if (!req.isDemoSession) return next();

  if (req.method !== "GET") {
    return res.status(403).json({ error: "The judge demo session is read-only" });
  }

  if (!demoResponses.has(req.path)) {
    return res.status(403).json({ error: "This feature is unavailable in the judge demo session" });
  }

  return res.json(demoResponses.get(req.path));
}

module.exports = demoSessionGuard;
