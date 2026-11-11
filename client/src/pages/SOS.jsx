import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { EMERGENCY_NUMBERS } from "../config/emergency.js";
import { cleanPhone, isValidPhone } from "../utils/contactLinks.js";
import { getMostRelevantPolicy, getPolicyStatus } from "../utils/insurancePolicies.js";
import PageSkeleton from "../components/PageSkeleton.jsx";

const emptyProfile = {
  bloodType: "",
  allergies: [],
  emergencyContactName: "",
  emergencyContactPhone: ""
};

export default function SOS() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState(emptyProfile);
  const [error, setError] = useState("");
  const [location, setLocation] = useState("");
  const [policies, setPolicies] = useState([]);
  const [insuranceError, setInsuranceError] = useState("");
  const [insuranceLoaded, setInsuranceLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get("/api/profile")
      .then(({ data }) => {
        if (active) setProfile({ ...emptyProfile, ...data, allergies: data.allergies || [] });
      })
      .catch(() => {
        if (active) setError(t.sos.profileFailed);
      });
    return () => {
      active = false;
    };
  }, [t.sos.profileFailed]);

  useEffect(() => {
    let active = true;
    axios.get("/api/insurance")
      .then(({ data }) => {
        if (active) {
          setPolicies(data);
          setInsuranceError("");
        }
      })
      .catch((requestError) => {
        if (active) setInsuranceError(requestError.response?.data?.error || t.passport.insuranceLoadFailed);
      })
      .finally(() => {
        if (active) setInsuranceLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [t.passport.insuranceLoadFailed]);

  const insurancePolicy = getMostRelevantPolicy(policies);
  const insuranceStatus = insurancePolicy ? getPolicyStatus(insurancePolicy.endDate) : null;
  const cleanedPhone = cleanPhone(profile.emergencyContactPhone);
  const hasPhone = Boolean(profile.emergencyContactPhone?.trim());
  const validPhone = isValidPhone(profile.emergencyContactPhone);
  const message = useMemo(() => {
    const bloodType = profile.bloodType || t.sos.bloodTypeNotSet;
    const allergies = profile.allergies.length ? profile.allergies.join(", ") : t.sos.noAllergies;
    const baseMessage = t.sos.messageTemplate
      .replace("{bloodType}", bloodType)
      .replace("{allergies}", allergies);
    return location ? `${baseMessage} ${t.sos.locationTemplate.replace("{url}", location)}` : baseMessage;
  }, [profile.bloodType, profile.allergies, t.sos.bloodTypeNotSet, t.sos.messageTemplate, t.sos.noAllergies, t.sos.locationTemplate, location]);

  function logContactOpened() {
    void axios.post("/api/sos/contact-opened")
      .catch((error) => console.warn("[sos] log failed", error));
  }

  function openContactApp(event) {
    if (!validPhone) {
      event.preventDefault();
      setError(t.sos.invalidPhone);
      return;
    }
    setError("");
    event.preventDefault();
    const { href, target } = event.currentTarget;
    if (target === "_blank") {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = href;
    }
    logContactOpened();
  }

  function addLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError(t.sos.locationUnavailable);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation(`https://maps.google.com/?q=${coords.latitude},${coords.longitude}`);
      },
      () => setError(t.sos.locationDenied),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  }

  const actionClass = "inline-flex min-h-[44px] items-center justify-center rounded-lg bg-red-700 px-5 py-2 font-semibold text-white hover:bg-red-800";
  const linkClass = "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-400 bg-white px-5 py-2 font-medium text-gray-900";

  return (
    <section className="mx-auto w-full max-w-3xl" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="space-y-6 rounded-2xl border-4 border-red-600 bg-white p-5 text-gray-900 sm:p-8">
        <h1 className="text-2xl font-bold text-red-700">{t.sos.title}</h1>
        <div className="space-y-2">
          <strong className="block">{t.sos.ambulance}</strong>
          <a
            className="inline-flex min-h-[44px] items-center text-4xl font-bold text-red-700 underline"
            href={`tel:${EMERGENCY_NUMBERS.ambulance}`}
          >
            {EMERGENCY_NUMBERS.ambulance}
          </a>
          <div className="flex flex-wrap gap-3">
            <a className={linkClass} href={`tel:${EMERGENCY_NUMBERS.police}`}>
              {t.sos.police}: {EMERGENCY_NUMBERS.police}
            </a>
            <a className={linkClass} href={`tel:${EMERGENCY_NUMBERS.fire}`}>
              {t.sos.fire}: {EMERGENCY_NUMBERS.fire}
            </a>
          </div>
        </div>
        <p><strong>{t.sos.bloodType}:</strong> {profile.bloodType || t.sos.notProvided} ({t.sos.selfReported})</p>
        <div>
          <strong>{t.sos.allergies}:</strong>
          {profile.allergies.length ? (
            <ul className="mt-1 list-inside list-disc">
              {profile.allergies.map((allergy) => <li key={allergy}>{allergy}</li>)}
            </ul>
          ) : <p>{t.sos.noneListed}</p>}
        </div>
        <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold">{t.sos.insurance}</h2>
          {insuranceError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{insuranceError}</p>}
          {!insuranceError && insuranceLoaded && insurancePolicy ? (
            <>
              <p><strong>{t.passport.insurerName}:</strong> {insurancePolicy.insurerName || t.passport.insurerNotListed}</p>
              <p><strong>{t.passport.planName}:</strong> {insurancePolicy.planName || t.passport.planNotListed}</p>
              <p><strong>{t.passport.policyNumber}:</strong> {insurancePolicy.policyNumber || t.passport.notProvided}</p>
              <p><strong>{t.passport.memberId}:</strong> {insurancePolicy.memberId || t.passport.notProvided}</p>
              <p>
                <strong>{t.passport.policyStatus}:</strong>{" "}
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium">
                  {t.passport.policyStatuses[insuranceStatus]}
                </span>
              </p>
              <p>
                <strong>{t.passport.insurerPhone}:</strong>{" "}
                {isValidPhone(insurancePolicy.insurerPhone)
                  ? <a className="inline-flex min-h-[44px] items-center text-hayat-700 underline" href={`tel:${cleanPhone(insurancePolicy.insurerPhone)}`}>{insurancePolicy.insurerPhone}</a>
                  : insurancePolicy.insurerPhone || t.passport.notProvided}
              </p>
              <p className="text-sm text-gray-700">{t.sos.insuranceNotVerified}</p>
            </>
          ) : !insuranceError && insuranceLoaded ? (
            <p>{t.sos.noInsuranceSaved}{" "}
              <Link className="inline-flex min-h-[44px] items-center font-medium text-hayat-700 underline" to="/me/insurance">{t.sos.addInsurance}</Link>
            </p>
          ) : !insuranceError ? (
            <PageSkeleton label={t.passport.loading} rows={1} />
          ) : null}
        </section>
        <p><strong>{t.sos.emergencyContact}:</strong> {profile.emergencyContactName || t.sos.notProvided} {profile.emergencyContactPhone}</p>
        {!hasPhone && (
          <p>
            {t.sos.missingContact}{" "}
            <Link className="font-medium text-hayat-700 underline" to="/me">{t.sectionTabs.passport}</Link>
          </p>
        )}
        {hasPhone && !validPhone && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 font-medium text-gray-900" role="alert">{t.sos.invalidPhone}</p>}
        {hasPhone && validPhone && (
          <>
            <div className="flex flex-wrap gap-3">
              <button className={`${linkClass} border-hayat-700`} type="button" onClick={addLocation}>
                {location ? t.sos.locationAdded : t.sos.addLocation}
              </button>
            </div>
            {location && <p className="break-all text-sm text-gray-700">{t.sos.locationAdded}</p>}
            <div className="flex flex-wrap gap-3">
              <a
                className={actionClass}
                href={`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={openContactApp}
              >
                {t.sos.messageWhatsApp}
              </a>
              <a
                className={linkClass}
                href={`sms:${cleanedPhone}?body=${encodeURIComponent(message)}`}
                onClick={openContactApp}
              >
                {t.sos.sendSms}
              </a>
              <a
                className={linkClass}
                href={`tel:${cleanedPhone}`}
                onClick={openContactApp}
              >
                {t.sos.call}
              </a>
            </div>
            <p className="text-sm text-gray-700">{t.sos.userMustSend}</p>
          </>
        )}
        {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{error}</p>}
        <Link className={linkClass} to="/explore?cat=hospital&emergency=true">{t.sos.findEmergencyDepartment}</Link>
        <p className="border-t border-red-200 pt-4 font-semibold text-red-800">{t.sos.disclaimer}</p>
      </div>
    </section>
  );
}
