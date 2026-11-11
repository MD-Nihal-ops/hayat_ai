export function getPolicyStatus(endDate, today = new Date()) {
  if (!endDate) return "datesNotListed";
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return "datesNotListed";
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return end < currentDay ? "expired" : "active";
}

export function getMostRelevantPolicy(policies, today = new Date()) {
  const newestFirst = [...policies].sort((a, b) => {
    const dateOrder = String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    return dateOrder || Number(b.id || 0) - Number(a.id || 0);
  });
  return newestFirst.find((policy) => getPolicyStatus(policy.endDate, today) !== "expired")
    || newestFirst[0]
    || null;
}

export function getMostRecentPolicy(policies) {
  return [...policies].sort((a, b) => {
    const dateOrder = String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    return dateOrder || Number(b.id || 0) - Number(a.id || 0);
  })[0] || null;
}
