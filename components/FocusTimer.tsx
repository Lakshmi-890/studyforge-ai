"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  BrainCircuit,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Coffee,
  AlertTriangle
} from "lucide-react";
import confetti from "canvas-confetti";

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

const soundMap: Record<string, string> = {
  lofi: "/sounds/lofi.mp3",
  rain: "/sounds/rain.mp3",
  whitenoise: "/sounds/whitenoise.mp3",
  synth: "/sounds/deepspace.mp3"
};

export default function FocusTimer({ isOpen, onClose }: FocusTimerProps) {
  // Timer States
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  // Custom Settings
  const [subject, setSubject] = useState("Calculus");
  const [aiMode, setAiMode] = useState(false);
  const [ambientSound, setAmbientSound] = useState("none");
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [fatigueDetected, setFatigueDetected] = useState(false);

  // Statistics
  const [totalFocusedTime, setTotalFocusedTime] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio element only on client-side to prevent Next.js SSR error
  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;

    if (ambientSound !== "none" && soundPlaying) {
      const src = soundMap[ambientSound];
      if (src) {
        const targetSrc = window.location.origin + src;
        if (audioRef.current.src !== targetSrc) {
          audioRef.current.src = src;
          audioRef.current.loop = true;
        }
        if (isActive && !isPaused) {
          audioRef.current.play().catch((err) => console.log("Audio playback blocked/failed:", err));
        } else {
          audioRef.current.pause();
        }
      }
    } else {
      audioRef.current.pause();
    }
  }, [ambientSound, soundPlaying, isActive, isPaused]);

  const handleSessionCompletion = () => {
    setIsActive(false);
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (!isBreak) {
      setSessionsCompleted((prev) => prev + 1);
      // Automatically switch to short break
      setIsBreak(true);
      setTimeLeft(5 * 60);
    } else {
      setIsBreak(false);
      setTimeLeft(sessionMinutes * 60);
    }
  };

  // Calculate SVG Circle properties
  const totalSeconds = (isBreak ? 5 : sessionMinutes) * 60;
  const percentage = (timeLeft / totalSeconds) * 100;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Manage Countdown
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer Finished!
            clearInterval(timerRef.current!);
            handleSessionCompletion();
            return 0;
          }
          // Increment total focused time in seconds
          if (!isBreak) {
            setTotalFocusedTime((t) => t + 1);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, isBreak]);

  // AI Mode Fatigue Check Trigger
  useEffect(() => {
    if (aiMode && isActive && !isBreak && !fatigueDetected) {
      // Simulate checking study habits after 10 seconds of active focus
      const fatigueTimer = setTimeout(() => {
        setFatigueDetected(true);
        // AI Suggestion: user is studying for a long time, suggest switching or break
        confetti({
          particleCount: 40,
          spread: 60,
          colors: ["#6366f1", "#a855f7", "#14b8a6"]
        });
      }, 12000);
      return () => clearTimeout(fatigueTimer);
    }
  }, [aiMode, isActive, isBreak]);

  const startTimer = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setIsBreak(false);
    setTimeLeft(sessionMinutes * 60);
    setFatigueDetected(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handlePreset = (mins: number) => {
    setIsActive(false);
    setIsPaused(false);
    setIsBreak(false);
    setSessionMinutes(mins);
    setTimeLeft(mins * 60);
    setFatigueDetected(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const skipBreak = () => {
    setIsBreak(false);
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(sessionMinutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const triggerAISuggestion = () => {
    if (!aiMode) return;
    // Simulate fatigue detection adjustment
    setSessionMinutes(20);
    setTimeLeft(20 * 60);
    setFatigueDetected(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl border border-slate-800/80 shadow-2xl p-6 lg:p-8 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* AI Mode Banner */}
        <div className="flex gap-2 mb-6 items-center">
          <button
            onClick={() => {
              setAiMode(!aiMode);
              if (!aiMode) {
                // Instantly turn on AI Mode styling
              }
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              aiMode
                ? "bg-purple-600/25 border-purple-500/50 text-purple-300 shadow-md shadow-purple-500/10"
                : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <BrainCircuit size={14} className={aiMode ? "animate-pulse" : ""} />
            <span>AI Smart Timer {aiMode ? "ON" : "OFF"}</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Subject Dropdown */}
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isActive}
            className="bg-slate-900/40 border border-slate-800 rounded-full px-3 py-1 text-xs font-semibold text-slate-300 outline-none hover:border-slate-700 cursor-pointer disabled:opacity-50"
          >
            <option value="Calculus">Calculus II</option>
            <option value="Chemistry">Organic Chemistry</option>
            <option value="Physics">Physics Mechanics</option>
            <option value="Programming">React & Next.js</option>
            <option value="Writing">Academic Essay</option>
          </select>
        </div>

        {/* AI Fatigue Advice Alert */}
        {fatigueDetected && aiMode && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-left animate-in slide-in-from-top-4 duration-300">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide leading-none">AI Fatigue Alert</h4>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                Based on your keyboard activity & streak rhythm, fatigue is detected. We recommend shortening this session by 5 mins or switching to a light recap.
              </p>
              <button
                onClick={triggerAISuggestion}
                className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
              >
                Apply AI Adjustment (-5m)
              </button>
            </div>
          </div>
        )}

        {/* Circular SVG Timer */}
        <div className="relative w-56 h-56 flex items-center justify-center my-4">
          <svg className="w-full h-full transform -rotate-95">
            {/* Background Circle */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              className="stroke-slate-900 fill-none"
              strokeWidth="10"
            />
            {/* Progress Circle */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              className={`fill-none transition-all duration-1000 ${
                isBreak ? "stroke-teal-500" : "stroke-indigo-500"
              }`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-white tracking-wider font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              {isBreak ? "Break Time" : "Focus Session"}
            </span>
            <span className="text-[11px] text-slate-500 font-semibold mt-0.5">
              {subject}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-6 mt-4">
          <button
            onClick={resetTimer}
            className="p-3.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw size={18} />
          </button>

          {!isActive ? (
            <button
              onClick={startTimer}
              className="w-16 h-16 rounded-full bg-indigo-500 hover:bg-indigo-600 border-2 border-indigo-400/50 hover:border-indigo-400 flex items-center justify-center text-white glow-btn shadow-lg cursor-pointer"
              title="Start Timer"
            >
              <Play size={24} className="ml-1 fill-white" />
            </button>
          ) : (
            <button
              onClick={isPaused ? resumeTimer : pauseTimer}
              className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play size={24} className="ml-1 fill-white" /> : <Pause size={24} />}
            </button>
          )}

          {isBreak ? (
            <button
              onClick={skipBreak}
              className="p-3.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
              title="Skip Break"
            >
              <SkipForward size={18} />
            </button>
          ) : (
            <div className="w-12" /> // spacer to align
          )}
        </div>

        {/* Settings Area */}
        <div className="w-full grid grid-cols-2 gap-4 mt-8 border-t border-slate-800/40 pt-6">
          {/* Custom Duration Selector */}
          <div className="text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Session Duration
            </label>
            <div className="flex gap-2">
              {[15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handlePreset(mins)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    sessionMinutes === mins
                      ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                      : "bg-slate-900/40 border-slate-850 hover:border-slate-800 text-slate-400"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Ambience Music Card */}
          <div className="text-left flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center mb-2">
              <span>Ambience Beats</span>
            </label>
            <div className="flex gap-1.5 items-center">
              <select
                value={ambientSound}
                onChange={(e) => {
                  setAmbientSound(e.target.value);
                  setSoundPlaying(e.target.value !== "none");
                }}
                className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none hover:border-slate-700 cursor-pointer flex-1"
              >
                <option value="none">Silence</option>
                <option value="lofi">Lo-fi</option>
                <option value="rain">Rain</option>
                <option value="whitenoise">White Noise</option>
                <option value="synth">Deep Space Synth</option>
              </select>

              <button
                onClick={() => setSoundPlaying(!soundPlaying)}
                className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/80 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
                title={soundPlaying ? "Mute" : "Unmute"}
              >
                {soundPlaying && ambientSound !== "none" ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              {/* Animated Sound Equalizer Visualizer */}
              {soundPlaying && ambientSound !== "none" && (
                <div className="flex items-end gap-0.5 h-6 px-2.5">
                  <span className="w-0.75 bg-indigo-400 rounded-full animate-bounce h-4 duration-500" />
                  <span className="w-0.75 bg-indigo-400 rounded-full animate-bounce h-2 duration-300" />
                  <span className="w-0.75 bg-indigo-400 rounded-full animate-bounce h-5 duration-700" />
                  <span className="w-0.75 bg-indigo-400 rounded-full animate-bounce h-3 duration-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Session Stats Section */}
        <div className="w-full mt-6 bg-slate-950/45 border border-slate-900 rounded-2xl p-4 flex justify-around text-center">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Focused Today
            </span>
            <span className="text-lg font-bold text-white mt-1 block">
              {Math.floor(totalFocusedTime / 60)} mins
            </span>
          </div>
          <div className="border-l border-slate-900" />
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Sessions Done
            </span>
            <span className="text-lg font-bold text-indigo-400 mt-1 block flex items-center justify-center gap-1">
              <Trophy size={14} className="text-amber-400" />
              {sessionsCompleted}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}