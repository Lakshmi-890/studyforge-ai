"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Play, Pause, RotateCcw } from "lucide-react";

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTaskName?: string;
}

export default function FocusTimer({ isOpen, onClose, initialTaskName }: FocusTimerProps) {
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
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
  }, [isActive, isPaused]);

  const startTimer = () => { setIsActive(true); setIsPaused(false); };
  const pauseTimer = () => { setIsPaused(true); };
  const resumeTimer = () => { setIsPaused(false); };
  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(sessionMinutes * 60);
  };
  const handlePreset = (mins: number) => {
    setIsActive(false);
    setIsPaused(false);
    setSessionMinutes(mins);
    setTimeLeft(mins * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const percentage = (timeLeft / (sessionMinutes * 60)) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col items-center">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer">
          <X size={18} />
        </button>

        {initialTaskName && (
          <div className="mb-2 text-center px-6">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Focusing On</span>
            <h3 className="text-base font-bold text-white leading-tight truncate max-w-[280px]">{initialTaskName}</h3>
          </div>
        )}

        {/* Timer Circle */}
        <div className="relative w-56 h-56 flex items-center justify-center my-4">
          <svg className="w-full h-full transform -rotate-95">
            <circle cx="110" cy="110" r={radius} className="stroke-slate-900 fill-none" strokeWidth="10" />
            <circle
              cx="110"
              cy="110"
              r={radius}
              className="fill-none stroke-purple-500"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-white tracking-wider font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              FOCUS SESSION
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-4">
          <button onClick={resetTimer} className="p-3.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer" title="Reset Timer">
            <RotateCcw size={18} />
          </button>
          {!isActive ? (
            <button onClick={startTimer} className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-2 border-purple-400/40 hover:border-pink-400 flex items-center justify-center text-white glow-btn shadow-lg cursor-pointer" title="Start Timer">
              <Play size={24} className="ml-1 fill-white" />
            </button>
          ) : (
            <button onClick={isPaused ? resumeTimer : pauseTimer} className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer" title={isPaused ? "Resume" : "Pause"}>
              {isPaused ? <Play size={24} className="ml-1 fill-white" /> : <Pause size={24} />}
            </button>
          )}
        </div>

        {/* Session Duration */}
        <div className="mt-8">
          <p className="text- font-bold text-slate-400 uppercase tracking-wider mb-3">SESSION DURATION</p>
          <div className="flex gap-2">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => handlePreset(mins)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${sessionMinutes === mins
                  ? "bg-purple-650/20 border-purple-500/50 text-purple-300"
                  : "bg-slate-900/40 border-slate-850 hover:border-slate-800 text-slate-400"
                  }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}