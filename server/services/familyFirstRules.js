const {
  eventDefinitions,
  supportedEventKeys
} = require("../config/familyFirstEvents");
const catalogue = require("../data/derived/prompt1/lifeEventServices.json");

const ruleFields = {
  new_baby: ["parentStatus", "birthLocation", "hospitalType", "childCurrentlyInUAE"],
  child_school: [
    "studentCategory", "schoolType", "parentEmployer", "arabicScore", "englishScore", "mathScore",
    "residenceVisaValid", "schoolCapacityAvailable", "ageAtCutoff", "targetGrade",
    "studentNeedsDeterminationSupport"
  ],
  marriage: [
    "marriageRoute", "bothNonMuslim", "shariaCoupleMuslim", "priorMaritalStatus", "marriageCompleted",
    "premaritalCertificateValid", "guardianAndWitnessesAvailable"
  ],
  moving_home: ["propertyType", "tenancyRegistered", "utilityConnectionNeeded", "parentStatus", "emirate"],
  elderly_care: ["parentStatus", "age", "careNeed", "clinicalNeedAssessed"],
  retirement: ["nationalityCategory", "employmentSector", "age", "insuredYears", "retirementRoute", "retirementGender"],
  bereavement: [
    "deathLocation", "deathCircumstance", "deceasedStatus",
    "deathCertificateAvailable", "dependantsOnVisa"
  ]
};

const questions = {
  parentStatus: { type: "choice", options: ["uae_citizen", "resident", "both", "neither", "unknown"] },
  birthLocation: { type: "choice", options: ["uae", "abroad", "unknown"] },
  hospitalType: { type: "choice", options: ["government", "private", "unknown"] },
  childCurrentlyInUAE: { type: "choice", options: ["yes", "no", "unknown"] },
  studentCategory: { type: "choice", options: ["uae_national", "gcc_national", "decree_nationality", "expatriate", "unknown"] },
  schoolType: { type: "choice", options: ["government", "private", "unknown"] },
  parentEmployer: { type: "choice", options: ["government", "semi_government", "local_entity", "other", "unknown"] },
  arabicScore: { type: "number", min: 0, max: 100 },
  englishScore: { type: "number", min: 0, max: 100 },
  mathScore: { type: "number", min: 0, max: 100 },
  residenceVisaValid: { type: "choice", options: ["yes", "no", "unknown"] },
  schoolCapacityAvailable: { type: "choice", options: ["yes", "no", "unknown"] },
  ageAtCutoff: { type: "number", min: 0, max: 30 },
  targetGrade: { type: "choice", options: ["kg1", "kg2", "grade1", "other", "unknown"] },
  studentNeedsDeterminationSupport: { type: "choice", options: ["yes", "no", "unknown"] },
  marriageRoute: { type: "choice", options: ["sharia", "civil", "unknown"] },
  bothNonMuslim: { type: "choice", options: ["yes", "no", "unknown"] },
  shariaCoupleMuslim: { type: "choice", options: ["yes", "no", "unknown"] },
  priorMaritalStatus: { type: "choice", options: ["never_married", "previously_married", "unknown"] },
  marriageCompleted: { type: "choice", options: ["yes", "no", "unknown"] },
  premaritalCertificateValid: { type: "choice", options: ["yes", "no", "unknown"] },
  guardianAndWitnessesAvailable: { type: "choice", options: ["yes", "no", "unknown"] },
  propertyType: { type: "choice", options: ["rented", "owned", "other", "unknown"] },
  tenancyRegistered: { type: "choice", options: ["yes", "no", "unknown"] },
  utilityConnectionNeeded: { type: "choice", options: ["yes", "no", "unknown"] },
  emirate: { type: "text", maxLength: 60 },
  age: { type: "number", min: 0, max: 120 },
  careNeed: { type: "choice", options: ["healthcare", "social_support", "both", "unknown"] },
  clinicalNeedAssessed: { type: "choice", options: ["yes", "no", "unknown"] },
  nationalityCategory: { type: "choice", options: ["uae_national", "gcc_national", "expatriate", "unknown"] },
  employmentSector: { type: "choice", options: ["public", "private", "not_employed", "unknown"] },
  insuredYears: { type: "number", min: 0, max: 80 },
  retirementRoute: { type: "choice", options: ["standard", "early", "residence_visa", "unknown"] },
  retirementGender: { type: "choice", options: ["man", "woman", "unknown"] },
  deathLocation: { type: "choice", options: ["hospital", "outside_hospital", "abroad", "unknown"] },
  deathCircumstance: { type: "choice", options: ["natural", "unexpected", "unknown"] },
  deceasedStatus: { type: "choice", options: ["uae_national", "resident", "other", "unknown"] },
  deathCertificateAvailable: { type: "choice", options: ["yes", "no", "unknown"] },
  dependantsOnVisa: { type: "choice", options: ["yes", "no", "unknown"] }
};

