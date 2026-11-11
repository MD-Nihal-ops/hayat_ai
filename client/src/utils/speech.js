const speechLanguages = {
  en: "en-US",
  ar: "ar-SA",
  hi: "hi-IN",
  ml: "ml-IN"
};
const speedStorageKey = "hayat-speech-speed";
const listeners = new Set();
let speechState = {
  status: "idle",
  messageId: null,
  currentSentenceIndex: -1,
  currentSentence: ""
};
let requestId = 0;
let currentChunks = [];
let currentChunkIndex = 0;
let currentVoice = null;
let currentRate = 1;

function publish(nextState) {
  speechState = { ...speechState, ...nextState };
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return speechState;
}

export function isSupported() {
  return typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;
}

export function getSpeechSpeed() {
  if (typeof window === "undefined") return 1;
  const saved = Number(window.localStorage.getItem(speedStorageKey));
  return [0.75, 1, 1.25].includes(saved) ? saved : 1;
}

export function setSpeechSpeed(speed) {
  if (![0.75, 1, 1.25].includes(speed)) return;
  currentRate = speed;
  if (typeof window !== "undefined") window.localStorage.setItem(speedStorageKey, String(speed));
}

export function prepareSpeechText(input) {
  return String(input || "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1 link")
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|mailto:)[^)]+\)/gi, "$1 link")
    .replace(/https?:\/\/\S+|www\.\S+/gi, "link")
    .replace(/```[\s\S]*?```/g, (code) => code.replace(/```[^\n]*\n?|```/g, " "))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~>#|]/g, " ")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\[(?:\d+(?:\s*[,;]\s*\d+)*|source\s*\d*|citation[^\]]*)\]/gi, " ")
    .replace(/\((?:source|citation|ref)\s*[:#]?\s*[^)]*\)/gi, " ")
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

export function splitSpeechSentences(input) {
  const text = prepareSpeechText(input);
  if (!text) return [];
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
    return [...segmenter.segment(text)].map((part) => part.segment.trim()).filter(Boolean);
  }
  return text.match(/[^.!?؟。！？\n]+[.!?؟。！？]?/gu)?.map((part) => part.trim()).filter(Boolean) || [text];
}

function chunksForSpeech(sentences, maxLength = 220) {
  return sentences.flatMap((sentence, sentenceIndex) => {
    const words = sentence.split(/\s+/).flatMap((word) => {
      if (word.length <= maxLength) return [word];
      const characters = Array.from(word);
      const pieces = [];
      for (let index = 0; index < characters.length; index += maxLength) {
        pieces.push(characters.slice(index, index + maxLength).join(""));
      }
      return pieces;
    });
    const chunks = [];
    let chunk = "";
    words.forEach((word) => {
      if (chunk && `${chunk} ${word}`.length > maxLength) {
        chunks.push(chunk);
        chunk = word;
      } else {
        chunk = chunk ? `${chunk} ${word}` : word;
      }
    });
    if (chunk) chunks.push(chunk);
    return chunks.map((text) => ({ text, sentenceIndex }));
  });
}

function languageFromScript(text, appLanguage) {
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(text)) return "ar";
  if (/[\u0900-\u097F]/u.test(text)) return "hi";
  if (/[\u0D00-\u0D7F]/u.test(text)) return "ml";
  return Object.hasOwn(speechLanguages, appLanguage) ? appLanguage : "en";
}

function waitForVoices(synthesis) {
  return new Promise((resolve) => {
    let timeoutId;
    const finish = () => {
      clearTimeout(timeoutId);
      synthesis.removeEventListener("voiceschanged", finish);
      resolve(synthesis.getVoices());
    };
    synthesis.addEventListener("voiceschanged", finish);
    timeoutId = setTimeout(finish, 1500);
  });
}

function speakChunk(id) {
  if (id !== requestId || speechState.status !== "playing") return;
  const chunk = currentChunks[currentChunkIndex];
  if (!chunk) {
    publish({ status: "idle", messageId: null, currentSentenceIndex: -1, currentSentence: "" });
    currentChunks = [];
    return;
  }
  publish({
    status: "playing",
    currentSentenceIndex: chunk.sentenceIndex,
    currentSentence: chunk.sentence
  });
  const utterance = new window.SpeechSynthesisUtterance(chunk.text);
  utterance.voice = currentVoice;
  utterance.lang = currentVoice.lang || "en-US";
  utterance.rate = currentRate;
  utterance.onend = () => {
    if (id !== requestId) return;
    currentChunkIndex += 1;
    speakChunk(id);
  };
  utterance.onerror = (event) => {
    if (id !== requestId || event.error === "canceled" || event.error === "interrupted") return;
    publish({ status: "no-voice" });
  };
  window.speechSynthesis.speak(utterance);
}

export async function playSpeech(messageId, text, appLanguage, speed = getSpeechSpeed()) {
  stopSpeech();
  const id = requestId;
  if (!isSupported()) {
    publish({ status: "unsupported", messageId, currentSentenceIndex: -1, currentSentence: "" });
    return;
  }
  const sentences = splitSpeechSentences(text);
  if (!sentences.length) {
    publish({ status: "idle", messageId, currentSentenceIndex: -1, currentSentence: "" });
    return;
  }
  const synthesis = window.speechSynthesis;
  let voices = synthesis.getVoices();
  if (!voices.length) voices = await waitForVoices(synthesis);
  if (id !== requestId) return;
  const requestedLanguage = languageFromScript(prepareSpeechText(text), appLanguage);
  const voice = voices.find((candidate) =>
    typeof candidate.lang === "string" &&
    candidate.lang.toLowerCase().startsWith(requestedLanguage)
  );
  if (!voice) {
    publish({ status: "no-voice", messageId, currentSentenceIndex: -1, currentSentence: "" });
    return;
  }
  currentVoice = voice;
  currentRate = [0.75, 1, 1.25].includes(speed) ? speed : getSpeechSpeed();
  currentChunks = chunksForSpeech(sentences).map((chunk) => ({
    ...chunk,
    sentence: sentences[chunk.sentenceIndex]
  }));
  currentChunkIndex = 0;
  publish({ status: "playing", messageId, currentSentenceIndex: 0, currentSentence: sentences[0] });
  speakChunk(id);
}

export function pauseSpeech(messageId) {
  if (speechState.messageId !== messageId || speechState.status !== "playing" || !isSupported()) return;
  window.speechSynthesis.pause();
  publish({ status: "paused" });
}

export function resumeSpeech(messageId) {
  if (speechState.messageId !== messageId || speechState.status !== "paused" || !isSupported()) return;
  window.speechSynthesis.resume();
  publish({ status: "playing" });
}

export function stopSpeech(messageId) {
  if (messageId && speechState.messageId !== messageId) return;
  requestId += 1;
  if (isSupported()) window.speechSynthesis.cancel();
  currentChunks = [];
  currentChunkIndex = 0;
  currentVoice = null;
  publish({ status: "idle", messageId: null, currentSentenceIndex: -1, currentSentence: "" });
}

export function getSpeechSnapshot() {
  return { subscribe, getSnapshot };
}
