import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink, Plus, Sparkles, Trash2 } from "lucide-react";
import PageSkeleton from "../components/PageSkeleton.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const relationshipKeys = ["self", "child", "partner", "parent", "other"];

function OfficialSources({ sources, t }) {
  return (
    <section className="space-y-2" aria-label={t.familyFirst.officialSources}>
      <h3 className="font-semibold">{t.familyFirst.officialSources}</h3>
      {sources.length ? (
        <ul className="space-y-2">
          {sources.map((source) => (
            <li className="rounded-xl border border-slate-200 bg-white p-3" key={source.url}>
              {validOfficialInfoLink(source.url) ? (
                <a className="inline-flex min-h-[44px] items-center gap-2 font-medium text-teal-900 underline" href={source.url} target="_blank" rel="noopener noreferrer">
                  {t.familyFirst.sourceTitles[source.sourceKey] || t.familyFirst.officialSources}<ExternalLink size={16} aria-hidden="true" />
                </a>
              ) : (
                <p className="text-sm text-slate-700">{t.familyFirst.officialLinkUnavailable}</p>
              )}
              <p className="text-sm text-slate-700">
                {t.familyFirst.publisher}: {t.familyFirst.sourcePublishers[source.publisherKey] || t.familyFirst.notVerified}
              </p>
              <p className="text-xs text-slate-600">
                {t.familyFirst.verificationStatus}: {t.familyFirst.sourceStatuses[source.verificationStatus] || t.familyFirst.notVerified}
              </p>
              <p className="text-xs text-slate-600">
                {t.familyFirst.sourceUpdated}: {source.sourceUpdatedAt || t.familyFirst.notPublished}
                <span className="mx-1" aria-hidden="true">·</span>
                {t.familyFirst.lastVerified}: {source.lastVerifiedAt || t.familyFirst.notVerified}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{t.familyFirst.noSourcesAvailable}</p>
      )}
    </section>
  );
}

function validHttpsLink(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validOfficialInfoLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "u.ae" || url.hostname.endsWith(".u.ae") || url.hostname.endsWith(".gov.ae"));
  } catch {
    return false;
  }
}

function EntityDirectory({ entities, t }) {
  if (!entities.length) {
    return (
      <section className="space-y-2" aria-label={t.familyFirst.entityJourneyHeading}>
        <h3 className="font-semibold">{t.familyFirst.entityJourneyHeading}</h3>
        <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{t.familyFirst.noVerifiedEntities}</p>
      </section>
    );
  }

  const categories = entities.reduce((groups, entity) => {
    const category = entity.serviceCategory || t.familyFirst.notVerified;
    const entityName = entity.entityName || t.familyFirst.notVerified;
    groups[category] ||= {};
    groups[category][entityName] ||= [];
    groups[category][entityName].push(entity);
    return groups;
  }, {});

  function detail(label, value) {
    return (
      <div>
        <dt className="font-medium text-slate-900">{label}</dt>
        <dd className="mt-1 whitespace-pre-line text-sm text-slate-700">{value || t.familyFirst.notVerified}</dd>
      </div>
    );
  }

  return (
    <section className="space-y-3" aria-label={t.familyFirst.entityJourneyHeading}>
      <h3 className="font-semibold">{t.familyFirst.entityJourneyHeading}</h3>
      {Object.entries(categories).map(([category, entitiesByName]) => (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4" key={category}>
          <h4 className="font-medium">{category}</h4>
          <ul className="space-y-4">
            {Object.entries(entitiesByName).map(([entityName, records]) => (
              <li className="space-y-3 border-t border-slate-200 pt-3 first:border-0 first:pt-0" key={entityName}>
                <h5 className="font-semibold">{entityName}</h5>
                {records.map((entity) => (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4" key={entity.entityId}>
                    <p className="text-sm text-slate-700">{entity.lifeEventServices || t.familyFirst.notVerified}</p>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {detail(t.familyFirst.requiredDocuments, entity.documentsToPrepare)}
                      {detail(t.familyFirst.instructions, entity.nextSteps)}
                      {detail(t.familyFirst.officialTiming, entity.timingAndFees)}
                      {detail(t.familyFirst.applicantType, entity.applicantInformation)}
                      {detail(t.familyFirst.entityBoundary, entity.boundaryNote)}
                    </dl>
                    <div className="flex flex-wrap gap-3 text-sm">
                      {validOfficialInfoLink(entity.officialInfoUrl) ? (
                        <a className="inline-flex min-h-[44px] items-center gap-2 font-medium text-teal-900 underline" href={entity.officialInfoUrl} target="_blank" rel="noopener noreferrer">
                          {t.familyFirst.openOfficialInformation}<ExternalLink size={16} aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="inline-flex min-h-[44px] items-center text-slate-600">{t.familyFirst.officialLinkUnavailable}</span>
                      )}
                      {entity.officialWebsite && validHttpsLink(entity.officialWebsite) && (
                        <a className="inline-flex min-h-[44px] items-center gap-2 font-medium text-teal-900 underline" href={entity.officialWebsite} target="_blank" rel="noopener noreferrer">
                          {t.familyFirst.openEntityWebsite}<ExternalLink size={16} aria-hidden="true" />
                        </a>
                      )}
                      {validOfficialInfoLink(entity.sourceUrl) && (
                        <a className="inline-flex min-h-[44px] items-center font-medium text-teal-900 underline" href={entity.sourceUrl} target="_blank" rel="noopener noreferrer">
                          {t.familyFirst.sourceEvidence}
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      {t.familyFirst.verificationStatus}: {t.familyFirst.sourceStatuses[entity.verificationStatus] || t.familyFirst.notVerified}
                      <span className="mx-1" aria-hidden="true">·</span>
                      {t.familyFirst.lastVerified}: {entity.lastVerified || t.familyFirst.notVerified}
                      <span className="mx-1" aria-hidden="true">·</span>
                      {t.familyFirst.sourceUpdated}: {entity.sourceUpdatedAt || t.familyFirst.notPublished}
                    </p>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}

function GovernmentServices({ services, t }) {
  const groupedServices = services.reduce((groups, service) => {
    const key = service.governmentEntity || "";
    groups[key] = [...(groups[key] || []), service];
    return groups;
  }, {});

  if (!services.length) {
    return <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{t.familyFirst.noServicesAvailable}</p>;
  }

  function detail(label, value) {
    return (
      <div>
        <dt className="font-medium text-slate-900">{label}</dt>
        <dd className="mt-1 whitespace-pre-line text-sm text-slate-700">{value || t.familyFirst.notVerified}</dd>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label={t.familyFirst.governmentServices}>
      <div>
        <h3 className="font-semibold text-slate-900">{t.familyFirst.governmentServices}</h3>
        <p className="mt-1 text-sm text-slate-700">{t.familyFirst.serviceLanguageNote}</p>
      </div>
      {Object.entries(groupedServices).map(([entity, entityServices]) => (
        <section className="space-y-3 rounded-lg border border-slate-200 p-3 sm:p-4" key={entity || "unknown"}>
          <h4 className="font-semibold text-slate-900">{entity || t.familyFirst.notVerified}</h4>
          <ul className="space-y-4">
            {entityServices.map((service) => (
              <li className="space-y-3 border-t border-slate-200 pt-3 first:border-0 first:pt-0" key={service.serviceId}>
                <h5 className="font-medium text-slate-900">{service.serviceName || t.familyFirst.notVerified}</h5>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {detail(t.familyFirst.applicantType, service.applicantType)}
                  {detail(t.familyFirst.jurisdiction, service.jurisdiction)}
                  {detail(t.familyFirst.eligibility, service.eligibility)}
                  {detail(t.familyFirst.requiredDocuments, service.requiredDocuments)}
                  {detail(t.familyFirst.instructions, service.instructions)}
                  {detail(t.familyFirst.prerequisites, service.prerequisites)}
                  {detail(t.familyFirst.officialFee, service.officialFee)}
                  {detail(t.familyFirst.officialTiming, service.officialTiming)}
                  {detail(t.familyFirst.officialContact, service.officialContact)}
                </dl>
                <div className="space-y-1 text-sm text-slate-700">
                  {validOfficialInfoLink(service.officialServiceUrl) ? (
                    <a
                      className="inline-flex min-h-[44px] items-center gap-2 font-medium text-teal-900 underline"
                      href={service.officialServiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.familyFirst.openOfficialService}<ExternalLink size={16} aria-hidden="true" />
                    </a>
                  ) : (
                    <p className="text-sm text-slate-700">{t.familyFirst.officialLinkUnavailable}</p>
                  )}
                  <p>{t.familyFirst.publisher}: {t.familyFirst.sourcePublishers[service.sourceName] || t.familyFirst.notVerified}</p>
                  <p>{t.familyFirst.verificationStatus}: {t.familyFirst.sourceStatuses[service.verificationStatus] || t.familyFirst.notVerified}</p>
                  <p>
                    {t.familyFirst.lastVerified}: {service.lastVerified || t.familyFirst.notVerified}
                    <span className="mx-1" aria-hidden="true">·</span>
                    {t.familyFirst.sourceUpdated}: {service.sourceUpdatedAt || t.familyFirst.notPublished}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}

function RulesEvaluation({ evaluation, loading, error, answers, onAnswerChange, onEvaluate, t }) {
  return (
    <section className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 sm:p-4" aria-label={t.familyFirst.rulesEngineTitle}>
      <h3 className="font-semibold text-slate-900">{t.familyFirst.rulesEngineTitle}</h3>
      {loading ? (
        <p className="text-sm text-slate-700">{t.familyFirst.rulesEvaluationLoading}</p>
      ) : error ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-gray-900" role="alert">{error}</p>
      ) : evaluation ? (
        <>
          <p className="text-sm font-semibold text-slate-900">
            {t.familyFirst.ruleStatuses[evaluation.status] || t.familyFirst.notVerified}
          </p>
          {evaluation.sourceStatus === "SOURCE_REQUIRED" && (
            <p className="text-sm text-slate-800">{t.familyFirst.rulesSourceRequired}</p>
          )}
          {evaluation.sourceStatus === "PARTIALLY_UNVERIFIED" && (
            <p className="text-sm text-slate-800">{t.familyFirst.rulesPartiallyUnverified}</p>
          )}
          <p className="text-sm text-slate-800">{t.familyFirst.rulesNotApplicableNotice}</p>
          {evaluation.questions.length > 0 && (
            <form className="space-y-3 rounded-md border border-amber-200 bg-white p-3" onSubmit={(event) => { event.preventDefault(); onEvaluate(); }}>
              <p className="text-sm text-slate-700">{t.familyFirst.ruleQuestionsIntro}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {evaluation.questions.map((question) => (
                  <label className="space-y-1 text-sm font-medium text-slate-900" key={question.field}>
                    <span>{t.familyFirst.ruleQuestionLabels[question.field] || t.familyFirst.notVerified}</span>
                    {question.type === "number" ? (
                      <input
                        className="min-h-[44px] w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-gray-900"
                        type="number"
                        min={question.min}
                        max={question.max}
                        step="any"
                        value={answers[question.field] ?? ""}
                        onChange={(event) => onAnswerChange(question.field, event.target.value)}
                      />
                    ) : question.type === "text" ? (
                      <input
                        className="min-h-[44px] w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-gray-900"
                        type="text"
                        maxLength={question.max}
                        value={answers[question.field] ?? ""}
                        onChange={(event) => onAnswerChange(question.field, event.target.value)}
                      />
                    ) : (
                      <select
                        className="min-h-[44px] w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-gray-900"
                        value={answers[question.field] ?? ""}
                        onChange={(event) => onAnswerChange(question.field, event.target.value)}
                      >
                        <option value="">{t.familyFirst.ruleSelectAnswer}</option>
                        {question.options.map((option) => (
                          <option value={option} key={option}>{t.familyFirst.ruleOptionLabels[option] || t.familyFirst.notVerified}</option>
                        ))}
                      </select>
                    )}
                  </label>
                ))}
              </div>
              <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-semibold text-white" type="submit">
                {t.familyFirst.evaluateRules}
              </button>
            </form>
          )}
          {evaluation.rules.length > 0 && (
            <ul className="space-y-2">
              {evaluation.rules.map((rule) => (
                <li className="space-y-2 rounded-md border border-amber-200 bg-white p-3" key={rule.ruleId}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{rule.ruleName}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
                      {t.familyFirst.ruleStatuses[rule.status] || t.familyFirst.notVerified}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{rule.description}</p>
                  {rule.reasonCode && (
                    <p className="text-sm text-slate-700">
                      {t.familyFirst.ruleReasons[rule.reasonCode] || t.familyFirst.rulesNeedConfirmation}
                    </p>
                  )}
                  {rule.conditionsChecked.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">{t.familyFirst.ruleConditions}</p>
                      {rule.conditionsChecked.map((condition, index) => (
                        <p className="text-sm text-slate-700" key={`${condition.field}-${index}`}>
                          {t.familyFirst.ruleQuestionLabels[condition.field] || t.familyFirst.notVerified}:{" "}
                          {condition.value === undefined
                            ? t.familyFirst.ruleConditionResults[condition.result]
                            : (t.familyFirst.ruleOptionLabels[condition.value] || String(condition.value))}
                          {condition.value !== undefined && ` — ${t.familyFirst.ruleConditionResults[condition.result]}`}
                        </p>
                      ))}
                    </div>
                  )}
                  {rule.requiredDocuments && <p className="whitespace-pre-line text-sm text-slate-700"><strong>{t.familyFirst.ruleDocuments}: </strong>{rule.requiredDocuments}</p>}
                  {rule.nextSteps && <p className="whitespace-pre-line text-sm text-slate-700"><strong>{t.familyFirst.ruleNextSteps}: </strong>{rule.nextSteps}</p>}
                  {rule.sourceUrl ? (
                    <a
                      className="inline-flex min-h-[44px] items-center gap-2 font-medium text-teal-900 underline"
                      href={rule.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.familyFirst.openOfficialService}<ExternalLink size={16} aria-hidden="true" />
                    </a>
                  ) : (
                    <p className="text-sm text-slate-700">{t.familyFirst.notVerified}</p>
                  )}
                  <p className="text-xs text-slate-600">
                    {t.familyFirst.verificationStatus}: {t.familyFirst.sourceStatuses[rule.verificationStatus] || t.familyFirst.notVerified}
                    <span className="mx-1" aria-hidden="true">·</span>
                    {t.familyFirst.lastVerified}: {rule.lastVerified || t.familyFirst.notVerified}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}

export default function FamilyFirst() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState(null);
  const [selectedEventKey, setSelectedEventKey] = useState("");
  const [members, setMembers] = useState(() => [{
    label: t.familyFirst.defaultMember.replace("{letter}", "A"),
    relationship: "self"
  }]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [progressText, setProgressText] = useState("");
  const [progressBusy, setProgressBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [rulesEvaluation, setRulesEvaluation] = useState(null);
  const [rulesEvaluationLoading, setRulesEvaluationLoading] = useState(false);
  const [rulesEvaluationError, setRulesEvaluationError] = useState("");
  const [ruleAnswers, setRuleAnswers] = useState({});
  const [submittedRuleAnswers, setSubmittedRuleAnswers] = useState({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      axios.get("/api/family-first/events"),
      axios.get("/api/family-first")
    ])
      .then(([eventResponse, journeyResponse]) => {
        if (!active) return;
        setEvents(eventResponse.data);
        setJourneys(journeyResponse.data);
        const requestedEvent = searchParams.get("event");
        if (eventResponse.data.some((event) => event.eventKey === requestedEvent)) {
          setSelectedEventKey(requestedEvent);
        }
        const requestedId = searchParams.get("journeyId");
        const selected = journeyResponse.data.find((journey) => String(journey.id) === requestedId)
          || journeyResponse.data[0]
          || null;
        setSelectedJourneyId(selected?.id ?? null);
      })
      .catch(() => {
        if (active) setError(t.familyFirst.loadFailed);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reloadKey, searchParams, t.familyFirst.loadFailed]);

  const selectedJourney = journeys.find((journey) => journey.id === selectedJourneyId) || null;
  const selectedEvent = selectedEventKey ? t.familyFirst.events[selectedEventKey] : null;
  const selectedEventData = events.find((event) => event.eventKey === selectedEventKey) || null;
  const evaluationEventKey = selectedEventKey || selectedJourney?.eventKey || "";

  useEffect(() => {
    if (!evaluationEventKey) {
      setRulesEvaluation(null);
      setRulesEvaluationError("");
      setRulesEvaluationLoading(false);
      return undefined;
    }

    let active = true;
    setRulesEvaluation(null);
    setRulesEvaluationError("");
    setRulesEvaluationLoading(true);
    axios.post("/api/family-first/evaluate", {
      eventKey: evaluationEventKey,
      answers: submittedRuleAnswers
    })
      .then(({ data }) => {
        if (active) setRulesEvaluation(data);
      })
      .catch(() => {
        if (active) setRulesEvaluationError(t.familyFirst.rulesEvaluationFailed);
      })
      .finally(() => {
        if (active) setRulesEvaluationLoading(false);
      });
    return () => { active = false; };
  }, [evaluationEventKey, submittedRuleAnswers, t.familyFirst.rulesEvaluationFailed]);

  function updateRuleAnswer(field, value) {
    const question = rulesEvaluation?.questions.find((item) => item.field === field);
    setRuleAnswers((current) => {
      const next = { ...current };
      if (value === "") {
        delete next[field];
      } else {
        next[field] = question?.type === "number" ? Number(value) : value;
      }
      return next;
    });
  }

  function selectJourney(journey) {
    setSelectedJourneyId(journey.id);
    setSelectedEventKey("");
    setRuleAnswers({});
    setSubmittedRuleAnswers({});
    setProgressError("");
    setProgressText("");
    setSearchParams({ journeyId: String(journey.id) }, { replace: true });
  }

  function updateMember(index, field, value) {
    setMembers((current) => current.map((member, memberIndex) =>
      memberIndex === index ? { ...member, [field]: value } : member
    ));
  }

  function addMember() {
    if (members.length >= 8) return;
    setMembers((current) => [...current, {
      label: t.familyFirst.defaultMember.replace("{letter}", String.fromCharCode(65 + current.length)),
      relationship: "other"
    }]);
  }

  function replaceJourney(updatedJourney) {
    setJourneys((current) => current.map((journey) =>
      journey.id === updatedJourney.id ? updatedJourney : journey
    ));
  }

  async function startJourney(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post("/api/family-first", {
        eventKey: selectedEventKey,
        affectedMembers: members.map(({ label, relationship }) => ({ label, relationship }))
      });
      setJourneys((current) => [data, ...current]);
      setSelectedJourneyId(data.id);
      setSelectedEventKey("");
      setRuleAnswers({});
      setSubmittedRuleAnswers({});
      setProgressError("");
      setProgressText("");
      setSearchParams({ journeyId: String(data.id) }, { replace: true });
    } catch {
      setError(t.familyFirst.startFailed);
    } finally {
      setBusy(false);
    }
  }

  async function addProgressItem(event) {
    event.preventDefault();
    if (!selectedJourney || !progressText.trim()) return;
    setProgressBusy(true);
    setProgressError("");
    try {
      const { data } = await axios.post(`/api/family-first/${selectedJourney.id}/steps`, {
        text: progressText
      });
      replaceJourney(data);
      setProgressText("");
    } catch {
      setProgressError(t.familyFirst.progressSaveFailed);
    } finally {
      setProgressBusy(false);
    }
  }

  async function updateProgressStatus(step, status) {
    if (!selectedJourney) return;
    setProgressBusy(true);
    setProgressError("");
    try {
      const { data } = await axios.patch(
        `/api/family-first/${selectedJourney.id}/steps/${step.id}`,
        { status }
      );
      replaceJourney(data);
    } catch {
      setProgressError(t.familyFirst.progressSaveFailed);
    } finally {
      setProgressBusy(false);
    }
  }

  function progressSummary(journey) {
    return t.familyFirst.progressSummary
      .replace("{done}", String(journey.progress.completed))
      .replace("{total}", String(journey.progress.total));
  }

  const inputClass = "min-h-[44px] w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-gray-900";

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-6xl text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
        <PageSkeleton label={t.familyFirst.loading} rows={4} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.familyFirst.title}</h1>
          <p className="mt-1 text-slate-700">{t.familyFirst.subtitle}</p>
        </div>
        <Link className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-800" to="/family">
          {t.familyFirst.familySharing}
        </Link>
      </header>
      <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-slate-800">
        {t.familyFirst.navigatorDisclaimer}
      </p>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">
          <p>{error}</p>
          {error === t.familyFirst.loadFailed && (
            <button className="min-h-[44px] rounded-lg border border-slate-400 bg-white px-4 font-medium text-gray-900" type="button" onClick={() => setReloadKey((key) => key + 1)}>
              {t.familyFirst.retry}
            </button>
          )}
        </div>
      )}

      <section className="space-y-3" aria-labelledby="family-first-events-title">
        <h2 id="family-first-events-title" className="text-lg font-semibold text-slate-900">{t.familyFirst.eventsTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {events.map(({ eventKey, services = [], entities = [] }) => {
            const event = t.familyFirst.events[eventKey];
            return (
              <article className={`space-y-3 rounded-xl border bg-white p-4 ${selectedEventKey === eventKey ? "border-teal-700 ring-2 ring-teal-100" : "border-slate-200"}`} key={eventKey}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-900">
                    <Sparkles size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-700">{event.description}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-teal-900">
                  {t.familyFirst.entitiesAvailable.replace("{count}", String(new Set(entities.map((entity) => entity.entityName)).size))}
                  <span className="mx-1" aria-hidden="true">·</span>
                  {t.familyFirst.servicesAvailable.replace("{count}", String(services.length))}
                </p>
                <button
                  className="min-h-[44px] rounded-lg border border-teal-800 px-4 font-medium text-teal-900 hover:bg-teal-50"
                  type="button"
                  aria-pressed={selectedEventKey === eventKey}
                  onClick={() => {
                    setSelectedEventKey(selectedEventKey === eventKey ? "" : eventKey);
                    setSelectedJourneyId(null);
                    setRuleAnswers({});
                    setSubmittedRuleAnswers({});
                    setSearchParams({}, { replace: true });
                  }}
                >
                  {selectedEventKey === eventKey ? t.familyFirst.cancelStart : t.familyFirst.startJourney}
                </button>
              </article>
            );
          })}
        </div>
        {!events.length && <p className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700">{t.familyFirst.noEvents}</p>}
      </section>

      {selectedEvent && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-lg font-semibold">{t.familyFirst.startTitle.replace("{event}", selectedEvent.title)}</h2>
          <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="status">
            <strong>{t.familyFirst.personalizationUnavailable}</strong> {t.familyFirst.missingInformation[selectedEventData?.missingInformationKey] || t.familyFirst.notVerified}
          </p>
          {selectedEventData?.informationStatus !== "verified_local_sources" && (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-gray-900" role="status">
              {t.familyFirst.sourceInformationIncomplete}
            </p>
          )}
          <div className="mt-4">
            <RulesEvaluation
              evaluation={rulesEvaluation}
              loading={rulesEvaluationLoading}
              error={rulesEvaluationError}
              answers={ruleAnswers}
              onAnswerChange={updateRuleAnswer}
              onEvaluate={() => setSubmittedRuleAnswers(ruleAnswers)}
              t={t}
            />
          </div>
          <div className="mt-4"><EntityDirectory entities={selectedEventData?.entities || []} t={t} /></div>
          <div className="mt-4"><GovernmentServices services={selectedEventData?.services || []} t={t} /></div>
          <div className="mt-4"><OfficialSources sources={selectedEventData?.sources || []} t={t} /></div>
          <p className="mt-4 text-sm text-slate-700">{t.familyFirst.memberSampleNote}</p>
          <form className="mt-4 space-y-4" onSubmit={(event) => void startJourney(event)}>
            <div className="space-y-3">
              {members.map((member, index) => (
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" key={index}>
                  <label className="space-y-1 text-sm font-medium">
                    <span>{t.familyFirst.memberLabel}</span>
                    <input className={inputClass} required maxLength={40} value={member.label} onChange={(event) => updateMember(index, "label", event.target.value)} />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    <span>{t.familyFirst.relationshipLabel}</span>
                    <select className={inputClass} value={member.relationship} onChange={(event) => updateMember(index, "relationship", event.target.value)}>
                      {relationshipKeys.map((key) => <option value={key} key={key}>{t.familyFirst.relationships[key]}</option>)}
                    </select>
                  </label>
                  <button
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center self-end rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40"
                    type="button"
                    aria-label={t.familyFirst.removeMember}
                    title={t.familyFirst.removeMember}
                    disabled={members.length === 1}
                    onClick={() => setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index))}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-4 font-medium text-slate-800 disabled:opacity-50" type="button" disabled={members.length >= 8} onClick={addMember}>
                <Plus size={18} aria-hidden="true" /> {t.familyFirst.addMember}
              </button>
              <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 font-semibold text-white disabled:opacity-60" type="submit" disabled={busy}>
                {busy ? t.familyFirst.starting : t.familyFirst.saveEvent}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.8fr)]">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">{t.familyFirst.savedJourneys}</h2>
          {!journeys.length ? (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-slate-700">{t.familyFirst.empty}</p>
          ) : (
            <ul className="space-y-2">
              {journeys.map((journey) => (
                <li key={journey.id}>
                  <button
                    className={`w-full rounded-xl border p-4 text-start ${selectedJourneyId === journey.id ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-400"}`}
                    type="button"
                    aria-pressed={selectedJourneyId === journey.id}
                    onClick={() => selectJourney(journey)}
                  >
                    <span className="block font-semibold">{t.familyFirst.events[journey.eventKey].title}</span>
                    <span className="mt-1 block text-sm text-slate-700">{progressSummary(journey)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedJourney && (
          <article className="min-w-0 space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <header className="space-y-3">
              <div>
                <p className="text-sm font-medium text-teal-900">{t.familyFirst.journeyLabel}</p>
                <h2 className="text-xl font-semibold">{t.familyFirst.events[selectedJourney.eventKey].title}</h2>
                <p className="mt-1 text-slate-700">{t.familyFirst.events[selectedJourney.eventKey].description}</p>
              </div>
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-gray-900" role="status">
                <strong>{t.familyFirst.personalizationUnavailable}</strong> {t.familyFirst.missingInformation[selectedJourney.missingInformationKey] || t.familyFirst.notVerified}
              </p>
              {selectedJourney.informationStatus !== "verified_local_sources" && (
                <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-gray-900" role="status">
                  {t.familyFirst.sourceInformationIncomplete}
                </p>
              )}
              <div className="flex flex-wrap gap-2" aria-label={t.familyFirst.affectedMembers}>
                {selectedJourney.affectedMembers.map((member, index) => (
                  <span className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-800" key={`${member.label}-${index}`}>
                    {member.label} · {t.familyFirst.relationships[member.relationship]}
                  </span>
                ))}
              </div>
            </header>
            <EntityDirectory entities={selectedJourney.entities || []} t={t} />
            <GovernmentServices services={selectedJourney.services || []} t={t} />
            <RulesEvaluation
              evaluation={rulesEvaluation}
              loading={rulesEvaluationLoading}
              error={rulesEvaluationError}
              answers={ruleAnswers}
              onAnswerChange={updateRuleAnswer}
              onEvaluate={() => setSubmittedRuleAnswers(ruleAnswers)}
              t={t}
            />
            <OfficialSources sources={selectedJourney.sources || []} t={t} />
            <section className="space-y-3" aria-labelledby="family-first-personal-progress">
              <div>
                <h3 id="family-first-personal-progress" className="font-semibold text-slate-900">{t.familyFirst.personalProgressTitle}</h3>
                <p className="mt-1 text-sm text-slate-700">{t.familyFirst.personalProgressNotice}</p>
              </div>
              <p className="text-sm font-medium text-slate-800">{progressSummary(selectedJourney)}</p>
              {progressError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{progressError}</p>}
              {selectedJourney.steps.length ? (
                <ul className="space-y-2">
                  {selectedJourney.steps.map((step) => (
                    <li className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center" key={step.id}>
                      <div className="min-w-0 flex-1">
                        <p className={step.progressStatus === "completed" ? "text-slate-600 line-through" : "text-slate-900"}>{step.details.text || t.familyFirst.notVerified}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {step.origin === "user_entered" ? t.familyFirst.userEntered : t.familyFirst.userManagedServiceStep}
                        </p>
                      </div>
                      <label className="space-y-1 text-sm font-medium sm:w-48">
                        <span>{t.familyFirst.progressStatusLabel}</span>
                        <select
                          className={inputClass}
                          value={step.progressStatus}
                          disabled={progressBusy}
                          onChange={(event) => void updateProgressStatus(step, event.target.value)}
                        >
                          {["not_started", "in_progress", "completed"].map((status) => (
                            <option value={status} key={status}>{t.familyFirst.progressStatuses[status]}</option>
                          ))}
                        </select>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{t.familyFirst.personalProgressEmpty}</p>
              )}
              <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => void addProgressItem(event)}>
                <label className="flex-1 space-y-1 text-sm font-medium">
                  <span>{t.familyFirst.progressItemLabel}</span>
                  <input
                    className={inputClass}
                    maxLength={180}
                    required
                    value={progressText}
                    onChange={(event) => setProgressText(event.target.value)}
                  />
                </label>
                <button
                  className="min-h-[44px] self-end rounded-lg bg-hayat-700 px-5 font-semibold text-white disabled:opacity-60"
                  type="submit"
                  disabled={progressBusy || !progressText.trim()}
                >
                  {progressBusy ? t.familyFirst.savingProgress : t.familyFirst.addProgressItem}
                </button>
              </form>
            </section>
          </article>
        )}
      </section>
    </section>
  );
}