const serviceRuleInputs = {
  "prompt1-row-2": ["parentStatus", "birthLocation", "hospitalType"],
  "prompt1-row-3": ["parentStatus"],
  "prompt1-row-4": ["parentStatus", "birthLocation"],
  "prompt1-row-5": ["childCurrentlyInUAE"],
  "prompt1-row-6": [
    "studentCategory", "schoolType", "parentEmployer", "arabicScore", "englishScore", "mathScore",
    "residenceVisaValid", "schoolCapacityAvailable"
  ],
  "prompt1-row-7": ["ageAtCutoff", "targetGrade"],
  "prompt1-row-8": ["schoolType"],
  "prompt1-row-9": ["studentNeedsDeterminationSupport"],
  "prompt1-row-10": ["marriageRoute", "shariaCoupleMuslim", "priorMaritalStatus", "premaritalCertificateValid", "guardianAndWitnessesAvailable"],
  "prompt1-row-11": ["marriageRoute", "bothNonMuslim", "priorMaritalStatus"],
  "prompt1-row-12": ["marriageRoute", "shariaCoupleMuslim", "premaritalCertificateValid"],
  "prompt1-row-13": ["marriageCompleted"],
  "prompt1-row-14": ["propertyType", "emirate"],
  "prompt1-row-15": ["propertyType", "tenancyRegistered", "utilityConnectionNeeded", "emirate"],
  "prompt1-row-16": ["parentStatus", "emirate"],
  "prompt1-row-17": ["parentStatus", "age"],
  "prompt1-row-18": ["parentStatus", "careNeed", "clinicalNeedAssessed"],
  "prompt1-row-19": ["parentStatus", "careNeed"],
  "prompt1-row-20": ["nationalityCategory", "employmentSector"],
  "prompt1-row-21": ["nationalityCategory", "employmentSector", "age", "insuredYears", "retirementRoute", "retirementGender"],
  "prompt1-row-22": ["nationalityCategory", "age", "retirementRoute"],
  "prompt1-row-23": ["deathLocation"],
  "prompt1-row-24": ["deathCircumstance"],
  "prompt1-row-25": ["deathCertificateAvailable"],
  "prompt1-row-26": ["deceasedStatus", "dependantsOnVisa"]
};

const sourceEvidence = {
  "prompt1-row-2": ["UAE citizens and residents", "government-hospital births", "private-hospital births"],
  "prompt1-row-3": ["newborn children of citizens and residents", "added to the family record"],
  "prompt1-row-4": ["sponsorship by an eligible parent"],
  "prompt1-row-6": ["85%", "valid residence visas", "capacity is capped at 20%"],
  "prompt1-row-7": ["KG1: at least age 4", "KG2: age 5", "Grade 1: age 6–8", "31 August"],
  "prompt1-row-8": ["Each school sets admission"],
  "prompt1-row-9": ["support depends on assessed needs"],
  "prompt1-row-10": ["premarital medical certificate is required"],
  "prompt1-row-11": ["Non-Muslim couples"],
  "prompt1-row-12": ["valid premarital medical certificate required before Sharia marriage registration"],
  "prompt1-row-13": ["Certificate requires a completed marriage contract"],
  "prompt1-row-14": ["registration is required before utility connection", "Dubai uses Ejari, Abu Dhabi uses Tawtheeq"],
  "prompt1-row-15": ["Registered tenancy/ownership evidence is required"],
  "prompt1-row-16": ["within one month"],
  "prompt1-row-17": ["UAE nationals over 60"],
  "prompt1-row-18": ["Clinical need and provider eligibility"],
  "prompt1-row-19": ["UAE nationals can apply"],
  "prompt1-row-20": ["15 years of insured service", "private-sector expatriates generally receive end-of-service benefits"],
  "prompt1-row-21": ["standard retirement age 60 with 15 years", "men may retire early at 55 with 20 years", "women at 50 with 20 years"],
  "prompt1-row-22": ["financial/property/investment criteria"],
  "prompt1-row-23": ["Out-of-hospital deaths must be reported to police immediately"],
  "prompt1-row-24": ["Natural deaths require a burial permit", "unnatural deaths require"],
  "prompt1-row-25": ["legal succession/inheritance documents"],
  "prompt1-row-26": ["formally cancel visas", "one-year extension"]
};

