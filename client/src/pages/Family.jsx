import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import SharedReportView from "../components/SharedReportView.jsx";
import CareTasks from "../components/CareTasks.jsx";
import PageSkeleton from "../components/PageSkeleton.jsx";

const emptyPermissions = {
  canViewMedicines: false,
  canViewAppointments: false,
  canClaimTasks: false
};

function formatDate(value, language) {
  if (!value) return "";
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`;
  return new Date(timestamp).toLocaleString(language);
}

function FamilyMemberForm({ t, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("caregiver");
  const [permissions, setPermissions] = useState(emptyPermissions);
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await axios.post("/api/family-circle", {
        name,
        email,
        role,
        permissions: role === "caregiver" ? permissions : emptyPermissions,
        consentAcknowledged
      });
      onCreated();
    } catch {
      setError(t.family.memberAddFailed);
    } finally {
      setSaving(false);
    }
  }

  function togglePermission(key) {
    setPermissions((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" role="presentation">
      <form className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-xl bg-white p-5 text-gray-900 shadow-xl sm:rounded-xl" onSubmit={submit} aria-labelledby="family-member-title">
        <h2 id="family-member-title" className="text-xl font-semibold">{t.family.addMember}</h2>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="font-medium">{t.family.memberName}</span>
            <input className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required />
          </label>
          <label className="block space-y-1">
            <span className="font-medium">{t.family.email}</span>
            <input className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required />
          </label>
          <label className="block space-y-1">
            <span className="font-medium">{t.family.role}</span>
            <select className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="caregiver">{t.family.caregiver}</option>
              <option value="emergency_contact_only">{t.family.emergencyContactOnly}</option>
            </select>
          </label>
        </div>
        {role === "caregiver" ? (
          <fieldset className="space-y-2 rounded-xl border border-slate-200 p-3">
            <legend className="px-1 font-semibold">{t.family.permissions}</legend>
            {[
              ["canViewMedicines", t.family.permissionMedicines],
              ["canViewAppointments", t.family.permissionAppointments],
              ["canClaimTasks", t.family.permissionTasks]
            ].map(([key, label]) => (
              <label className="flex min-h-[44px] items-center gap-3" key={key}>
                <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={permissions[key]} onChange={() => togglePermission(key)} />
                <span>{label}</span>
              </label>
            ))}
            <p className="text-sm text-slate-700">{t.family.permissionsOffByDefault}</p>
          </fieldset>
        ) : (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{t.family.emergencyOnlyScope}</p>
        )}
        <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6">
          <p className="font-semibold">{t.family.memberConsentTitle}</p>
          <p>{role === "emergency_contact_only" ? t.family.emergencyOnlyConsentDetails : t.family.caregiverConsentDetails}</p>
          <p>{t.family.revokeAnytime}</p>
          <p>{t.family.inviteNote}</p>
        </div>
        <label className="flex min-h-[44px] items-start gap-3">
          <input className="mt-1 h-5 w-5 accent-hayat-700" type="checkbox" checked={consentAcknowledged} onChange={(event) => setConsentAcknowledged(event.target.checked)} required />
          <span>{t.family.memberConsentCheckbox}</span>
        </label>
        {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button className="min-h-[44px] rounded-lg border border-slate-300 px-4" type="button" onClick={onClose}>{t.family.cancel}</button>
          <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-semibold text-white disabled:opacity-60" type="submit" disabled={!consentAcknowledged || saving}>
            {saving ? t.family.savingMember : t.family.addMember}
          </button>
        </div>
      </form>
    </div>
  );
}

function PermissionEditor({ permissions, onChange, t, disabled = false }) {
  return (
    <fieldset className="grid gap-1 sm:grid-cols-2" disabled={disabled}>
      {[
        ["canViewMedicines", t.family.permissionMedicines],
        ["canViewAppointments", t.family.permissionAppointments],
        ["canClaimTasks", t.family.permissionTasks]
      ].map(([key, label]) => (
        <label className="flex min-h-[44px] items-center gap-2 text-sm" key={key}>
          <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={permissions[key] === true} onChange={() => onChange(key)} />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export default function Family({ initialTab = "circle", showTabs = true, showShortcuts = true, titleKey }) {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState(initialTab);
  const [members, setMembers] = useState([]);
  const [helping, setHelping] = useState([]);
  const [mine, setMine] = useState([]);
  const [withMe, setWithMe] = useState([]);
  const [accessLog, setAccessLog] = useState([]);
  const [overview, setOverview] = useState(null);
  const [overviewMember, setOverviewMember] = useState(null);
  const [shareId, setShareId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState({});
  const [draftPermissions, setDraftPermissions] = useState({});
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [logPage, setLogPage] = useState(1);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [membersResponse, helpingResponse, mineResponse, withMeResponse, logResponse] = await Promise.all([
        axios.get("/api/family-circle"),
        axios.get("/api/family-circle/helping"),
        axios.get("/api/shares/mine"),
        axios.get("/api/shares/with-me"),
        axios.get("/api/access-log", { params: { page: logPage } })
      ]);
      setMembers(membersResponse.data);
      setHelping(helpingResponse.data);
      setMine(mineResponse.data);
      setWithMe(withMeResponse.data);
      setAccessLog(logResponse.data);
    } catch {
      setError(t.family.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [logPage, t.family.loadFailed]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function revokeMember(member) {
    if (!window.confirm(t.family.memberRevokeConfirm)) return;
    try {
      await axios.delete(`/api/family-circle/${member.id}`);
      setOverview(null);
      setOverviewMember(null);
      await loadData();
    } catch {
      setError(t.family.memberRevokeFailed);
    }
  }

  function startEditing(member) {
    setDraftPermissions((current) => ({ ...current, [member.id]: { ...member.permissions } }));
    setEditing((current) => ({ ...current, [member.id]: true }));
  }

  function toggleDraft(memberId, key) {
    setDraftPermissions((current) => ({
      ...current,
      [memberId]: { ...current[memberId], [key]: !current[memberId]?.[key] }
    }));
  }

  async function savePermissions(member) {
    try {
      await axios.patch(`/api/family-circle/${member.id}/permissions`, {
        permissions: draftPermissions[member.id]
      });
      setEditing((current) => ({ ...current, [member.id]: false }));
      await loadData();
    } catch {
      setError(t.family.permissionsFailed);
    }
  }

  async function openOverview(member) {
    setOverviewMember(member);
    setOverview(null);
    setOverviewLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`/api/family-circle/${member.id}/overview`);
      setOverview(data);
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        setOverview({ accessEnded: true });
      } else {
        setError(t.family.overviewFailed);
      }
    } finally {
      setOverviewLoading(false);
    }
  }

  async function revokeShare(share) {
    if (!window.confirm(t.family.revokeConfirm)) return;
    try {
      await axios.delete(`/api/shares/${share.id}`);
      setShareId(null);
      await loadData();
    } catch {
      setError(t.family.revokeFailed);
    }
  }

  const tabs = [
    ["circle", t.family.myCircle],
    ["helping", t.family.familyIHelp],
    ["log", t.family.accessLog]
  ];

  function renderReportsSharedByMe() {
    return (
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">{t.family.sharedByMe}</h2>
        {!mine.length && <p className="text-sm text-slate-700">{t.family.noSharesByMe}</p>}
        {mine.map((share) => (
          <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3" key={share.id}>
            <div>
              <p className="font-medium">{share.sharedWithEmail} · {t.reports.typeLabels[share.reportType] || share.reportType}</p>
              <p className="text-sm text-slate-600">{formatDate(share.reportDate, language)}</p>
              {share.status === "revoked" && <p className="text-sm text-slate-600">{t.family.revoked}</p>}
            </div>
            {share.status === "active" && (
              <button className="min-h-[44px] rounded-lg border border-slate-400 px-4 font-medium text-gray-900" type="button" onClick={() => void revokeShare(share)}>{t.family.revoke}</button>
            )}
          </article>
        ))}
      </section>
    );
  }

  function renderReportsSharedWithMe() {
    return (
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">{t.family.sharedWithMe}</h2>
        {shareId && (
          <>
            <div className="flex justify-end">
              <button className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4" type="button" onClick={() => setShareId(null)}>{t.family.close}</button>
            </div>
            <SharedReportView shareId={shareId} />
          </>
        )}
        {!withMe.length && <p className="text-sm text-slate-700">{t.family.noSharesWithMe}</p>}
        <ul className="space-y-2">
          {withMe.map((share) => (
            <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3" key={share.id}>
              <div>
                <p className="font-semibold">{t.reports.typeLabels[share.reportType] || share.reportType}</p>
                <p>{t.family.sharedBy.replace("{name}", share.ownerName)}</p>
                <p className="text-sm text-slate-600">{formatDate(share.reportDate, language)}</p>
              </div>
              <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white" type="button" onClick={() => setShareId(share.id)}>{t.family.openReadOnly}</button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  function renderOverview() {
    if (!overviewMember) return null;
    return (
      <section className="space-y-4 rounded-xl border border-hayat-200 bg-white p-4 sm:p-5" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{overviewMember.name}</h2>
          <button className="min-h-[44px] rounded-lg border border-slate-300 px-4" type="button" onClick={() => { setOverviewMember(null); setOverview(null); }}>{t.family.close}</button>
        </div>
        {overviewLoading ? <PageSkeleton label={t.family.loading} rows={2} /> : overview?.accessEnded ? (
          <p className="rounded-xl bg-amber-50 p-4 font-semibold text-amber-950">{t.family.accessEnded}</p>
        ) : overview && (
          <>
            <p className="rounded-xl bg-blue-50 p-3 font-medium text-blue-950">{t.family.readOnlyBanner}</p>
            {overview.emergencyCard && (
              <section className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
                <h3 className="font-semibold text-red-950">{t.family.emergencyCard}</h3>
                <p>{t.family.emergencyContact}: {overview.emergencyCard.contactName || "—"}</p>
                <p>{t.family.phone}: {overview.emergencyCard.contactPhone || "—"}</p>
                <p>{t.family.bloodType}: {overview.emergencyCard.bloodType || "—"}</p>
                <p>{t.family.allergies}: {overview.emergencyCard.allergies.length ? overview.emergencyCard.allergies.join(", ") : "—"}</p>
              </section>
            )}
            {overview.todaysMedicines && (
              <section className="space-y-2 rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold">{t.family.todaysMedicines}</h3>
                {overview.todaysMedicines.length ? overview.todaysMedicines.map((item, index) => (
                  <p key={`${item.medicineName}-${item.time}-${index}`}>{item.medicineName} · {item.time}</p>
                )) : <p className="text-sm text-slate-700">{t.family.noMedicines}</p>}
              </section>
            )}
            {overview.nextAppointments && (
              <section className="space-y-2 rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold">{t.family.nextAppointments}</h3>
                {overview.nextAppointments.length ? overview.nextAppointments.map((item, index) => (
                  <article key={`${item.title}-${item.dateTime}-${index}`}>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-slate-700">{formatDate(item.dateTime, language)}{item.place ? ` · ${item.place}` : ""}</p>
                  </article>
                )) : <p className="text-sm text-slate-700">{t.family.noAppointments}</p>}
              </section>
            )}
            {overview.sharedReports && (
              <section className="space-y-2 rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold">{t.family.sharedReports}</h3>
                {overview.sharedReports.length ? overview.sharedReports.map((item) => (
                  <p key={item.shareId}>{t.reports.typeLabels[item.type] || item.type} · {formatDate(item.createdAt, language)}</p>
                )) : <p className="text-sm text-slate-700">{t.family.noSharedReports}</p>}
              </section>
            )}
            {overviewMember.role === "caregiver" && overviewMember.permissions.canClaimTasks && (
              <CareTasks mode="caregiver" ownerId={overviewMember.ownerId} canClaimTasks />
            )}
            {overviewMember.role === "caregiver" && !overviewMember.permissions.canClaimTasks && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{t.care.tasksPermissionRequired}</p>
            )}
          </>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{titleKey ? t.sectionTabs[titleKey] : t.navigation.family}</h1>
        {showShortcuts && <div className="flex flex-wrap gap-2">
          <Link className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 bg-white px-4 font-medium text-hayat-900" to="/family/tasks">{t.care.tasksTitle}</Link>
          <Link className="inline-flex min-h-[44px] items-center rounded-lg bg-hayat-700 px-4 font-medium text-white" to="/family/journeys">{t.familyFirst.openFamilyFirst}</Link>
        </div>}
      </header>
      {showTabs && <div className="flex flex-wrap gap-2 border-b border-slate-200" role="tablist">
        {tabs.map(([key, label]) => (
          <button className={`min-h-[44px] rounded-t-lg border-b-2 px-4 font-medium ${tab === key ? "border-hayat-700 text-hayat-900" : "border-transparent text-gray-600"}`} type="button" role="tab" aria-selected={tab === key} key={key} onClick={() => { setTab(key); setOverview(null); setOverviewMember(null); setShareId(null); if (key === "log") setLogPage(1); }}>
            {label}
          </button>
        ))}
      </div>}
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{error}</p>}
      {loading ? <PageSkeleton label={t.family.loading} rows={3} /> : (
        <>
          {tab === "circle" && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{t.family.myCircle}</h2>
                <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-semibold text-white" type="button" onClick={() => setShowAdd(true)}>{t.family.addMember}</button>
              </div>
              {!members.length && <p className="rounded-xl bg-white p-4">{t.family.noMembers}</p>}
              {members.map((member) => (
                <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" key={member.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-slate-700">{member.email}</p>
                      <p className="text-sm text-slate-700">{member.role === "caregiver" ? t.family.caregiver : t.family.emergencyContactOnly}</p>
                    </div>
                    <p className={`font-medium ${member.status === "active" ? "text-emerald-800" : "text-slate-600"}`}>{member.status === "active" ? t.family.active : t.family.accessEnded}</p>
                  </div>
                  {member.role === "caregiver" && (
                    editing[member.id] ? (
                      <div className="space-y-2">
                        <PermissionEditor permissions={draftPermissions[member.id] || emptyPermissions} onChange={(key) => toggleDraft(member.id, key)} t={t} />
                        <div className="flex gap-2">
                          <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white" type="button" onClick={() => void savePermissions(member)}>{t.family.savePermissions}</button>
                          <button className="min-h-[44px] rounded-lg border border-slate-300 px-4" type="button" onClick={() => setEditing((current) => ({ ...current, [member.id]: false }))}>{t.family.cancel}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <PermissionEditor permissions={member.permissions} onChange={() => {}} t={t} disabled />
                        {member.status === "active" && <button className="min-h-[44px] rounded-lg border border-slate-300 px-4" type="button" onClick={() => startEditing(member)}>{t.family.editPermissions}</button>}
                      </div>
                    )
                  )}
                  {member.status === "active" && <button className="min-h-[44px] rounded-lg border border-slate-400 px-4 font-medium text-gray-900" type="button" onClick={() => void revokeMember(member)}>{t.family.revokeAccess}</button>}
                </article>
              ))}
              {renderReportsSharedByMe()}
            </section>
          )}
          {tab === "helping" && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">{t.family.familyIHelp}</h2>
              {overviewMember && renderOverview()}
              {!helping.length && <p className="rounded-xl bg-white p-4">{t.family.noPeopleIHelp}</p>}
              <ul className="space-y-3">
                {helping.map((member) => (
                  <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4" key={member.id}>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-slate-700">{member.role === "caregiver" ? t.family.caregiver : t.family.emergencyContactOnly}</p>
                      {member.status === "revoked" && <p className="font-medium text-slate-600">{t.family.accessEnded}</p>}
                    </div>
                    {member.status === "active" && <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white" type="button" onClick={() => void openOverview(member)}>{t.family.openCaregiverView}</button>}
                  </li>
                ))}
              </ul>
              {renderReportsSharedWithMe()}
            </section>
          )}
          {tab === "log" && (
            <section className="space-y-3">
              {!accessLog.length && <p className="rounded-xl bg-white p-4">{t.family.noAccessLog}</p>}
              {accessLog.map((entry) => (
                <article className="grid gap-1 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4" key={entry.id}>
                  <p><strong>{t.family.who}:</strong> {entry.viewerEmail || t.family.owner}</p>
                  <p><strong>{t.family.what}:</strong> {t.family.actions[entry.action] || t.wellness.accessLogActions[entry.action] || entry.action}</p>
                  <p><strong>{t.family.report}:</strong> {entry.reportType ? `${t.reports.typeLabels[entry.reportType] || entry.reportType} · ${formatDate(entry.reportDate, language)}` : entry.details || "—"}</p>
                  <p><strong>{t.family.when}:</strong> {formatDate(entry.timestamp, language)}</p>
                </article>
              ))}
              <div className="flex justify-between gap-2">
                <button className="min-h-[44px] rounded-lg border border-slate-300 px-4 disabled:opacity-50" type="button" disabled={logPage === 1} onClick={() => setLogPage((page) => page - 1)}>{t.family.previous}</button>
                <button className="min-h-[44px] rounded-lg border border-slate-300 px-4 disabled:opacity-50" type="button" disabled={accessLog.length < 50} onClick={() => setLogPage((page) => page + 1)}>{t.family.next}</button>
              </div>
            </section>
          )}
        </>
      )}
      {showAdd && <FamilyMemberForm t={t} onClose={() => setShowAdd(false)} onCreated={async () => { setShowAdd(false); await loadData(); }} />}
    </section>
  );
}
