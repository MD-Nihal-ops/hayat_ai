import { useState } from "react";
import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import useSpeech from "../hooks/useSpeech.js";
import { getSpeechSpeed, prepareSpeechText } from "../utils/speech.js";

export default function SpeechControls({ messageId, text, language }) {
  const { t } = useLanguage();
  const speech = useSpeech(messageId, text, language);
  const [speed, setSpeed] = useState(getSpeechSpeed);
  const active = speech.status === "playing" || speech.status === "paused";
  if (!prepareSpeechText(text)) return null;

  function changeSpeed(event) {
    const nextSpeed = Number(event.target.value);
    setSpeed(nextSpeed);
    speech.setSpeed(nextSpeed);
  }

  return (
    <div className="space-y-2" aria-label={t.accessibility.speech.controls}>
      <div className="flex flex-wrap items-center gap-1">
        {speech.status === "playing" ? (
          <button
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-hayat-800 hover:bg-hayat-50"
            type="button"
            aria-label={t.accessibility.speech.pause}
            title={t.accessibility.speech.pause}
            onClick={speech.pause}
          >
            <Pause size={19} aria-hidden="true" />
          </button>
        ) : speech.status === "paused" ? (
          <button
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-hayat-800 hover:bg-hayat-50"
            type="button"
            aria-label={t.accessibility.speech.resume}
            title={t.accessibility.speech.resume}
            onClick={speech.resume}
          >
            <RotateCcw size={19} aria-hidden="true" />
          </button>
        ) : (
          <button
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-hayat-800 hover:bg-hayat-50 disabled:opacity-50"
            type="button"
            aria-label={t.accessibility.speech.play}
            title={t.accessibility.speech.play}
            onClick={() => void speech.play()}
          >
            <Play size={19} aria-hidden="true" />
          </button>
        )}
        {active && (
          <button
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-hayat-800 hover:bg-hayat-50"
            type="button"
            aria-label={t.accessibility.speech.stop}
            title={t.accessibility.speech.stop}
            onClick={speech.stop}
          >
            <Square size={19} aria-hidden="true" />
          </button>
        )}
        <label className="inline-flex min-h-[44px] items-center gap-2 px-2 text-sm">
          <span>{t.accessibility.speech.speed}</span>
          <select
            className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-2 text-gray-900"
            value={speed}
            onChange={changeSpeed}
            aria-label={t.accessibility.speech.speed}
          >
            <option value="0.75">{t.accessibility.speech.slow}</option>
            <option value="1">{t.accessibility.speech.normal}</option>
            <option value="1.25">{t.accessibility.speech.fast}</option>
          </select>
        </label>
      </div>
      <p
        className={`${speech.status === "idle" ? "sr-only" : "text-sm font-medium text-teal-800"}`}
        aria-live="polite"
        role={speech.status === "no-voice" || speech.status === "unsupported" ? "status" : undefined}
      >
        {speech.status === "playing" ? t.accessibility.speech.playing
          : speech.status === "paused" ? t.accessibility.speech.paused
            : speech.status === "no-voice" ? t.accessibility.noVoice
              : speech.status === "unsupported" ? t.accessibility.speech.unsupported
                : ""}
      </p>
      {active && speech.currentSentence && (
        <p className="text-sm text-slate-700" aria-live="off">
          <span>{t.accessibility.speech.currentSentence}: </span>
          <mark className="rounded bg-yellow-200 px-1 text-gray-900">{speech.currentSentence}</mark>
        </p>
      )}
    </div>
  );
}
