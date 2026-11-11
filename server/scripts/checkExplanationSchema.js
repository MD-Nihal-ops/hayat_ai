const { validateExplanation } = require("../services/explain");

const base = {
  schemaVersion: 2,
  inShort: "This is a sample document.",
  mostImportant: ["This is a sample point."],
  sections: {},
  questionsForDoctor: ["What does this mean?", "What should I ask next?", "Which details matter?"],
  couldNotRead: [],
  closing: "Discuss this with your doctor."
};

const sampleValue = {
  name: "Sample test",
  value: 5,
  unit: "unit",
  printedRange: { min: 1, max: 10 },
  status: "within range"
};
const details = {
  reasonForVisit: "Sample reason",
  events: ["Sample event"],
  medicines: ["Sample medicine as printed"],
  followUps: ["Sample follow-up"],
  warningSigns: ["Sample warning sign"],
  writtenReport: "Sample written finding.",
  billLines: [{ description: "Sample line", amount: "AED 5" }],
  insuranceText: "Sample insurance text.",
  summary: "Sample document summary.",
  couldNotRead: []
};

const examples = [
  ["lab report", "lab_report", [sampleValue], { labReport: { tests: [{
    name: sampleValue.name,
    whatItMeasures: "A sample measure.",
    meaning: "The result is within the printed range."
  }] } }],
  ["prescription", "prescription", [{ ...sampleValue, name: "Sample medicine" }], {
    prescription: { medicines: [{ name: "Sample medicine", whatIsPrinted: "One tablet", whatIsMissing: [] }] }
  }],
  ["discharge summary", "discharge_summary", [], { dischargeSummary: {
    reasonForVisit: "Sample reason",
    events: [], medicines: [], followUps: [], warningSigns: []
  } }],
  ["imaging report", "imaging_report", [], { imagingReport: { writtenReport: "Sample written finding." } }],
  ["bill", "bill", [], { bill: {
    lines: [{ description: "Sample line", amount: "AED 5" }],
    insuranceText: "Sample insurance text."
  } }],
  ["other document", "other", [], { other: { summary: "Sample document summary." } }],
  ["referral letter", "referral_letter", [], { referralLetter: {
    summary: "Sample referral content.",
    steps: [{ text: "Bring the document.", documents: ["Sample document"] }]
  } }]
];

let failures = 0;
for (const [label, reportType, values, section] of examples) {
  try {
    const result = validateExplanation({ ...base, sections: section }, reportType, values, details);
    if (result.schemaVersion !== 2) throw new Error("Wrong schema version");
    console.log(`PASS ${label}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${label}: ${error.message}`);
  }
}

if (failures > 0) process.exitCode = 1;