const explicitPrerequisites = {
  "prompt1-row-3": { serviceId: "prompt1-row-2", sourceText: "Obtain the birth certificate." },
  "prompt1-row-4": { serviceId: "prompt1-row-2", sourceText: "Obtain the birth certificate." },
  "prompt1-row-10": { serviceId: "prompt1-row-12", sourceText: "premarital medical certificate is required" },
  "prompt1-row-15": { serviceId: "prompt1-row-14", sourceText: "registration is required before utility connection" },
  "prompt1-row-24": { serviceId: "prompt1-row-23", sourceText: "Obtain death documentation." },
  "prompt1-row-25": { serviceId: "prompt1-row-23", sourceText: "Obtain the death certificate." },
  "prompt1-row-26": { serviceId: "prompt1-row-23", sourceText: "Obtain the death certificate." }
};

function isUnknown(value) {
  return value === undefined || value === null || value === "" || value === "unknown";
}

function sourceIsVerified(service) {
  try {
    const url = new URL(service.sourceUrl);
    return service.verificationStatus === "verified_from_supplied_workbook" &&
      url.protocol === "https:" &&
      (url.hostname === "u.ae" || url.hostname.endsWith(".u.ae") || url.hostname.endsWith(".gov.ae"));
  } catch {
    return false;
  }
}

