import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Modal from "../components/Modal.jsx";
import { getMostRelevantPolicy, getPolicyStatus } from "../utils/insurancePolicies.js";
import PageSkeleton from "../components/PageSkeleton.jsx";

const emptyProfile = {
  fullName: "",
  dateOfBirth: "",
  bloodType: "",
  allergies: [],
  emergencyContactName: "",
  emergencyContactPhone: ""
};
const emptyAccessNeeds = {
  needs: [],
  note: "",
  includeOnCareCard: false
};

function isProfileSaved(profile) {
  return Boolean((profile.demoProfile || profile.updatedAt) && (
    profile.fullName?.trim() ||
    profile.dateOfBirth ||
    profile.bloodType ||
    profile.allergies?.length ||
    profile.emergencyContactName?.trim() ||
    profile.emergencyContactPhone?.trim()
  ));
}

function maskPolicyNumber(value) {
  if (!value) return "";
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export default function Passport() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [accessNeeds, setAccessNeeds] = useState(emptyAccessNeeds);
  const [accessNeedsDraft, setAccessNeedsDraft] = useState(emptyAccessNeeds);
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [includeInsuranceOnCard, setIncludeInsuranceOnCard] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");
  const [allergyDraft, setAllergyDraft] = useState("");
  const [isSavingAccessNeeds, setIsSavingAccessNeeds] = useState(false);
  const [accessNeedsError, setAccessNeedsError] = useState("");
  const [accessNeedsSaved, setAccessNeedsSaved] = useState("");
  const fieldClass = "min-h-[44px] w-full rounded-lg border border-gray-400 bg-white px-3 py-2 text-gray-900";
  const labelClass = "mb-1 block text-sm font-medium text-gray-900";

  async function loadPageData() {
    const [profileResponse, policiesResponse] = await Promise.all([
      axios.get("/api/profile"),
      axios.get("/api/insurance")
    ]);
    const { accessNeeds: profileAccessNeeds, ...profileData } = profileResponse.data;
    setProfile({ ...emptyProfile, ...profileData, allergies: profileData.allergies || [] });
    const savedAccessNeeds = profileAccessNeeds || emptyAccessNeeds;
    setAccessNeeds({ ...emptyAccessNeeds, ...savedAccessNeeds, needs: [...savedAccessNeeds.needs] });
    setAccessNeedsDraft({ ...emptyAccessNeeds, ...savedAccessNeeds, needs: [...savedAccessNeeds.needs] });
    setPolicies(policiesResponse.data);
  }

  useEffect(() => {
    let active = true;
    loadPageData()
      .catch((loadError) => {
        if (active) setError(loadError.response?.data?.error || t.passport.loadFailed);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t.passport.loadFailed]);

  const featuredPolicy = useMemo(() => getMostRelevantPolicy(policies), [policies]);
  const cardText = useMemo(() => {
    const lines = [
      `${t.passport.name}: ${profile.fullName || t.passport.notProvided}`,
      `${t.passport.bloodType}: ${profile.bloodType || t.passport.notProvided} (${t.passport.selfReported})`,
      `${t.passport.allergies}: ${profile.allergies.length ? profile.allergies.join(", ") : t.passport.noneListed}`,
      `${t.passport.emergencyContact}: ${profile.emergencyContactName || t.passport.notProvided} ${profile.emergencyContactPhone}`.trim()
    ];
    if (accessNeeds.includeOnCareCard && (accessNeeds.needs.length || accessNeeds.note.trim())) {
      lines.push(t.passport.accessNeedsTitle);
      lines.push(...accessNeeds.needs.map((need) => t.passport.accessNeedOptions[need]));
      if (accessNeeds.note.trim()) lines.push(`${t.passport.accessNeedsNote}: ${accessNeeds.note.trim()}`);
    }
    if (includeInsuranceOnCard && featuredPolicy) {
      lines.push(`${t.passport.insurerName}: ${featuredPolicy.insurerName || t.passport.notProvided}`);
      lines.push(`${t.passport.policyNumber}: ${featuredPolicy.policyNumber || t.passport.notProvided}`);
    }
    return lines.join("\n");
  }, [accessNeeds, featuredPolicy, includeInsuranceOnCard, profile, t]);

  function openEditor() {
    setDraft({ ...emptyProfile, ...profile, allergies: [...profile.allergies] });
    setAllergyDraft("");
    setError("");
    setSavedMessage("");
    setIsModalOpen(true);
  }

  function updateField(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function updateAccessNeed(need, checked) {
    setAccessNeedsDraft((current) => ({
      ...current,
      needs: checked
        ? [...new Set([...current.needs, need])]
        : current.needs.filter((item) => item !== need)
    }));
    setAccessNeedsSaved("");
  }

  async function saveAccessNeeds(event) {
    event.preventDefault();
    setIsSavingAccessNeeds(true);
    setAccessNeedsError("");
    setAccessNeedsSaved("");
    try {
      const { data } = await axios.patch("/api/profile/accessibility", {
        accessNeeds: {
          ...accessNeedsDraft,
          needs: [...new Set(accessNeedsDraft.needs)],
          note: accessNeedsDraft.note.slice(0, 200)
        }
      });
      const saved = data.accessNeeds;
      setAccessNeeds({ ...emptyAccessNeeds, ...saved, needs: [...saved.needs] });
      setAccessNeedsDraft({ ...emptyAccessNeeds, ...saved, needs: [...saved.needs] });
      setAccessNeedsSaved(t.passport.accessNeedsSaved);
    } catch {
      setAccessNeedsError(t.passport.accessNeedsSaveFailed);
    } finally {
      setIsSavingAccessNeeds(false);
    }
  }

  function addAllergy(event) {
    event.preventDefault();
    const allergy = allergyDraft.trim();
    if (allergy && !draft.allergies.some((item) => item.toLowerCase() === allergy.toLowerCase())) {
      updateField("allergies", [...draft.allergies, allergy]);
    }
    setAllergyDraft("");
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await axios.put("/api/profile", draft);
      await loadPageData();
      setIsModalOpen(false);
      setSavedMessage(t.passport.saved);
    } catch (saveError) {
      setError(saveError.response?.data?.error || saveError.message || t.passport.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  const hasSavedProfile = isProfileSaved(profile);
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);
  const accessNeedsDirty = JSON.stringify(accessNeedsDraft) !== JSON.stringify(accessNeeds);
  const selectedAccessNeedLabels = accessNeeds.needs.map((need) => t.passport.accessNeedOptions[need]).filter(Boolean);
  const featuredPolicyStatus = featuredPolicy ? getPolicyStatus(featuredPolicy.endDate) : null;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.sectionTabs.passport}</h1>
        <div className="flex flex-wrap gap-2">
        <Link className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-hayat-700 bg-white px-4 font-medium text-hayat-900" to="/family">
          {t.navigation.family}
        </Link>
        {hasSavedProfile && !profile.demoProfile && (
          <button className="min-h-[44px] rounded-lg border border-hayat-700 bg-white px-5 py-2 font-medium text-hayat-900" type="button" onClick={openEditor}>
            {t.passport.editDetails}
          </button>
        )}
        </div>
      </header>
      {isLoading ? (
        <PageSkeleton label={t.passport.loading} rows={3} />
      ) : (
        <>
          {error && !isModalOpen && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{error}</p>}
          {savedMessage && <p className="rounded-lg bg-green-50 p-3 text-green-800" role="status">{savedMessage}</p>}
          {!hasSavedProfile && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3">{t.passport.emptyProfile}</p>
              <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 py-2 font-medium text-white" type="button" onClick={openEditor}>
                {t.passport.addDetails}
              </button>
            </section>
          )}

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">{t.passport.careCard}</h2>
            <label className="inline-flex min-h-[44px] items-center gap-3">
              <input
                className="h-5 w-5 accent-hayat-700"
                type="checkbox"
                checked={includeInsuranceOnCard}
                onChange={(event) => setIncludeInsuranceOnCard(event.target.checked)}
              />
              <span>{t.passport.includeInsuranceOnCard}</span>
            </label>
            <div className="care-card-print rounded-xl border border-slate-300 bg-white p-5">
              <h3 className="mb-4 text-lg font-semibold">{t.appName}</h3>
              <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <p><strong>{t.passport.name}:</strong> {profile.fullName || t.passport.notProvided}</p>
                  <p><strong>{t.passport.bloodType}:</strong> {profile.bloodType || t.passport.notProvided} <span>({t.passport.selfReported})</span></p>
                  <div>
                    <strong>{t.passport.allergies}:</strong>
                    {profile.allergies.length ? (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {profile.allergies.map((allergy) => <span className="rounded-full bg-slate-100 px-3 py-1" key={allergy}>{allergy}</span>)}
                      </div>
                    ) : <p>{t.passport.noneListed}</p>}
                  </div>
                  <p><strong>{t.passport.emergencyContact}:</strong> {profile.emergencyContactName || t.passport.notProvided} {profile.emergencyContactPhone}</p>
                  {accessNeeds.includeOnCareCard && (selectedAccessNeedLabels.length > 0 || accessNeeds.note.trim()) && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <h4 className="font-semibold">{t.passport.accessNeedsTitle}</h4>
                      {selectedAccessNeedLabels.length > 0 && <ul className="list-disc ps-5">{selectedAccessNeedLabels.map((label) => <li key={label}>{label}</li>)}</ul>}
                      {accessNeeds.note.trim() && <p><strong>{t.passport.accessNeedsNote}:</strong> {accessNeeds.note}</p>}
                    </div>
                  )}
                  <div className="rounded-lg bg-slate-50 p-3">
                    <h4 className="font-semibold">{t.passport.insurance}</h4>
                    {featuredPolicy ? (
                      <div className="mt-1 space-y-1">
                        <p><strong>{t.passport.insurerName}:</strong> {featuredPolicy.insurerName || t.passport.insurerNotListed}</p>
                        <p><strong>{t.passport.planName}:</strong> {featuredPolicy.planName || t.passport.planNotListed}</p>
                        <p><strong>{t.passport.policyNumber}:</strong> {maskPolicyNumber(featuredPolicy.policyNumber) || t.passport.notProvided}</p>
                        <p><strong>{t.passport.validUntil}:</strong> {featuredPolicy.endDate || t.passport.datesNotListed}</p>
                        <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium">
                          {t.passport.policyStatuses[featuredPolicyStatus]}
                        </span>
                      </div>
                    ) : (
                      <Link className="mt-1 inline-flex min-h-[44px] items-center text-sm font-medium text-hayat-700 underline" to="/me/insurance">
                        {t.passport.addInsuranceInCare}
                      </Link>
                    )}
                  </div>
                </div>
                <QRCodeSVG value={cardText} size={160} level="M" aria-label={t.passport.qrCode} />
              </div>
              <p className="mt-4 text-sm text-gray-600">{t.passport.qrDemoNote}</p>
            </div>
            <button className="min-h-[44px] rounded-lg border border-hayat-700 bg-white px-5 py-2 font-medium text-gray-900" type="button" onClick={() => window.print()}>
              {t.passport.printCareCard}
            </button>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <h2 className="text-xl font-semibold">{t.passport.accessNeedsTitle}</h2>
              <p className="mt-2 text-sm text-slate-700">{t.passport.accessNeedsIntro}</p>
              <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="note">{t.passport.accessNeedsPrivacy}</p>
            </div>
            {accessNeedsError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{accessNeedsError}</p>}
            {accessNeedsSaved && <p className="rounded-lg bg-green-50 p-3 text-green-900" role="status">{accessNeedsSaved}</p>}
            <form className="space-y-4" onSubmit={(event) => void saveAccessNeeds(event)}>
              <fieldset className="space-y-2">
                <legend className="mb-2 font-medium">{t.passport.accessNeedsOptionsLabel}</legend>
                {Object.entries(t.passport.accessNeedOptions).map(([key, label]) => (
                  <label className="flex min-h-[44px] items-center gap-3" key={key}>
                    <input
                      className="h-5 w-5 accent-hayat-700"
                      type="checkbox"
                      checked={accessNeedsDraft.needs.includes(key)}
                      onChange={(event) => updateAccessNeed(key, event.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <label className="block space-y-1">
                <span className="font-medium">{t.passport.accessNeedsNote}</span>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-gray-900"
                  maxLength={200}
                  value={accessNeedsDraft.note}
                  onChange={(event) => {
                    setAccessNeedsDraft((current) => ({ ...current, note: event.target.value }));
                    setAccessNeedsSaved("");
                  }}
                  aria-describedby="access-needs-note-hint"
                />
                <span className="text-sm text-slate-600" id="access-needs-note-hint">
                  {t.passport.accessNeedsNoteHint.replace("{count}", String(accessNeedsDraft.note.length))}
                </span>
              </label>
              <label className="flex min-h-[44px] items-center gap-3">
                <input
                  className="h-5 w-5 accent-hayat-700"
                  type="checkbox"
                  checked={accessNeedsDraft.includeOnCareCard}
                  onChange={(event) => {
                    setAccessNeedsDraft((current) => ({ ...current, includeOnCareCard: event.target.checked }));
                    setAccessNeedsSaved("");
                  }}
                />
                <span>{t.passport.includeAccessNeedsOnCard}</span>
              </label>
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="note">{t.passport.accessNeedsCardAudience}</p>
              <div className="flex flex-wrap gap-2">
                <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={isSavingAccessNeeds || !accessNeedsDirty}>
                  {isSavingAccessNeeds ? t.passport.saving : t.passport.saveAccessNeeds}
                </button>
                <button
                  className="min-h-[44px] rounded-lg border border-slate-400 bg-white px-5 py-2 font-medium text-gray-900"
                  type="button"
                  disabled={!accessNeedsDraft.needs.length && !accessNeedsDraft.note && !accessNeedsDraft.includeOnCareCard}
                  onClick={() => {
                    setAccessNeedsDraft({ ...emptyAccessNeeds });
                    setAccessNeedsSaved("");
                  }}
                >
                  {t.passport.clearAccessNeeds}
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">{t.passport.yourDetails}</h2>
            {hasSavedProfile ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <div><dt className="font-medium">{t.passport.name}</dt><dd>{profile.fullName || t.passport.notProvided}</dd></div>
                <div><dt className="font-medium">{t.passport.dateOfBirth}</dt><dd>{profile.dateOfBirth || t.passport.notProvided}</dd></div>
                <div><dt className="font-medium">{t.passport.bloodType} ({t.passport.selfReported})</dt><dd>{profile.bloodType || t.passport.notProvided}</dd></div>
                <div>
                  <dt className="font-medium">{t.passport.allergies}</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {profile.allergies.length
                      ? profile.allergies.map((allergy) => <span className="rounded-full bg-slate-100 px-3 py-1" key={allergy}>{allergy}</span>)
                      : t.passport.noneListed}
                  </dd>
                </div>
                <div><dt className="font-medium">{t.passport.emergencyContactName}</dt><dd>{profile.emergencyContactName || t.passport.notProvided}</dd></div>
                <div><dt className="font-medium">{t.passport.emergencyContactPhone}</dt><dd>{profile.emergencyContactPhone || t.passport.notProvided}</dd></div>
              </dl>
            ) : <p>{t.passport.emptyProfile}</p>}
          </section>
        </>
      )}

      <Modal
        open={isModalOpen}
        title={hasSavedProfile ? t.passport.editDetails : t.passport.addDetails}
        closeLabel={t.passport.closeDialog}
        onClose={() => setIsModalOpen(false)}
        isDirty={dirty}
        confirmCloseMessage={t.passport.confirmDiscardChanges}
        direction={language === "ar" ? "rtl" : "ltr"}
        footer={({ requestClose }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button className="min-h-[44px] rounded-lg border border-gray-400 bg-white px-5 py-2 text-gray-900" type="button" onClick={requestClose}>
              {t.passport.cancel}
            </button>
            <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 py-2 font-medium text-white disabled:opacity-60" type="submit" form="profile-form" disabled={isSaving}>
              {isSaving ? t.passport.saving : t.passport.save}
            </button>
          </div>
        )}
      >
        {error && <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{error}</p>}
        <form id="profile-form" className="space-y-4" onSubmit={saveProfile}>
          <label className="block">
            <span className={labelClass}>{t.passport.name}</span>
            <input className={fieldClass} type="text" value={draft.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>{t.passport.dateOfBirth}</span>
            <input className={fieldClass} type="date" value={draft.dateOfBirth} onChange={(event) => updateField("dateOfBirth", event.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>{t.passport.bloodType}</span>
            <select className={fieldClass} value={draft.bloodType} onChange={(event) => updateField("bloodType", event.target.value)}>
              <option value="">{t.passport.selectBloodType}</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bloodType) => (
                <option value={bloodType} key={bloodType}>{bloodType}</option>
              ))}
            </select>
            <span className="mt-1 block text-sm text-gray-600">{t.passport.selfReportedUnverified}</span>
          </label>
          <fieldset>
            <legend className={`${labelClass} mb-2`}>{t.passport.allergies}</legend>
            <div className="flex flex-wrap gap-2">
              {draft.allergies.map((allergy) => (
                <span className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-slate-100 px-3" key={allergy}>
                  {allergy}
                  <button
                    className="min-h-[44px] min-w-[44px] rounded-full border border-gray-400 bg-white"
                    type="button"
                    aria-label={`${t.passport.removeAllergy}: ${allergy}`}
                    onClick={() => updateField("allergies", draft.allergies.filter((item) => item !== allergy))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input className={`${fieldClass} min-w-0 flex-1`} value={allergyDraft} onChange={(event) => setAllergyDraft(event.target.value)} aria-label={t.passport.addAllergy} />
              <button className="min-h-[44px] rounded-lg border border-gray-400 bg-white px-4" type="button" onClick={addAllergy}>
                {t.passport.addAllergy}
              </button>
            </div>
          </fieldset>
          <label className="block">
            <span className={labelClass}>{t.passport.emergencyContactName}</span>
            <input className={fieldClass} type="text" value={draft.emergencyContactName} onChange={(event) => updateField("emergencyContactName", event.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>{t.passport.emergencyContactPhone}</span>
            <input className={fieldClass} type="tel" value={draft.emergencyContactPhone} onChange={(event) => updateField("emergencyContactPhone", event.target.value)} />
          </label>
        </form>
      </Modal>
    </section>
  );
}
