import { useEffect, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  getSpeechSnapshot,
  getSpeechSpeed,
  pauseSpeech,
  playSpeech,
  resumeSpeech,
  setSpeechSpeed,
  stopSpeech
} from "../utils/speech.js";

const speechStore = getSpeechSnapshot();

export default function useSpeech(messageId, text, messageLanguage) {
  const { language } = useLanguage();
  const location = useLocation();
  const snapshot = useSyncExternalStore(
    speechStore.subscribe,
    speechStore.getSnapshot,
    speechStore.getSnapshot
  );
  const active = snapshot.messageId === messageId;

  useEffect(() => () => stopSpeech(messageId), [messageId, location.key, language, messageLanguage]);

  return {
    status: active ? snapshot.status : "idle",
    currentMessageId: snapshot.messageId,
    currentSentenceIndex: active ? snapshot.currentSentenceIndex : -1,
    currentSentence: active ? snapshot.currentSentence : "",
    speed: getSpeechSpeed(),
    play: () => playSpeech(messageId, text, messageLanguage || language, getSpeechSpeed()),
    pause: () => pauseSpeech(messageId),
    resume: () => resumeSpeech(messageId),
    stop: () => stopSpeech(messageId),
    setSpeed: (speed) => setSpeechSpeed(speed)
  };
}
