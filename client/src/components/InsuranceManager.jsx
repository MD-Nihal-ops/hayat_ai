import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext.jsx";
import Modal from "./Modal.jsx";
import { getPolicyStatus } from "../utils/insurancePolicies.js";
import useAuthedBlobUrl from "../hooks/useAuthedBlobUrl.js";

const emptyFields = {
  insurerName: "",
  planName: "",
  policyholderName: "",
  organizationName: "",
  policyNumber: "",
  memberId: "",
  startDate: "",
  endDate: "",
  insurerPhone: "",
  coveragePercent: "",
  deductible: "",
  copay: ""
};

const textFieldNames = [
  ["insurerName", "insurerName", "text"],
  ["planName", "planName", "text"],
  ["policyholderName", "policyholderName", "text"],
  ["organizationName", "organizationName", "text"],
  ["policyNumber", "policyNumber", "text"],
  ["memberId", "memberId", "text"],
  ["startDate", "startDate", "date"],
  ["endDate", "endDate", "date"],
  ["insurerPhone", "insurerPhone", "tel"]
];

function fieldsForForm(policy = {}) {
  return Object.fromEntries(Object.keys(emptyFields).map((field) => [
    field,
    policy[field] == null ? "" : String(policy[field])
  ]));
}

function maskPolicyNumber(value) {
  if (!value) return "";
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

function PolicyFields({ fields, onChange, t, inputClass, labelClass }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {textFieldNames.map(([name, labelKey, type]) => (
          <label className="block" key={name}>
            <span className={labelClass}>{t.passport[labelKey]}</span>
            <input className={inputClass} type={type} value={fields[name]} onChange={(event) => onChange(name, event.target.value)} />
          </label>
        ))}
      </div>
      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3">
        <legend className="px-1 font-medium">{t.passport.enteredByYou}</legend>
        {[
          ["coveragePercent", t.passport.coveragePercent],
          ["deductible", t.passport.deductible],
          ["copay", t.passport.copay]
        ].map(([name, label]) => (
          <label className="block" key={name}>
            <span className={labelClass}>{label}</span>
            <input className={inputClass} type="number" min="0" step="any" value={fields[name]} onChange={(event) => onChange(name, event.target.value)} />
          </label>
        ))}
      </fieldset>
    </>
  );
}

function InsuranceDocumentPreview({ policy, onClose, t }) {
  const file = useAuthedBlobUrl(
    policy ? `/api/insurance/${policy.id}/file` : "",
    Boolean(policy),
    t.passport.insuranceSaveFailed
  );
  return (
    <Modal
      open={Boolean(policy)}
      title={t.passport.viewDocument}
      closeLabel={t.passport.closeDialog}
      onClose={onClose}
      direction="ltr"
    >
      {file.loading && <p role="status">{t.passport.loading}</p>}
      {file.error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{file.error}</p>}
      {file.url && file.type === "application/pdf" && (
        <iframe className="h-[70vh] w-full" title={t.passport.viewDocument} src={file.url} />
      )}
      {file.url && file.type.startsWith("image/") && (
        <img className="max-h-[70vh] w-full object-contain" src={file.url} alt={t.passport.viewDocument} />
      )}
    </Modal>
  );
}

