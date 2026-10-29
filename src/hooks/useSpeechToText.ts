import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech API is not in TypeScript's DOM types.
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionClass(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Speech-to-text using the browser's built-in recognition (Chrome, Edge,
 * Safari). Each finished phrase is passed to onText; `interim` holds the
 * words still being recognized.
 */
export function useSpeechToText(onText: (text: string) => void, onError?: (message: string) => void) {
  const supported = getRecognitionClass() !== null;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  const onErrorRef = useRef(onError);
  onTextRef.current = onText;
  onErrorRef.current = onError;

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Rec = getRecognitionClass();
    if (!Rec) {
      onErrorRef.current?.("Voice typing isn't available in this browser. Try Chrome, Edge or Safari, or type your answer.");
      return;
    }
    recRef.current?.abort();
    const rec = new Rec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onresult = (e) => {
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onTextRef.current(r[0].transcript.trim());
        else pending += r[0].transcript;
      }
      setInterim(pending.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        onErrorRef.current?.("Microphone access is blocked. Allow the microphone for this site in your browser settings, then try again.");
      } else if (e.error === "no-speech") {
        onErrorRef.current?.("We didn't hear anything. Check your microphone and try again.");
      } else if (e.error !== "aborted") {
        onErrorRef.current?.("Voice typing stopped unexpectedly. Please try again.");
      }
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      if (recRef.current === rec) recRef.current = null;
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      onErrorRef.current?.("Could not start voice typing. Please try again.");
    }
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, interim, start, stop };
}