function checkService(service, answers) {
  if (!sourceIsVerified(service)) return { status: "UNVERIFIED", reasonCode: "source_unverified", checks: [] };
  const expectedEvidence = sourceEvidence[service.serviceId] || [];
  const actualEvidence = [
    service.serviceName,
    service.applicantType,
    service.eligibility,
    service.instructions,
    service.officialTiming,
    service.jurisdiction
  ].filter(Boolean).join(" ").toLowerCase();
  if (expectedEvidence.some((phrase) => !actualEvidence.includes(phrase.toLowerCase()))) {
    return { status: "UNVERIFIED", reasonCode: "source_rule_conflict", checks: [] };
  }

  const checks = [];
  function check(field, predicate, reasonCode) {
    const value = answers[field];
    if (isUnknown(value)) {
      checks.push({ field, result: "missing", ...(value === "unknown" ? { value } : {}) });
      return "missing";
    }
    const matched = predicate(value);
    checks.push({ field, value, result: matched ? "matched" : "not_matched", ...(!matched ? { reasonCode } : {}) });
    return matched ? "matched" : "not_matched";
  }
  function capture(field) {
    const value = answers[field];
    if (isUnknown(value)) {
      checks.push({ field, result: "missing", ...(value === "unknown" ? { value } : {}) });
      return "missing";
    }
    checks.push({ field, value, result: "captured" });
    return "matched";
  }
  function statusFrom(result) {
    return result === "missing" ? "INCOMPLETE" : result === "not_matched" ? "NOT_APPLICABLE" : "POTENTIALLY_APPLICABLE";
  }

  switch (service.serviceId) {
    case "prompt1-row-2": {
      const status = check("parentStatus", (value) => value !== "neither", "no_uae_parent_status");
      if (status !== "matched") return { status: statusFrom(status), checks };
      capture("birthLocation");
      capture("hospitalType");
      break;
    }
    case "prompt1-row-5":
      check("childCurrentlyInUAE", (value) => value === "yes", "child_not_in_uae");
      break;
    case "prompt1-row-3":
    case "prompt1-row-4": {
      const status = check("parentStatus", (value) => value !== "neither", "no_uae_parent_status");
      if (status !== "matched") return { status: statusFrom(status), checks };
      if (service.serviceId === "prompt1-row-4") capture("birthLocation");
      break;
    }
    case "prompt1-row-6": {
      const school = check("schoolType", (value) => value === "government", "private_school_selected");
      if (school !== "matched") return { status: statusFrom(school), checks };
      const category = check("studentCategory", (value) =>
        ["uae_national", "gcc_national", "decree_nationality", "expatriate"].includes(value),
      "student_category_not_supported");
      if (category !== "matched") return { status: statusFrom(category), checks };
      if (answers.studentCategory !== "expatriate") break;
      const employer = check("parentEmployer", (value) =>
        ["government", "semi_government", "local_entity"].includes(value),
      "parent_employment_not_eligible");
      if (employer !== "matched") return { status: statusFrom(employer), checks };
      for (const field of ["arabicScore", "englishScore", "mathScore"]) {
        const score = check(field, (value) => value >= 85, "subject_score_below_85");
        if (score !== "matched") return { status: statusFrom(score), checks };
      }
      const visa = check("residenceVisaValid", (value) => value === "yes", "residence_visa_not_valid");
      if (visa !== "matched") return { status: statusFrom(visa), checks };
      const capacity = check("schoolCapacityAvailable", (value) => value === "yes", "capacity_not_confirmed");
      if (capacity !== "matched") return { status: statusFrom(capacity), checks };
      break;
    }
    case "prompt1-row-7": {
      const age = answers.ageAtCutoff;
      const grade = answers.targetGrade;
      if (isUnknown(age)) checks.push({ field: "ageAtCutoff", result: "missing" });
      else checks.push({ field: "ageAtCutoff", value: age, result: "checked" });
      if (isUnknown(grade)) checks.push({ field: "targetGrade", result: "missing" });
      else checks.push({ field: "targetGrade", value: grade, result: "checked" });
      if (isUnknown(age) || isUnknown(grade)) return { status: "INCOMPLETE", checks };
      const minimumAge = { kg1: 4, kg2: 5, grade1: 6 }[grade];
      if (!minimumAge) break;
      checks.push({ field: "ageAtCutoff", value: age, result: age >= minimumAge ? "matched" : "not_matched" });
      if (age < minimumAge) return { status: "NOT_APPLICABLE", reasonCode: "age_below_published_minimum", checks };
      if (grade === "grade1" && age > 8) return { status: "NOT_APPLICABLE", reasonCode: "age_outside_published_range", checks };
      break;
    }
    case "prompt1-row-8":
      if (answers.schoolType === "government") return { status: "NOT_APPLICABLE", reasonCode: "government_school_selected", checks: [{ field: "schoolType", value: answers.schoolType, result: "not_matched" }] };
      check("schoolType", (value) => value === "private", "private_school_not_selected");
      break;
    case "prompt1-row-9":
      check("studentNeedsDeterminationSupport", (value) => value === "yes", "inclusive_support_not_requested");
      break;
    case "prompt1-row-10": {
      const route = check("marriageRoute", (value) => value === "sharia", "sharia_route_not_selected");
      if (route !== "matched") return { status: statusFrom(route), checks };
      const couple = check("shariaCoupleMuslim", (value) => value === "yes", "sharia_couple_condition_not_met");
      if (couple !== "matched") return { status: statusFrom(couple), checks };
      if (capture("priorMaritalStatus") !== "matched") return { status: "INCOMPLETE", checks };
      const certificate = check("premaritalCertificateValid", (value) => value === "yes", "premarital_certificate_required");
      if (certificate !== "matched") return { status: "INCOMPLETE", reasonCode: "marriage_prerequisite_pending", checks };
      const witnesses = check("guardianAndWitnessesAvailable", (value) => value === "yes", "guardian_witness_requirement");
      if (witnesses !== "matched") return { status: "INCOMPLETE", reasonCode: "marriage_prerequisite_pending", checks };
      break;
    }
    case "prompt1-row-11": {
      const route = check("marriageRoute", (value) => value === "civil", "civil_route_not_selected");
      if (route !== "matched") return { status: statusFrom(route), checks };
      const nonMuslim = check("bothNonMuslim", (value) => value === "yes", "civil_route_condition_not_met");
      if (nonMuslim !== "matched") return { status: statusFrom(nonMuslim), checks };
      capture("priorMaritalStatus");
      break;
    }
    case "prompt1-row-12": {
      const route = check("marriageRoute", (value) => value === "sharia", "sharia_route_not_selected");
      if (route !== "matched") return { status: statusFrom(route), checks };
      const couple = check("shariaCoupleMuslim", (value) => value === "yes", "sharia_couple_condition_not_met");
      if (couple !== "matched") return { status: statusFrom(couple), checks };
      capture("premaritalCertificateValid");
      break;
    }
    case "prompt1-row-13":
      check("marriageCompleted", (value) => value === "yes", "marriage_not_completed");
      break;
    case "prompt1-row-14": {
      const property = check("propertyType", (value) => value === "rented", "property_not_rented");
      if (property !== "matched") return { status: statusFrom(property), checks };
      capture("emirate");
      break;
    }
    case "prompt1-row-15": {
      const needed = check("utilityConnectionNeeded", (value) => value === "yes", "utility_connection_not_needed");
      if (needed !== "matched") return { status: statusFrom(needed), checks };
      if (answers.propertyType === "rented") {
        const tenancy = check("tenancyRegistered", (value) => value === "yes", "tenancy_registration_required_first");
        if (tenancy !== "matched") return { status: "INCOMPLETE", reasonCode: "explicit_prerequisite_pending", checks };
      } else if (answers.propertyType === "other") {
        return { status: "INCOMPLETE", reasonCode: "ownership_or_tenancy_needs_confirmation", checks };
      } else {
        check("propertyType", (value) => value === "owned" || value === "rented", "ownership_or_tenancy_evidence_required");
      }
      capture("emirate");
      break;
    }
    case "prompt1-row-16": {
      const status = check("parentStatus", (value) => value === "uae_citizen" || value === "resident" || value === "both", "person_not_uae_citizen_or_resident");
      if (status !== "matched") return { status: statusFrom(status), checks };
      capture("emirate");
      break;
    }
    case "prompt1-row-17": {
      const nationality = check("parentStatus", (value) => value === "uae_citizen" || value === "both", "not_uae_national");
      if (nationality !== "matched") return { status: statusFrom(nationality), checks };
      const age = check("age", (value) => value > 60, "age_not_over_60");
      if (age !== "matched") return { status: statusFrom(age), checks };
      break;
    }
    case "prompt1-row-18": {
      const parent = check("parentStatus", (value) => value === "uae_citizen" || value === "resident" || value === "both", "parent_status_not_supported");
      if (parent !== "matched") return { status: statusFrom(parent), checks };
      const need = check("careNeed", (value) => value === "healthcare" || value === "both", "healthcare_not_selected");
      if (need !== "matched") return { status: statusFrom(need), checks };
      const clinicalNeed = check("clinicalNeedAssessed", (value) => value === "yes", "clinical_need_not_confirmed");
      if (clinicalNeed !== "matched") return { status: "INCOMPLETE", reasonCode: "clinical_eligibility_needs_assessment", checks };
      break;
    }
    case "prompt1-row-19": {
      const nationality = check("parentStatus", (value) => value === "uae_citizen" || value === "both", "not_uae_national");
      if (nationality !== "matched") return { status: statusFrom(nationality), checks };
      const need = check("careNeed", (value) => value === "social_support" || value === "both", "social_support_not_selected");
      if (need !== "matched") return { status: statusFrom(need), checks };
      return { status: "INCOMPLETE", reasonCode: "social_welfare_assessment_required", checks };
    }
    case "prompt1-row-20": {
      const nationality = check("nationalityCategory", (value) =>
        ["uae_national", "gcc_national", "expatriate"].includes(value),
      "nationality_not_covered");
      if (nationality !== "matched") return { status: statusFrom(nationality), checks };
      const sector = check("employmentSector", (value) => value === "public" || value === "private", "employment_not_confirmed");
      if (sector !== "matched") return { status: statusFrom(sector), checks };
      if (answers.nationalityCategory === "expatriate" && answers.employmentSector !== "private") {
        return { status: "INCOMPLETE", reasonCode: "end_of_service_route_needs_confirmation", checks };
      }
      if (answers.nationalityCategory === "expatriate") {
        return { status: "INCOMPLETE", reasonCode: "end_of_service_route_needs_confirmation", checks };
      }
      break;
    }
    case "prompt1-row-21": {
      const nationality = check("nationalityCategory", (value) => value === "uae_national" || value === "gcc_national", "not_uae_or_gcc_national");
      if (nationality !== "matched") return { status: statusFrom(nationality), checks };
      const route = check("retirementRoute", (value) => value === "standard" || value === "early", "retirement_route_not_supported");
      if (route !== "matched") return { status: statusFrom(route), checks };
      const sector = check("employmentSector", (value) => value === "public" || value === "private", "employment_not_confirmed");
      if (sector !== "matched") return { status: statusFrom(sector), checks };
      const isEarly = answers.retirementRoute === "early";
      let minimumAge = 60;
      let minimumServiceYears = 15;
      if (isEarly) {
        const gender = check("retirementGender", (value) => value === "man" || value === "woman", "retirement_gender_unknown");
        if (gender !== "matched") return { status: statusFrom(gender), checks };
        minimumAge = answers.retirementGender === "man" ? 55 : 50;
        minimumServiceYears = 20;
      }
      const age = check("age", (value) => value >= minimumAge, "age_below_published_retirement_threshold");
      if (age !== "matched") return { status: statusFrom(age), checks };
      check("insuredYears", (value) => value >= minimumServiceYears, "insured_service_below_published_threshold");
      break;
    }
    case "prompt1-row-22": {
      const nationality = check("nationalityCategory", (value) => value === "expatriate", "not_expatriate");
      if (nationality !== "matched") return { status: statusFrom(nationality), checks };
      const route = check("retirementRoute", (value) => value === "residence_visa", "retirement_visa_not_selected");
      if (route !== "matched") return { status: statusFrom(route), checks };
      check("age", () => true, "age_needs_official_confirmation");
      return { status: "INCOMPLETE", reasonCode: "financial_criteria_not_in_catalogue", checks };
    }
    case "prompt1-row-23":
      check("deathLocation", (value) => ["hospital", "outside_hospital", "abroad"].includes(value), "death_location_unknown");
      break;
    case "prompt1-row-24": {
      const circumstance = check("deathCircumstance", (value) => value === "natural" || value === "unexpected", "death_circumstance_unknown");
      if (circumstance !== "matched") return { status: statusFrom(circumstance), checks };
      break;
    }
    case "prompt1-row-25": {
      const certificate = check("deathCertificateAvailable", (value) => value === "yes", "death_certificate_required");
      if (certificate !== "matched") return { status: "INCOMPLETE", reasonCode: "death_certificate_prerequisite_pending", checks };
      break;
    }
    case "prompt1-row-26": {
      const status = check("deceasedStatus", (value) => value === "resident", "deceased_not_resident");
      if (status !== "matched") return { status: statusFrom(status), checks };
      check("dependantsOnVisa", (value) => value === "yes" || value === "no", "dependant_status_unknown");
      break;
    }
    default:
      break;
  }
  if (checks.some((condition) => condition.result === "missing")) {
    return { status: "INCOMPLETE", checks };
  }
  if (checks.some((condition) => condition.result === "not_matched")) {
    return { status: "NOT_APPLICABLE", checks };
  }
  return { status: "POTENTIALLY_APPLICABLE", checks };
}

