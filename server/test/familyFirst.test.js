const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const { buildEventDefinitions, supportedEventKeys } = require("../config/familyFirstEvents");
const { evaluateFamilyFirstEvent } = require("../services/familyFirstRules");
const serviceData = require("../data/derived/prompt1/lifeEventServices.json");
const entityData = require("../data/derived/prompt4/entityDirectory.json");
const familyFirstRouter = require("../routes/familyFirst");
const requireAuth = require("../middleware/requireAuth");

const jwtSecret = "family-first-test-secret";
process.env.JWT_SECRET = jwtSecret;

function createTestDatabase() {
  const connection = new sqlite3.Database(":memory:");
  const database = {
    exec(sql) {
      return new Promise((resolve, reject) => {
        connection.exec(sql, (error) => error ? reject(error) : resolve());
      });
    },
    get(sql, ...params) {
      return new Promise((resolve, reject) => {
        connection.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
      });
    },
    all(sql, ...params) {
      return new Promise((resolve, reject) => {
        connection.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
      });
    },
    run(sql, ...params) {
      return new Promise((resolve, reject) => {
        connection.run(sql, params, function onRun(error) {
          if (error) {
            reject(error);
            return;
          }
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        connection.close((error) => error ? reject(error) : resolve());
      });
    }
  };
  return database;
}

function tokenFor(userId) {
  return jwt.sign({ userId }, jwtSecret);
}

test("Family First source transparency, progress persistence, and access control", async (t) => {
  const database = createTestDatabase();
  await database.exec(`
    CREATE TABLE familyJourneys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      eventKey TEXT NOT NULL,
      affectedMembers TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE familyJourneySteps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journeyId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      stepKey TEXT NOT NULL,
      position INTEGER NOT NULL,
      details TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
      progressStatus TEXT NOT NULL DEFAULT 'not_started' CHECK (progressStatus IN ('not_started', 'in_progress', 'completed')),
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (journeyId, stepKey)
    );
  `);

  const app = express();
  app.use(express.json());
  app.use(requireAuth);
  app.use("/api/family-first", familyFirstRouter.createFamilyFirstRouter(database));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/family-first`;

  async function request(url, userId, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (userId !== null) headers.Authorization = `Bearer ${tokenFor(userId)}`;
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const body = await response.json();
    return { response, body };
  }

  try {
    await t.test("rules engine evaluates only source-backed conditions and asks for missing information", async () => {
      const expectedServiceCounts = {
        new_baby: 4, child_school: 4, marriage: 4, moving_home: 3,
        elderly_care: 3, retirement: 3, bereavement: 4
      };
      for (const eventKey of supportedEventKeys) {
        const { response, body } = await request("/evaluate", 404, {
          method: "POST",
          body: { eventKey }
        });
        assert.equal(response.status, 200);
        assert.equal(body.eventKey, eventKey);
        assert.equal(body.sourceStatus, "VERIFIED_FROM_SUPPLIED_WORKBOOK");
        assert.equal(body.rules.length, expectedServiceCounts[eventKey]);
        assert.ok(body.questions.length > 0);
        assert.ok(body.rules.some((rule) => rule.status === "INCOMPLETE"));
        for (const rule of body.rules) {
          const catalogueRecord = serviceData.services.find((service) => service.serviceId === rule.relatedServiceIds[0]);
          assert.ok(catalogueRecord);
          assert.equal(rule.lifeEvent, eventKey);
          assert.equal(rule.verificationStatus, "verified_from_supplied_workbook");
          assert.ok(["INCOMPLETE", "POTENTIALLY_APPLICABLE"].includes(rule.status));
          assert.ok(rule.description);
          assert.equal(rule.requiredDocuments, catalogueRecord.requiredDocuments);
          assert.equal(rule.nextSteps, catalogueRecord.instructions);
          assert.equal(rule.officialDeadline, catalogueRecord.officialDeadline);
          assert.equal(rule.sourceUrl, catalogueRecord.sourceUrl);
          assert.equal(rule.lastVerified, catalogueRecord.lastVerified);
          assert.match(rule.sourceUrl, /^https:\/\/u\.ae\//);
        }
      }

      const incomplete = await request("/evaluate", 404, {
        method: "POST",
        body: { eventKey: "new_baby", answers: { parentStatus: "resident" } }
      });
      assert.equal(incomplete.body.status, "INCOMPLETE");
      assert.ok(incomplete.body.questions.some((question) => question.field === "birthLocation"));
      assert.equal(incomplete.body.questions.find((question) => question.field === "childCurrentlyInUAE")?.type, "choice");
      assert.ok(incomplete.body.rules[0].conditionsChecked.some((condition) =>
        condition.field === "parentStatus" && condition.value === "resident" && condition.result === "matched"
      ));
      const movingWithEmirate = await request("/evaluate", 404, {
        method: "POST",
        body: {
          eventKey: "moving_home",
          answers: {
            propertyType: "rented",
            tenancyRegistered: "yes",
            utilityConnectionNeeded: "yes",
            parentStatus: "resident",
            emirate: "Dubai"
          }
        }
      });
      assert.equal(movingWithEmirate.response.status, 200);
      assert.ok(movingWithEmirate.body.rules.some((rule) =>
        rule.conditionsChecked.some((condition) => condition.field === "emirate" && condition.value === "Dubai")
      ));
      const invalidEmirate = await request("/evaluate", 404, {
        method: "POST",
        body: { eventKey: "moving_home", answers: { emirate: "D".repeat(61) } }
      });
      assert.equal(invalidEmirate.response.status, 400);

      const baby = evaluateFamilyFirstEvent("new_baby", {
        parentStatus: "resident", birthLocation: "uae", hospitalType: "government", childCurrentlyInUAE: "yes"
      });
      assert.ok(baby.rules.every((rule) => rule.status === "POTENTIALLY_APPLICABLE"));
      assert.ok(baby.rules.every((rule) => rule.sourceUrl && rule.requiredDocuments));
      const noUaeParent = evaluateFamilyFirstEvent("new_baby", {
        parentStatus: "neither", birthLocation: "uae", hospitalType: "government", childCurrentlyInUAE: "yes"
      });
      assert.equal(noUaeParent.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-2").status, "NOT_APPLICABLE");

      const school = evaluateFamilyFirstEvent("child_school", {
        schoolType: "government",
        studentCategory: "expatriate",
        parentEmployer: "government",
        arabicScore: 85,
        englishScore: 86,
        mathScore: 90,
        residenceVisaValid: "yes",
        schoolCapacityAvailable: "yes",
        ageAtCutoff: 6,
        targetGrade: "grade1"
      });
      assert.equal(school.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-6").status, "POTENTIALLY_APPLICABLE");
      assert.equal(school.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-7").status, "POTENTIALLY_APPLICABLE");
      const schoolBelowScore = evaluateFamilyFirstEvent("child_school", {
        schoolType: "government", studentCategory: "expatriate", parentEmployer: "government",
        arabicScore: 84, englishScore: 90, mathScore: 90, residenceVisaValid: "yes",
        schoolCapacityAvailable: "yes"
      });
      assert.equal(schoolBelowScore.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-6").status, "NOT_APPLICABLE");
      const inclusiveSupport = evaluateFamilyFirstEvent("child_school", { studentNeedsDeterminationSupport: "yes" });
      assert.equal(inclusiveSupport.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-9").status, "POTENTIALLY_APPLICABLE");

      const marriage = evaluateFamilyFirstEvent("marriage", {
        marriageRoute: "sharia", shariaCoupleMuslim: "yes", priorMaritalStatus: "previously_married",
        premaritalCertificateValid: "yes", guardianAndWitnessesAvailable: "yes",
        bothNonMuslim: "no", marriageCompleted: "no"
      });
      assert.equal(marriage.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-10").status, "POTENTIALLY_APPLICABLE");
      assert.equal(marriage.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-11").status, "NOT_APPLICABLE");

      const moving = evaluateFamilyFirstEvent("moving_home", {
        propertyType: "rented", tenancyRegistered: "yes", utilityConnectionNeeded: "yes",
        parentStatus: "resident", emirate: "Dubai"
      });
      assert.equal(moving.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-14").status, "POTENTIALLY_APPLICABLE");
      assert.equal(moving.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-15").status, "POTENTIALLY_APPLICABLE");
      const movingBeforeRegistration = evaluateFamilyFirstEvent("moving_home", {
        propertyType: "rented", tenancyRegistered: "no", utilityConnectionNeeded: "yes",
        parentStatus: "resident", emirate: "Abu Dhabi"
      });
      const utilities = movingBeforeRegistration.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-15");
      assert.equal(utilities.status, "INCOMPLETE");
      assert.equal(utilities.reasonCode, "explicit_prerequisite_pending");

      const elderly = evaluateFamilyFirstEvent("elderly_care", {
        parentStatus: "uae_citizen", age: 61, careNeed: "social_support", clinicalNeedAssessed: "unknown"
      });
      assert.equal(elderly.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-17").status, "POTENTIALLY_APPLICABLE");
      const welfare = elderly.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-19");
      assert.equal(welfare.status, "INCOMPLETE");
      assert.equal(welfare.reasonCode, "social_welfare_assessment_required");

      const retirement = evaluateFamilyFirstEvent("retirement", {
        nationalityCategory: "uae_national", employmentSector: "public", age: 60,
        insuredYears: 15, retirementRoute: "standard"
      });
      assert.equal(retirement.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-21").status, "POTENTIALLY_APPLICABLE");
      assert.equal(retirement.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-22").status, "NOT_APPLICABLE");
      const earlyRetirement = evaluateFamilyFirstEvent("retirement", {
        nationalityCategory: "uae_national", employmentSector: "private", age: 55,
        insuredYears: 20, retirementRoute: "early", retirementGender: "man"
      });
      assert.equal(earlyRetirement.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-21").status, "POTENTIALLY_APPLICABLE");
      const earlyRetirementBelowThreshold = evaluateFamilyFirstEvent("retirement", {
        nationalityCategory: "uae_national", employmentSector: "private", age: 49,
        insuredYears: 20, retirementRoute: "early", retirementGender: "woman"
      });
      assert.equal(earlyRetirementBelowThreshold.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-21").status, "NOT_APPLICABLE");
      const bereavement = evaluateFamilyFirstEvent("bereavement", {
        deathLocation: "outside_hospital", deathCircumstance: "unexpected", deceasedStatus: "resident",
        deathCertificateAvailable: "no", dependantsOnVisa: "yes"
      });
      assert.equal(bereavement.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-23").status, "POTENTIALLY_APPLICABLE");
      assert.equal(bereavement.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-25").status, "INCOMPLETE");
      assert.equal(bereavement.rules.find((rule) => rule.relatedServiceIds[0] === "prompt1-row-26").status, "POTENTIALLY_APPLICABLE");

      const conflictingSource = {
        ...serviceData.services[0],
        applicantType: "Other applicants only",
        eligibility: "A conflicting source record with no corresponding verified condition."
      };
      const conflict = evaluateFamilyFirstEvent("new_baby", {}, [conflictingSource]);
      assert.equal(conflict.rules[0].status, "UNVERIFIED");
      assert.equal(conflict.rules[0].reasonCode, "source_rule_conflict");
      assert.equal(conflict.sourceStatus, "PARTIALLY_UNVERIFIED");
      const emptyEventCatalogue = evaluateFamilyFirstEvent("new_baby", {}, []);
      assert.equal(emptyEventCatalogue.status, "INCOMPLETE");
      assert.equal(emptyEventCatalogue.sourceStatus, "SOURCE_REQUIRED");
      assert.deepEqual(emptyEventCatalogue.missingInformation, ["service_catalogue_records"]);
      assert.deepEqual(emptyEventCatalogue.rules, []);

      const explicitDependencies = {
        new_baby: ["prompt1-row-2"],
        marriage: ["prompt1-row-12"],
        moving_home: ["prompt1-row-14"],
        bereavement: ["prompt1-row-23"]
      };
      for (const [eventKey, prerequisiteIds] of Object.entries(explicitDependencies)) {
        const evaluation = evaluateFamilyFirstEvent(eventKey);
        const actual = evaluation.rules.flatMap((rule) => rule.prerequisites.map((step) => step.serviceId));
        for (const serviceId of prerequisiteIds) assert.ok(actual.includes(serviceId), `${serviceId} prerequisite should be source-backed`);
      }

      const invalid = await request("/evaluate", 404, {
        method: "POST",
        body: { eventKey: "divorce" }
      });
      assert.equal(invalid.response.status, 400);
      const unsupportedAnswers = await request("/evaluate", 404, {
        method: "POST",
        body: { eventKey: "new_baby", answers: { parentStatus: "citizen" } }
      });
      assert.equal(unsupportedAnswers.response.status, 400);
      const badNumber = await request("/evaluate", 404, {
        method: "POST",
        body: { eventKey: "child_school", answers: { arabicScore: 101 } }
      });
      assert.equal(badNumber.response.status, 400);
      const unauthenticated = await request("/evaluate", null, {
        method: "POST",
        headers: { "X-User-Id": "404" },
        body: { eventKey: "new_baby" }
      });
      assert.equal(unauthenticated.response.status, 401);
    });

    await t.test("only the seven requested events and traceable official references are exposed", async () => {
      assert.deepEqual(supportedEventKeys, [
        "new_baby",
        "child_school",
        "marriage",
        "moving_home",
        "elderly_care",
        "retirement",
        "bereavement"
      ]);
      const { response, body } = await request("/events", 1);
      assert.equal(response.status, 200);
      assert.deepEqual(body.map((event) => event.eventKey), supportedEventKeys);
      assert.ok(body.every((event) => event.journeyStatus === "services_available"));
      const expectedServiceCounts = {
        new_baby: 4,
        child_school: 4,
        marriage: 4,
        moving_home: 3,
        elderly_care: 3,
        retirement: 3,
        bereavement: 4
      };
      for (const event of body) {
        assert.ok(Array.isArray(event.sources));
        assert.equal(event.services.length, expectedServiceCounts[event.eventKey]);
        assert.ok(event.entities.length > 0);
        assert.ok(["verified_local_sources", "incomplete_source"].includes(event.informationStatus));
        assert.ok(event.entities.every((entity) =>
          entity.lifeEvent === event.eventKey &&
          entity.entityName &&
          entity.verificationStatus &&
          (entity.sourceUrl === null || /^https:\/\/(?:[^/]+\.)?(?:u\.ae|gov\.ae)\//.test(entity.sourceUrl)) &&
          (entity.officialInfoUrl === null || /^https:\/\/(?:[^/]+\.)?(?:u\.ae|gov\.ae)\//.test(entity.officialInfoUrl))
        ));
        for (const source of event.sources) {
          assert.match(source.url, /^https:\/\/(?:[^/]+\.)?(?:u\.ae|gov\.ae)\//);
          assert.ok(source.verificationStatus);
          assert.ok(source.lastVerifiedAt);
        }
        assert.ok(body.find((event) => event.eventKey === "new_baby").entities.length > 1);
        assert.ok(entityData.entities.length > 0);
        for (const service of event.services) {
          assert.equal(service.lifeEvent, event.eventKey);
          assert.equal(service.verificationStatus, "verified_from_supplied_workbook");
          assert.match(service.officialServiceUrl, /^https:\/\/u\.ae\//);
          assert.equal(service.sourceUrl, service.officialServiceUrl);
          assert.equal(service.lastVerified, "2026-11-10");
          assert.ok(service.serviceName);
          assert.ok(service.governmentEntity);
          assert.ok(service.instructions);
          assert.ok(service.eligibility);
          assert.ok(service.requiredDocuments);
          assert.equal(service.officialContact, null);
          assert.ok(service.sourceMetadata.sourceUrlColumnValue);
          assert.ok(service.sourceMetadata.dateCheckedColumnValue);
        }
      }
      assert.equal(serviceData.services.length, 25);
      assert.ok(serviceData.services.every((service) =>
        service.officialProcessingTime === null &&
        service.officialDeadline === null &&
        service.officialContact === null
      ));
      assert.ok(new Set(serviceData.services.map((service) => service.jurisdiction)).size > 1);
      assert.ok(new Set(serviceData.services.map((service) => service.applicantType)).size > 1);
      assert.equal(serviceData.sourceFile, "server/data/official/prompt1/UAE_Life_Event_Services_Detailed.xlsx");
      assert.ok(fs.existsSync(path.resolve(__dirname, "..", serviceData.sourceFile.replace(/^server\//, ""))));
      const missingData = buildEventDefinitions({
        lastVerifiedAt: null,
        sources: {
          partialReference: {
            title: "Official source",
            url: "https://u.ae/",
            authority: "UAE Government Portal"
          }
        },
        events: {
          new_baby: {
            journeyStatus: "incomplete",
            missingInformationKey: "newBabyGap",
            sourceKeys: ["partialReference", "missing-source"],
            steps: []
          }
        }
      }, []);
      assert.deepEqual(Object.keys(missingData).filter((key) => supportedEventKeys.includes(key)), supportedEventKeys);
      assert.equal(missingData.new_baby.sources.length, 1);
      assert.equal(missingData.new_baby.sources[0].verificationStatus, "not_verified");
      assert.equal(missingData.new_baby.sources[0].lastVerifiedAt, null);
      assert.deepEqual(missingData.new_baby.steps, []);
      assert.equal(missingData.new_baby.journeyStatus, "incomplete");
      const partialDirectory = buildEventDefinitions(null, serviceData.services, {
        entities: [{
          entityId: "isolated-incomplete-fixture",
          lifeEvent: "new_baby",
          entityName: "Test-only incomplete record",
          officialInfoUrl: null,
          sourceUrl: null,
          documentsToPrepare: null,
          nextSteps: null,
          verificationStatus: "incomplete_source"
        }]
      });
      assert.equal(partialDirectory.new_baby.entities[0].officialInfoUrl, null);
      assert.equal(partialDirectory.new_baby.entities[0].sourceUrl, null);
      assert.equal(partialDirectory.new_baby.informationStatus, "incomplete_source");
      const emptyData = buildEventDefinitions(null, []);
      assert.deepEqual(Object.keys(emptyData), supportedEventKeys);
      assert.ok(Object.values(emptyData).every((event) =>
        event.sources.length === 0 && event.services.length === 0 && event.steps.length === 0
      ));

      for (const eventKey of supportedEventKeys) {
        const created = await request("/", 303, {
          method: "POST",
          body: {
            eventKey,
            affectedMembers: [{ label: "Test member", relationship: "self" }]
          }
        });
        assert.equal(created.response.status, 201, `${eventKey} should be saveable`);
        assert.equal(created.body.eventKey, eventKey);
        assert.equal(created.body.services.length, expectedServiceCounts[eventKey]);
        assert.equal(created.body.progress.total, expectedServiceCounts[eventKey]);
        assert.ok(created.body.steps.every((step) => step.progressStatus === "not_started"));
      }
    });

    await t.test("personal progress saves, reloads, and remains distinct from official information", async () => {
      const { response: createResponse, body: journey } = await request("/", 101, {
        method: "POST",
        body: {
          eventKey: "marriage",
          affectedMembers: [{ label: "Test member", relationship: "self" }]
        }
      });
      assert.equal(createResponse.status, 201);
      assert.equal(journey.progress.total, 4);
      assert.equal(journey.steps.length, 4);
      assert.ok(journey.steps.every((step) => step.progressStatus === "not_started"));

      const invalid = await request(`/${journey.id}/steps`, 101, {
        method: "POST",
        body: { text: "   " }
      });
      assert.equal(invalid.response.status, 400);

      const tooLong = await request(`/${journey.id}/steps`, 101, {
        method: "POST",
        body: { text: "x".repeat(181) }
      });
      assert.equal(tooLong.response.status, 400);

      const { response: addResponse, body: updated } = await request(`/${journey.id}/steps`, 101, {
        method: "POST",
        body: { text: "Prepare my own notes" }
      });
      assert.equal(addResponse.status, 201);
      assert.equal(updated.progress.total, 5);
      assert.equal(updated.progress.completed, 0);
      const personalStep = updated.steps.find((step) => step.origin === "user_entered");
      assert.ok(personalStep);
      assert.equal(personalStep.details.text, "Prepare my own notes");
      assert.equal(personalStep.details.userEntered, true);

      const { response: inProgressResponse, body: inProgress } = await request(
        `/${journey.id}/steps/${personalStep.id}`,
        101,
        { method: "PATCH", body: { status: "in_progress" } }
      );
      assert.equal(inProgressResponse.status, 200);
      assert.equal(inProgress.steps.find((step) => step.id === personalStep.id).progressStatus, "in_progress");

      const invalidStatus = await request(`/${journey.id}/steps/${personalStep.id}`, 101, {
        method: "PATCH",
        body: { status: "submitted_to_government" }
      });
      assert.equal(invalidStatus.response.status, 400);

      const { response: completeResponse, body: completed } = await request(
        `/${journey.id}/steps/${personalStep.id}`,
        101,
        { method: "PATCH", body: { status: "completed" } }
      );
      assert.equal(completeResponse.status, 200);
      assert.equal(completed.progress.completed, 1);
      assert.equal(completed.progress.percent, 20);

      const { response: reloadResponse, body: reloaded } = await request(`/${journey.id}`, 101);
      assert.equal(reloadResponse.status, 200);
      const reloadedPersonalStep = reloaded.steps.find((step) => step.id === personalStep.id);
      assert.equal(reloadedPersonalStep.completed, true);
      assert.equal(reloadedPersonalStep.progressStatus, "completed");
      assert.equal(reloadedPersonalStep.origin, "user_entered");
    });

    await t.test("invalid events, missing authentication, and cross-user access are rejected", async () => {
      const invalidEvent = await request("/", 202, {
        method: "POST",
        body: {
          eventKey: "divorce",
          affectedMembers: [{ label: "Test member", relationship: "self" }]
        }
      });
      assert.equal(invalidEvent.response.status, 400);

      const noAuth = await request("/events", null, { headers: { "X-User-Id": "101" } });
      assert.equal(noAuth.response.status, 401);

      const ownerJourneys = await request("/", 101);
      const otherJourneys = await request("/", 202);
      assert.equal(ownerJourneys.body.length, 1);
      assert.deepEqual(otherJourneys.body, []);

      const journeyId = ownerJourneys.body[0].id;
      const otherUserJourney = await request(`/${journeyId}`, 202);
      assert.equal(otherUserJourney.response.status, 404);
      const otherUserStep = await request(`/${journeyId}/steps/1`, 202, {
        method: "PATCH",
        body: { completed: true }
      });
      assert.equal(otherUserStep.response.status, 404);
    });

    await t.test("all supported locales include personal progress and unverified-source messaging", async () => {
      const clientRoot = path.resolve(__dirname, "../../client/src");
      const requiredKeys = [
        "notVerified",
        "noSourcesAvailable",
        "noServicesAvailable",
        "rulesEngineTitle",
        "rulesEvaluationLoading",
        "rulesEvaluationFailed",
        "rulesSourceRequired",
        "rulesPartiallyUnverified",
        "rulesMissingExplanation",
        "rulesNeedConfirmation",
        "rulesNoPersonalData",
        "rulesNotApplicableNotice",
        "serviceApplicabilityNotEvaluated",
        "ruleQuestionsIntro",
        "ruleSelectAnswer",
        "evaluateRules",
        "ruleConditions",
        "ruleDocuments",
        "ruleNextSteps",
        "personalizationUnavailable",
        "governmentServices",
        "servicesAvailable",
        "serviceLanguageNote",
        "applicantType",
        "jurisdiction",
        "eligibility",
        "requiredDocuments",
        "instructions",
        "prerequisites",
        "officialFee",
        "officialTiming",
        "officialContact",
        "openOfficialService",
        "personalProgressTitle",
        "personalProgressNotice",
        "personalProgressEmpty",
        "progressItemLabel",
        "addProgressItem",
        "savingProgress",
        "progressSaveFailed",
        "progressSummary",
        "userEntered",
        "publisher",
        "officialStep",
        "navigatorDisclaimer",
        "entitiesAvailable",
        "entityJourneyHeading",
        "noVerifiedEntities",
        "sourceInformationIncomplete",
        "officialLinkUnavailable",
        "openOfficialInformation",
        "openEntityWebsite",
        "sourceEvidence",
        "entityBoundary",
        "progressStatusLabel",
        "userManagedServiceStep"
      ];
      for (const language of ["en", "ar", "hi", "ml"]) {
        const locale = JSON.parse(fs.readFileSync(path.join(clientRoot, "locales", `${language}.json`), "utf8"));
        for (const key of requiredKeys) {
          assert.equal(typeof locale.familyFirst[key], "string", `${language} missing ${key}`);
          assert.ok(locale.familyFirst[key].trim(), `${language} has empty ${key}`);
        }
        for (const eventKey of supportedEventKeys) {
          assert.ok(locale.familyFirst.events[eventKey].title, `${language} missing ${eventKey} title`);
          assert.ok(locale.familyFirst.events[eventKey].description, `${language} missing ${eventKey} description`);
        }
        assert.ok(Object.values(locale.familyFirst.ruleStatuses).every((label) => label.trim()));
        assert.ok(Object.values(locale.familyFirst.ruleConditionResults).every((label) => label.trim()));
        assert.ok(Object.values(locale.familyFirst.ruleQuestionLabels).every((label) => label.trim()));
        for (const field of ["emirate", "childCurrentlyInUAE"]) {
          assert.ok(locale.familyFirst.ruleQuestionLabels[field]?.trim(), `${language} missing ${field} rule question`);
        }
        assert.ok(Object.values(locale.familyFirst.ruleOptionLabels).every((label) => label.trim()));
        assert.ok(Object.values(locale.familyFirst.ruleReasons).every((label) => label.trim()));
        assert.ok(Object.values(locale.familyFirst.sourceTitles).every((title) => title.trim()));
        assert.ok(Object.values(locale.familyFirst.sourcePublishers).every((publisher) => publisher.trim()));
        assert.ok(Object.values(locale.familyFirst.sourceStatuses).every((status) => status.trim()));
        assert.ok(Object.values(locale.familyFirst.progressStatuses).every((status) => status.trim()));
      }
      const page = fs.readFileSync(path.join(clientRoot, "pages", "FamilyFirst.jsx"), "utf8");
      assert.match(page, /language === "ar" \? "rtl" : "ltr"/);
      assert.match(page, /validOfficialInfoLink/);
      assert.match(page, /target="_blank" rel="noopener noreferrer"/);
      assert.match(page, /EntityDirectory entities=/);
      assert.match(page, /progressStatuses\[status\]/);
      assert.doesNotMatch(page, /type="checkbox"/);
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await database.close();
  }
});
