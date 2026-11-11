const sourceData = require("../data/official/prompt1/verified/lifeEvents.json");
const serviceData = require("../data/derived/prompt1/lifeEventServices.json");
const entityData = require("../data/derived/prompt4/entityDirectory.json");

const supportedEventKeys = [
  "new_baby",
  "child_school",
  "marriage",
  "moving_home",
  "elderly_care",
  "retirement",
  "bereavement"
];

const eventLabels = {
  new_baby: {
    titleKey: "events.new_baby.title",
    descriptionKey: "events.new_baby.description"
  },
  child_school: {
    titleKey: "events.child_school.title",
    descriptionKey: "events.child_school.description"
  },
  marriage: {
    titleKey: "events.marriage.title",
    descriptionKey: "events.marriage.description"
  },
  divorce: {
    titleKey: "events.divorce.title",
    descriptionKey: "events.divorce.description"
  },
  moving_home: {
    titleKey: "events.moving_home.title",
    descriptionKey: "events.moving_home.description"
  },
  elderly_care: {
    titleKey: "events.elderly_care.title",
    descriptionKey: "events.elderly_care.description"
  },
  retirement: {
    titleKey: "events.retirement.title",
    descriptionKey: "events.retirement.description"
  },
  bereavement: {
    titleKey: "events.bereavement.title",
    descriptionKey: "events.bereavement.description"
  }
};

const missingInformationKeys = {
  new_baby: "newBabyGap",
  child_school: "schoolGap",
  marriage: "marriageGap",
  divorce: "divorceGap",
  moving_home: "movingGap",
  elderly_care: "elderlyCareGap",
  retirement: "retirementGap",
  bereavement: "deathGap"
};

function isOfficialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "u.ae" || url.hostname.endsWith(".u.ae") || url.hostname.endsWith(".gov.ae"));
  } catch {
    return false;
  }
}

function buildEventDefinitions(data = sourceData, services = serviceData.services, directory = entityData) {
  if (!Array.isArray(services)) throw new Error("Prompt 1 service data must be an array");
  const eventKeys = [
    ...supportedEventKeys,
    ...Object.keys(data?.events || {}).filter((eventKey) =>
      !supportedEventKeys.includes(eventKey) && eventLabels[eventKey]
    )
  ];

  return Object.fromEntries(eventKeys.map((eventKey) => {
    const eventData = data?.events?.[eventKey] || {
      journeyStatus: "incomplete",
      missingInformationKey: missingInformationKeys[eventKey],
      sourceKeys: [],
      steps: []
    };
    const sources = (Array.isArray(eventData.sourceKeys) ? eventData.sourceKeys : [])
      .map((sourceKey) => ({ sourceKey, source: data?.sources?.[sourceKey] }))
      .filter(({ source }) => source && isOfficialUrl(source.url))
      .map(({ sourceKey, source }) => ({
        ...source,
        sourceKey,
        publisherKey: source.authority === "UAE Government Portal (U.AE)"
          ? "uaePortal"
          : source.authority?.startsWith("Not stated")
            ? "notStated"
            : "notVerified",
        verificationStatus: source.verificationStatus || "not_verified",
        lastVerifiedAt: data.lastVerifiedAt || null
      }));
    const eventServices = services.filter((service) => service.lifeEvent === eventKey);
    const entities = (Array.isArray(directory?.entities) ? directory.entities : [])
      .filter((entity) => entity.lifeEvent === eventKey);
    const informationIncomplete = eventServices.some((service) =>
      !service.serviceName || !service.governmentEntity || !isOfficialUrl(service.sourceUrl) ||
      !isOfficialUrl(service.officialServiceUrl) || !service.requiredDocuments || !service.instructions ||
      service.verificationStatus !== "verified_from_supplied_workbook"
    ) || entities.some((entity) =>
      !entity.entityName || !entity.lifeEventServices || !isOfficialUrl(entity.sourceUrl) ||
      !isOfficialUrl(entity.officialInfoUrl) || !entity.documentsToPrepare || !entity.nextSteps ||
      !entity.applicantInformation || !entity.timingAndFees || !entity.boundaryNote ||
      entity.verificationStatus !== "verified_from_supplied_workbook"
    );

    return [eventKey, {
      ...eventLabels[eventKey],
      ...eventData,
      journeyStatus: eventServices.length ? "services_available" : "incomplete",
      sources,
      entities,
      services: eventServices,
      informationStatus: informationIncomplete || !entities.length || !eventServices.length
        ? "incomplete_source"
        : "verified_local_sources",
      steps: Array.isArray(eventData.steps) ? eventData.steps : []
    }];
  }));
}

const eventDefinitions = buildEventDefinitions();

function buildJourneySteps(eventKey) {
  const event = eventDefinitions[eventKey];
  if (!event) return [];
  return event.services.map((service) => ({
    stepKey: `service_${service.serviceId}`,
    text: service.serviceName || null,
    serviceId: service.serviceId,
    sourceUrl: service.sourceUrl,
    officialServiceUrl: service.officialServiceUrl,
    prerequisites: service.prerequisites || null,
    dependsOn: []
  }));
}

module.exports = {
  eventDefinitions,
  supportedEventKeys,
  buildEventDefinitions,
  buildJourneySteps
};