function validateAnswers(eventKey, answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return false;
  const allowedFields = new Set(ruleFields[eventKey]);
  return Object.entries(answers).every(([field, value]) => {
    if (!allowedFields.has(field)) return false;
    const question = questions[field];
    if (question.type === "choice") return question.options.includes(value);
    if (question.type === "text") return typeof value === "string" &&
      value.trim().length >= 2 && value.length <= question.maxLength;
    return typeof value === "number" && Number.isFinite(value) && value >= question.min && value <= question.max;
  });
}

function evaluateFamilyFirstEvent(eventKey, answers = {}, services = catalogue.services) {
  if (!supportedEventKeys.includes(eventKey)) throw new TypeError("A supported Family First event is required");
  if (!validateAnswers(eventKey, answers)) throw new TypeError("Answers contain an unsupported field or value");

  const eventServices = services.filter((service) => service.lifeEvent === eventKey);
  const servicesById = new Map(services.map((service) => [service.serviceId, service]));
  const results = eventServices.map((service) => {
    const check = checkService(service, answers);
    const fields = serviceRuleInputs[service.serviceId] || [];
    const prerequisite = explicitPrerequisites[service.serviceId];
    const prerequisiteService = prerequisite && servicesById.get(prerequisite.serviceId);
    const prerequisiteSource = [
      service.serviceName, service.eligibility, service.instructions,
      prerequisiteService?.serviceName, prerequisiteService?.eligibility, prerequisiteService?.instructions
    ].filter(Boolean).join(" ");
    const prerequisiteVerified = prerequisite && prerequisiteService &&
      sourceIsVerified(prerequisiteService) &&
      prerequisiteSource.toLowerCase().includes(prerequisite.sourceText.toLowerCase());
    if (prerequisite && !prerequisiteVerified) {
      check.status = "UNVERIFIED";
      check.reasonCode = "source_rule_conflict";
    }
    const verifiedPrerequisites = prerequisiteVerified
      ? [{
          serviceId: prerequisiteService.serviceId,
          serviceName: prerequisiteService.serviceName,
          sourceUrl: prerequisiteService.sourceUrl,
          sourceText: prerequisite.sourceText
        }]
      : [];
    const missing = fields.filter((field) =>
      check.checks.some((condition) => condition.field === field && condition.result === "missing") &&
      (answers[field] === undefined || answers[field] === null || answers[field] === "")
    );
    const serviceRule = {
      ruleId: `family-first-${service.serviceId}`,
      lifeEvent: eventKey,
      ruleName: service.serviceName,
      description: service.eligibility || "Service listed in the supplied Prompt 1 catalogue; confirm details with the responsible entity.",
      conditions: fields.map((field) => ({
        field,
        operator: questions[field].type === "number" ? "source_defined_threshold" :
          questions[field].type === "text" ? "context_value" : "source_defined_choice",
        sourceText: field === "ageAtCutoff"
          ? "Age is assessed against 31 August of the admission year."
          : field === "emirate"
            ? service.jurisdiction
          : service.eligibility || service.applicantType
      })),
      applicantType: service.applicantType,
      jurisdiction: service.jurisdiction,
      relatedServiceIds: [service.serviceId],
      prerequisites: verifiedPrerequisites,
      nextSteps: service.instructions,
      requiredDocuments: service.requiredDocuments,
      officialDeadline: service.officialDeadline,
      officialTiming: service.officialTiming,
      sourceUrl: service.sourceUrl,
      sourceName: service.sourceName,
      lastVerified: service.lastVerified,
      verificationStatus: sourceIsVerified(service) ? service.verificationStatus : "not_verified",
      status: check.status,
      reasonCode: check.reasonCode || null,
      conditionsChecked: check.checks,
      missingInformation: missing.filter((field) => check.checks.some((condition) =>
        condition.field === field && condition.result === "missing"
      )),
      userInformationUsed: check.checks.filter((condition) => Object.hasOwn(condition, "value"))
    };
    return serviceRule;
  });
  const requiredFields = [...new Set(results.flatMap((rule) => rule.missingInformation))];
  const questionsForUser = requiredFields.map((field) => ({
    field,
    type: questions[field].type,
    options: questions[field].options || null,
    min: questions[field].min ?? null,
    max: questions[field].max ?? questions[field].maxLength ?? null
  }));
  const hasUnverified = results.some((rule) => rule.status === "UNVERIFIED");
  const hasMissingServices = eventServices.length === 0;
  const status = hasUnverified ? "INCOMPLETE" :
    hasMissingServices ? "INCOMPLETE" :
    questionsForUser.length ? "INCOMPLETE" :
      results.some((rule) => rule.status === "POTENTIALLY_APPLICABLE") ? "POTENTIALLY_APPLICABLE" :
        results.length > 0 && results.every((rule) => rule.status === "NOT_APPLICABLE") ? "NOT_APPLICABLE" : "INCOMPLETE";

  return {
    eventKey,
    status,
    rules: results,
    questions: questionsForUser,
    missingInformation: [
      ...questionsForUser.map((question) => question.field),
      ...(hasMissingServices ? ["service_catalogue_records"] : [])
    ],
    sourceStatus: hasMissingServices ? "SOURCE_REQUIRED" :
      hasUnverified ? "PARTIALLY_UNVERIFIED" : "VERIFIED_FROM_SUPPLIED_WORKBOOK"
  };
}

module.exports = {
  evaluateFamilyFirstEvent,
  validateAnswers,
  ruleFields,
  serviceRuleInputs,
  SOURCE_REQUIRED: "SOURCE_REQUIRED"
};