export default function InsuranceManager({ policies, onPoliciesChange }) {
  const { t, language } = useLanguage();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [policyDraft, setPolicyDraft] = useState(null);
  const [fields, setFields] = useState(emptyFields);
  const [initialFields, setInitialFields] = useState(emptyFields);
  const [fileId, setFileId] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notInsurance, setNotInsurance] = useState(false);
  const [error, setError] = useState("");
  const [viewedPolicy, setViewedPolicy] = useState(null);
  const fileInput = useRef(null);
  const cameraInput = useRef(null);
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  const dirty = JSON.stringify(fields) !== JSON.stringify(initialFields);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function resetDraft() {
    setPolicyDraft(null);
    setFields(emptyFields);
    setInitialFields(emptyFields);
    setFileId("");
    setFile(null);
    setNotInsurance(false);
    setError("");
    setIsEditOpen(false);
  }

  async function discardDraft() {
    if (fileId) {
      try {
        await axios.delete(`/api/insurance/pending/${fileId}`);
      } catch (cancelError) {
        setError(cancelError.response?.data?.error || t.passport.insuranceSaveFailed);
        return;
      }
    }
    resetDraft();
  }

  function beginUpload() {
    setError("");
    setNotInsurance(false);
    fileInput.current?.click();
  }

  function editPolicy(policy) {
    const nextFields = fieldsForForm(policy);
    setPolicyDraft(policy);
    setFields(nextFields);
    setInitialFields(nextFields);
    setFileId("");
    setFile(null);
    setNotInsurance(false);
    setError("");
    setIsEditOpen(true);
  }

  async function uploadPolicy(selectedFile) {
    if (!selectedFile) return;
    setBusy(true);
    setError("");
    setNotInsurance(false);
    const body = new FormData();
    body.append("policy", selectedFile);
    try {
      const { data } = await axios.post("/api/insurance/extract", body, { timeout: 120000 });
      if (data.notInsurance) {
        setFile(null);
        setFileId("");
        setNotInsurance(true);
        return;
      }
      const nextFields = fieldsForForm(data.fields);
      setFile(selectedFile);
      setFileId(data.fileId);
      setFields(nextFields);
      setInitialFields(emptyFields);
      setPolicyDraft({ id: null });
    } catch (uploadError) {
      setError(uploadError.response?.data?.detail || uploadError.response?.data?.error || uploadError.message);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
      if (cameraInput.current) cameraInput.current.value = "";
    }
  }

  async function savePolicy(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      ...Object.fromEntries(Object.entries(fields).filter(([fieldName]) =>
        !["coveragePercent", "deductible", "copay"].includes(fieldName)
      )),
      coveragePercent: fields.coveragePercent === "" ? null : Number(fields.coveragePercent),
      deductible: fields.deductible === "" ? null : Number(fields.deductible),
      copay: fields.copay === "" ? null : Number(fields.copay)
    };
    try {
      let updated;
      if (policyDraft?.id) {
        const { data } = await axios.put(`/api/insurance/${policyDraft.id}`, payload);
        updated = policies.map((policy) => policy.id === data.id ? data : policy);
      } else {
        const { data } = await axios.post("/api/insurance", { ...payload, fileId });
        updated = [data, ...policies];
      }
      onPoliciesChange(updated);
      resetDraft();
    } catch (saveError) {
      setError(saveError.response?.data?.error || t.passport.insuranceSaveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function deletePolicy(policy) {
    if (!window.confirm(t.passport.confirmDeletePolicy)) return;
    try {
      await axios.delete(`/api/insurance/${policy.id}`);
      onPoliciesChange(policies.filter((item) => item.id !== policy.id));
      setError("");
    } catch (deleteError) {
      setError(deleteError.response?.data?.error || t.passport.insuranceSaveFailed);
    }
  }

  function viewDocument(policy) {
    setViewedPolicy(policy);
  }

  function updateField(name, value) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  const inputClass = "min-h-[44px] w-full rounded-lg border border-gray-400 bg-white px-3 py-2 text-gray-900";
  const labelClass = "mb-1 block text-sm font-medium text-gray-900";
  const policyFormFields = (
    <PolicyFields fields={fields} onChange={updateField} t={t} inputClass={inputClass} labelClass={labelClass} />
  );

  return (
    <div className="space-y-4 text-gray-900">
      {error && !isEditOpen && !policyDraft && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
      {!policyDraft && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInput}
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            className="hidden"
            type="file"
            onChange={(event) => uploadPolicy(event.target.files?.[0])}
          />
          <input
            ref={cameraInput}
            accept="image/*"
            capture="environment"
            className="hidden"
            type="file"
            onChange={(event) => uploadPolicy(event.target.files?.[0])}
          />
          <button
            className="min-h-[44px] rounded-lg bg-hayat-700 px-5 py-2 font-medium text-white hover:bg-hayat-900"
            type="button"
            onClick={beginUpload}
            disabled={busy}
          >
            {t.passport.addInsurancePolicy}
          </button>
          <button
            className="min-h-[44px] rounded-lg border border-hayat-700 bg-white px-4 py-2 text-hayat-900"
            type="button"
            onClick={() => cameraInput.current?.click()}
            disabled={busy}
          >
            {t.upload.takePhoto}
          </button>
        </div>
      )}
      {busy && <p role="status">{t.passport.policyProcessing}</p>}
      {notInsurance && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <p>{t.passport.notInsurance}</p>
          <button className="mt-2 min-h-[44px] rounded-lg border border-amber-700 bg-white px-4 py-2 text-amber-950" type="button" onClick={beginUpload}>
            {t.passport.tryAgain}
          </button>
        </div>
      )}
      {policyDraft && !policyDraft.id && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h3 className="text-lg font-semibold">{t.passport.policyPreview}</h3>
          {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
          <form id="new-insurance-policy-form" className="space-y-4" onSubmit={savePolicy}>
            <div className="grid items-start gap-5 lg:grid-cols-2">
              <div className="min-h-72 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {file?.type === "application/pdf"
                  ? <iframe className="h-[520px] w-full" title={t.passport.policyPreview} src={previewUrl} />
                  : file && <img className="max-h-[520px] w-full object-contain" src={previewUrl} alt={t.passport.policyPreview} />}
              </div>
              <div className="space-y-3">{policyFormFields}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
              <button className="min-h-[44px] rounded-lg border border-gray-400 bg-white px-5 py-2 text-gray-900" type="button" onClick={discardDraft}>
                {t.passport.cancel}
              </button>
              <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={busy || !fileId}>
                {busy ? t.passport.saving : t.passport.savePolicy}
              </button>
            </div>
          </form>
        </section>
      )}
      {!policyDraft && policies.length === 0 && <p>{t.passport.noInsurancePolicy}</p>}
      {!policyDraft && policies.map((policy) => (
        <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5" key={policy.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="font-semibold">{policy.insurerName || t.passport.insurerNotListed}</h3>
              <p>{policy.planName || t.passport.planNotListed}</p>
              <p>{t.passport.policyNumber}: {maskPolicyNumber(policy.policyNumber) || t.passport.notProvided}</p>
              <p>{t.passport.validUntil}: {policy.endDate || t.passport.datesNotListed}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
              {t.passport.policyStatuses[getPolicyStatus(policy.endDate)]}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="min-h-[44px] rounded-lg border border-gray-400 bg-white px-4 py-2 text-gray-900" type="button" onClick={() => viewDocument(policy)}>
              {t.passport.viewDocument}
            </button>
            <button className="min-h-[44px] rounded-lg border border-hayat-700 bg-white px-4 py-2 text-hayat-900" type="button" onClick={() => editPolicy(policy)}>
              {t.passport.editPolicy}
            </button>
            <button className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100" type="button" onClick={() => deletePolicy(policy)}>
              {t.passport.deletePolicy}
            </button>
          </div>
        </article>
      ))}
      <p className="text-sm text-gray-700">{t.passport.insuranceStorageNotice}</p>

      <Modal
        open={isEditOpen}
        title={t.passport.editPolicy}
        closeLabel={t.passport.closeDialog}
        onClose={discardDraft}
        isDirty={dirty}
        confirmCloseMessage={t.passport.confirmDiscardChanges}
        direction={language === "ar" ? "rtl" : "ltr"}
        footer={({ requestClose }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button className="min-h-[44px] rounded-lg border border-gray-400 bg-white px-5 py-2 text-gray-900" type="button" onClick={requestClose}>
              {t.passport.cancel}
            </button>
            <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 py-2 font-medium text-white disabled:opacity-60" type="submit" form="edit-insurance-policy-form" disabled={busy}>
              {busy ? t.passport.saving : t.passport.savePolicy}
            </button>
          </div>
        )}
      >
        {error && <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
        <form id="edit-insurance-policy-form" className="space-y-3" onSubmit={savePolicy}>
          {policyFormFields}
        </form>
      </Modal>
      <InsuranceDocumentPreview policy={viewedPolicy} onClose={() => setViewedPolicy(null)} t={t} />
    </div>
  );
}
