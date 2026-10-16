"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  toggleSound: () => { },
  playClick: () => { },
  playChannelSwitch: () => { },
  playSuccess: () => { },
});

// Exact musical note frequencies for C# Minor scale
const N = {
  // Bass / Root notes (Octave 2 & 3)
  Cs2: 69.3,
  B1: 61.74,
  A1: 55.0,
  Gs1: 51.91,
  Cs3: 138.59,
  B2: 123.47,
  A2: 110.0,
  Gs2: 103.83,

  // Melody / Lead notes (Octave 4 & 5)
  Cs4: 277.18,
  Ds4: 311.13,
  E4: 329.63,
  Fs4: 369.99,
  Gs4: 415.3,
  A4: 440.0,
  B4: 493.88,
  Cs5: 554.37,
};

// "Hislerim" Core Progression: C#m -> G#m -> A -> B / G#m
const CHORD_SEQUENCE = [
  { bass: N.Cs2, pad: [N.Cs3, N.E4, N.Gs4] },
  { bass: N.Gs1, pad: [N.Gs2, N.Ds4, N.B4] },
  { bass: N.A1, pad: [N.A2, N.Cs4, N.E4] },
  { bass: N.B1, pad: [N.B2, N.Ds4, N.Fs4] },
];

// Melodic hook motif timing (16th note grid relative to chord steps)
const MELODY_HOOK = [
  { freq: N.Cs5, delay: 0, dur: 0.35 },
  { freq: N.B4, delay: 350, dur: 0.35 },
  { freq: N.Gs4, delay: 700, dur: 0.5 },
  { freq: N.A4, delay: 1300, dur: 0.4 },
  { freq: N.Gs4, delay: 1700, dur: 0.7 },
  { freq: N.Fs4, delay: 2400, dur: 0.3 },
  { freq: N.E4, delay: 2700, dur: 0.4 },
  { freq: N.Ds4, delay: 3100, dur: 0.3 },
  { freq: N.Cs4, delay: 3400, dur: 0.9 },
];

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);

  // Engine references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const isPlayingMusicRef = useRef(false);
  const currentStepRef = useRef(0);

  // Initialize or resume browser AudioContext
  const initAudio = async () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass();
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.85, ctx.currentTime);
        master.connect(ctx.destination);

        audioCtxRef.current = ctx;
        masterGainRef.current = master;
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
  };

  // Plucked lead voice for the oriental melody line
  const triggerPluck = (freq: number, duration: number = 0.4) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);

      // Lowpass envelope creates the distinctive pinched synth-pluck sound
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2800, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainRef.current);

      osc.start(now);
      osc.stop(now + duration + 0.05);

      setTimeout(() => {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      }, (duration + 0.1) * 1000);
    } catch {
      // Audio stream interrupted
    }
  };

  // Deep Sub/Reese Bass drone
  const triggerBass = (freq: number, stepDuration: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(freq, now);
      osc1.detune.setValueAtTime(-4, now); // Slight detune for trap reese thickness

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(240, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.1);
      gain.gain.setValueAtTime(0.08, now + stepDuration - 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainRef.current);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + stepDuration);
      osc2.stop(now + stepDuration);

      setTimeout(() => {
        osc1.disconnect();
        osc2.disconnect();
        filter.disconnect();
        gain.disconnect();
      }, stepDuration * 1000 + 100);
    } catch {
      // Audio stream interrupted
    }
  };

  // Dark atmospheric chord pad
  const triggerPad = (chordFreqs: number[], stepDuration: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    const now = ctx.currentTime;

    chordFreqs.forEach((freq) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(650, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.015, now + 0.4);
        gain.gain.setValueAtTime(0.012, now + stepDuration - 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc.start(now);
        osc.stop(now + stepDuration);

        setTimeout(() => {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        }, stepDuration * 1000 + 100);
      } catch {
        // Audio stream interrupted
      }
    });
  };

  // Step sequencer: runs at ~81 BPM (~3.0s per bar/chord)
  const stepEngine = () => {
    if (!isPlayingMusicRef.current) return;

    const currentChord = CHORD_SEQUENCE[currentStepRef.current];
    const stepDuration = 3.0; // 3 seconds per chord cycle

    // Fire chord layers
    triggerBass(currentChord.bass, stepDuration);
    triggerPad(currentChord.pad, stepDuration);

    // Play hook lead melody on steps 0 and 2
    if (currentStepRef.current === 0 || currentStepRef.current === 2) {
      MELODY_HOOK.forEach((note) => {
        setTimeout(() => {
          if (isPlayingMusicRef.current) {
            triggerPluck(note.freq, note.dur);
          }
        }, note.delay);
      });
    }

    currentStepRef.current = (currentStepRef.current + 1) % CHORD_SEQUENCE.length;
  };

  const startHislerimMusic = () => {
    isPlayingMusicRef.current = true;
    currentStepRef.current = 0;
    stepEngine();
    musicIntervalRef.current = setInterval(stepEngine, 3000);
  };

  const stopHislerimMusic = () => {
    isPlayingMusicRef.current = false;
    if (musicIntervalRef.current) {
      clearInterval(musicIntervalRef.current as number);
      musicIntervalRef.current = null;
    }
  };

  const toggleSound = async () => {
    await initAudio();

    if (isMuted) {
      setIsMuted(false);
      startHislerimMusic();
      playClick();
    } else {
      setIsMuted(true);
      stopHislerimMusic();
    }
  };

  // Sound Effects
  const playClick = () => {
    if (isMuted || !audioCtxRef.current || !masterGainRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(masterGainRef.current);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore
    }
  };

  const playChannelSwitch = () => {
    if (isMuted || !audioCtxRef.current || !masterGainRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const bufferSize = Math.floor(ctx.sampleRate * 0.16);
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
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainRef.current);

      noise.start();
    } catch {
      // Ignore
    }
  };

  const playSuccess = () => {
    if (isMuted || !audioCtxRef.current || !masterGainRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(N.Cs4, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(N.Gs4, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(masterGainRef.current);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    return () => {
      stopHislerimMusic();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const actionsRef = useRef({ toggleSound, playClick, playChannelSwitch, playSuccess });
  useEffect(() => {
    actionsRef.current = { toggleSound, playClick, playChannelSwitch, playSuccess };
  });
  const stableActions = useMemo(() => ({
    toggleSound: () => actionsRef.current.toggleSound(),
    playClick: () => actionsRef.current.playClick(),
    playChannelSwitch: () => actionsRef.current.playChannelSwitch(),
    playSuccess: () => actionsRef.current.playSuccess(),
  }), []);
  const value = useMemo(() => ({
    isMuted,
    ...stableActions,
  }), [isMuted, stableActions]);

  return (
    <AudioContext.Provider value={value}>
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
      className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 text-xs font-light tracking-wide ${!isMuted
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
          <span className="hidden sm:inline">Hislerim Vibes</span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Muted</span>
        </>
      )}
    </button>
  );
}