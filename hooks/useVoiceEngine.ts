"use client";

import { useEffect, useRef, useState } from "react";

export function useVoiceEngine(voiceLang: string, onCommand: (cmd: string) => void) {
  const recognitionRef = useRef<any>(null);
  const runningRef = useRef(false);

  const [voiceOn, setVoiceOn] = useState(false);
  const [lastHeard, setLastHeard] = useState("");

  function start() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice not supported in this browser. Use Chrome.");
      return;
    }

    if (!recognitionRef.current) {
      const rec = new SpeechRecognition();
      rec.lang = voiceLang;
      rec.interimResults = false;
      rec.continuous = false;

      rec.onresult = (event: any) => {
        const transcript =
          event.results?.[event.results.length - 1]?.[0]?.transcript ?? "";

        const cleaned = transcript.trim();

        if (!cleaned) return;

        setLastHeard(cleaned);

        onCommand(cleaned);
      };

      rec.onend = () => {
        runningRef.current = false;
        setVoiceOn(false);
      };

      recognitionRef.current = rec;
    }

    recognitionRef.current.start();
    runningRef.current = true;
    setVoiceOn(true);
  }

  function stop() {
    try {
      recognitionRef.current?.stop();
    } catch {}
    runningRef.current = false;
    setVoiceOn(false);
  }

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  return {
    start,
    stop,
    voiceOn,
    lastHeard,
  };
}