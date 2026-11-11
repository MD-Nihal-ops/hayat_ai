// Must stay in sync with the client file. Thresholds TO VERIFY with a clinician.
const { dangerousThresholds } = require("../config/clinicalRules");

const notJudged = "no range printed, not judged";

function isMissing(value) {
  return value == null || value === "";
}

function toNumber(value) {
  if (isMissing(value)) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function evaluateValue(name, value, printedRange) {
  if (
    !printedRange ||
    isMissing(printedRange.min) ||
    isMissing(printedRange.max)
  ) {
    return notJudged;
  }

  const numericValue = toNumber(value);
  if (numericValue === null) {
    return notJudged;
  }

  // OPEN: should danger rule apply when no printed range? Verify with a clinician.
  const normalizedName = typeof name === "string" ? name.toLowerCase() : "";
  const matchingThreshold = Object.entries(dangerousThresholds).find(
    ([thresholdName]) => normalizedName.includes(thresholdName.toLowerCase())
  );
  const thresholds = matchingThreshold?.[1];
  if (
    thresholds &&
    (numericValue < thresholds.min || numericValue > thresholds.max)
  ) {
    return "DANGER: Contact a doctor or emergency services now.";
  }

  const minimum = toNumber(printedRange.min);
  const maximum = toNumber(printedRange.max);
  if (minimum === null || maximum === null) {
    return notJudged;
  }

  if (numericValue < minimum) {
    return "low";
  }
  if (numericValue > maximum) {
    return "high";
  }
  return "within range";
}

module.exports = { dangerousThresholds, evaluateValue };
