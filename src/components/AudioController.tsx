"use client";

import React, { createContext, useContext, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface AudioContextType {
  isMuted: boolean;
  toggleSound: () => void;
  playClick: () => void;
  playChannelSwitch: () => void;
  playSuccess: () => void;
}

const AudioContext = createContext<AudioContextType>({
  isMuted: true,
  toggleSound: () => {},
  playClick: () => {},
  playChannelSwitch: () => {},
  playSuccess: () => {},
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientOscRef = useRef<OscillatorNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const startAmbient = () => {
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;

      if (!ambientOscRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(110, ctx.currentTime); // Soft deep A2 tone

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        ambientOscRef.current = osc;
        ambientGainRef.current = gain;
      } else if (ambientGainRef.current) {
        ambientGainRef.current.gain.setValueAtTime(0.04, ctx.currentTime);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const stopAmbient = () => {
    if (ambientGainRef.current && audioCtxRef.current) {
      ambientGainRef.current.gain.setValueAtTime(0.0001, audioCtxRef.current.currentTime);
    }
  };

  const toggleSound = () => {
    initAudio();
    if (isMuted) {
      setIsMuted(false);
      startAmbient();
      playClick();
    } else {
      setIsMuted(true);
      stopAmbient();
    }
  };

  const playClick = () => {
    if (isMuted) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore
    }
  };

  const playChannelSwitch = () => {
    if (isMuted) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;

      // Create white noise burst for retro static TV sound
      const bufferSize = ctx.sampleRate * 0.18;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch {
      // Ignore
    }
  };

  const playSuccess = () => {
    if (isMuted) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Ignore
    }
  };

  return (
    <AudioContext.Provider value={{ isMuted, toggleSound, playClick, playChannelSwitch, playSuccess }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);

export function AudioToggle() {
  const { isMuted, toggleSound } = useAudio();

  return (
    <button
      onClick={toggleSound}
      title={isMuted ? "Enable Sound Experience" : "Mute Sound"}
      className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 text-xs font-light tracking-wide ${
        !isMuted
          ? "bg-[#105F68] text-white border-[#105F68] shadow-sm"
          : "bg-white/80 hover:bg-white text-[#105F68]/70 hover:text-[#105F68] border-[#105F68]/15"
      }`}
    >
      {!isMuted ? (
        <>
          <div className="flex items-center gap-0.5 h-3">
            <span className="w-0.5 h-2 bg-[#63C1BB] animate-pulse"></span>
            <span className="w-0.5 h-3 bg-[#C8E6E2] animate-bounce"></span>
            <span className="w-0.5 h-1.5 bg-[#63C1BB] animate-pulse"></span>
          </div>
          <Volume2 className="w-3.5 h-3.5 text-[#C8E6E2]" />
          <span className="hidden sm:inline">Audio On</span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sound</span>
        </>
      )}
    </button>
  );
}
