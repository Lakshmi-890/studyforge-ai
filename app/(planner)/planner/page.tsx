"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  CalendarRange,
  Target,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Zap,
  RefreshCw,
  Info
} from "lucide-react";
import confetti from "canvas-confetti";

export default function PlannerPage() {
  // Input form states
  const [examDate, setExamDate] = useState("2026-07-20");
  const [subjects, setSubjects] = useState("Calculus II, Organic Chemistry, Physics Mechanics");
  const [studyHours, setStudyHours] = useState("3");
  const [difficulty, setDifficulty] = useState("Hard");
  const [targetScore, setTargetScore] = useState("95%");
  const [weakTopics, setWeakTopics] = useState("Integration by parts, Aromatic reactions, Fluid dynamics");

  // Planner engine status
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [planGenerated, setPlanGenerated] = useState(true); // Default mock plan exists
  const [activeTab, setActiveTab] = useState("weekly");

  // Missed sessions / Rescheduling state
  const [missedAlert, setMissedAlert] = useState(true);
  const [reschedulingDone, setReschedulingDone] = useState(false);

  const generationSteps = [
    "Analyzing exam parameters...",
    "Dividing syllabus into daily micro-modules...",
    "Integrating spaced repetition review intervals...",
    "Balancing difficulty curves and breaks...",
    "Finalizing StudyForge Schedule..."
  ];

  const [errorMessage, setErrorMessage] = useState("");

  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([
    { day: "Monday", sessions: [{ time: "09:00 AM", title: "Calculus: Integration by Parts (Weak Area Focus)", type: "Core Study", dur: "90m" }, { time: "02:00 PM", title: "Chemistry: Aromatic Rings", type: "Recap", dur: "60m" }] },
    { day: "Tuesday", sessions: [{ time: "10:00 AM", title: "Physics: Fluid Dynamics Practice Problems", type: "Core Study", dur: "90m" }, { time: "04:00 PM", title: "Active Recall: Quiz 1", type: "Review", dur: "45m" }] },
    { day: "Wednesday", sessions: [{ time: "09:00 AM", title: "Chemistry: Nucleophilic Substitution", type: "Core Study", dur: "90m" }, { time: "03:00 PM", title: "Calculus: Spaced Repetition Review", type: "Spaced Repet", dur: "60m" }] },
    { day: "Thursday", sessions: [{ time: "11:00 AM", title: "Physics: Fluids & Pressure Equations", type: "Core Study", dur: "90m" }, { time: "02:00 PM", title: "Calculus: Integration Practice", type: "Practice", dur: "60m" }] },
    { day: "Friday", sessions: [{ time: "09:00 AM", title: "Calculus & Chemistry Cross-Quiz", type: "Exam Prep", dur: "120m" }, { time: "04:00 PM", title: "Weekly progress audit & breakdown", type: "Audit", dur: "30m" }] }
  ]);

  const [dailySessions, setDailySessions] = useState<any[]>([
    { time: "09:00 AM - 10:30 AM", title: "Calculus: Integration by Parts (Weak Area Focus)", desc: "Solve 15 integration by parts problems. Focus on trigonometry multipliers.", subject: "Calculus", type: "Core Study", status: "Due" },
    { time: "10:30 AM - 10:45 AM", title: "Mindfulness Break (AI Recommendation)", desc: "Stretch, hydrate, and look away from screen.", subject: "Break", type: "AI Break", status: "Rest" },
    { time: "02:00 PM - 03:00 PM", title: "Chemistry: Aromatic Compounds Review", desc: "Active recall flashcards for benzene reactions.", subject: "Chemistry", type: "Review", status: "Due" }
  ]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPlanGenerated(false);
    setErrorMessage("");
    setStepIndex(0);

    // Animate generation steps simulation
    let currentStep = 0;
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < generationSteps.length) {
        setStepIndex(currentStep);
      }
    }, 400);

    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examDate,
          subjects,
          studyHours,
          targetScore,
          weakTopics,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate study plan from Gemini.");
      }

      if (data.weeklyPlan && data.dailySessions) {
        setWeeklyPlan(data.weeklyPlan);
        setDailySessions(data.dailySessions);
        setPlanGenerated(true);
        confetti({
          particleCount: 100,
          spread: 50,
          colors: ["#6366f1", "#a855f7", "#14b8a6"]
        });
      } else {
        throw new Error("Invalid plan structure received from AI planner.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to construct AI schedule.");
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  const handleReschedule = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setMissedAlert(false);
      setReschedulingDone(true);
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#14b8a6", "#10b981"]
      });
    }, 1500);
  };

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Study Planner & Scheduler
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure your exam target parameters to trigger Gemini study layout generations.
          </p>
        </div>
      </div>

      {/* Grid: Inputs Form & Plan Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Parameters Inputs */}
        <div className="space-y-6 text-left">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" />
              <span>Configure Target</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Target Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Subjects
                </label>
                <input
                  type="text"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="e.g. Calculus, Chemistry"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Study Hours / Day
                  </label>
                  <select
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-350 outline-none focus:border-indigo-500/80 cursor-pointer"
                  >
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="3">3 Hours</option>
                    <option value="4">4+ Hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Target Score
                  </label>
                  <input
                    type="text"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                    placeholder="e.g. A+ or 90%"
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Weak Topics (Focus Areas)
                </label>
                <textarea
                  value={weakTopics}
                  onChange={(e) => setWeakTopics(e.target.value)}
                  placeholder="Integration, Benzene structures"
                  rows={3}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 placeholder-slate-650 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                />
              </div>

              {errorMessage && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs text-center leading-normal">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white border border-indigo-400/35 hover:border-indigo-400 glow-btn flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-6"
              >
                <Sparkles size={14} />
                <span>{isGenerating ? "AI is generating plan..." : "Generate AI Study Plan"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Generated Schedule & Adaptive Alerts */}
        <div className="lg:col-span-2 space-y-6 text-left">
          {/* Missed Sessions / Adaptive Rescheduling Notification */}
          {missedAlert && (
            <div className="glass-panel border-l-4 border-amber-500 rounded-2xl p-5 bg-amber-500/5 shadow-md flex gap-4 items-start animate-in slide-in-from-top-4 duration-500">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide leading-none">
                  Missed Session Detected!
                </h4>
                <p className="text-xs text-slate-350 mt-1.5 leading-relaxed">
                  Yesterday's 1.5h Calculus session was missed. Your exams are in 12 days; to avoid overload, AI proposes redistributing the topics to Thursday's review slot and Friday's practice block.
                </p>
                <div className="flex gap-4 mt-3">
                  <button
                    onClick={handleReschedule}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    <RefreshCw size={12} className="animate-spin-slow" />
                    <span>Apply Adaptive Reschedule</span>
                  </button>
                  <button
                    onClick={() => setMissedAlert(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rescheduling Success notification */}
          {reschedulingDone && (
            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs flex items-center gap-2 animate-in fade-in duration-300">
              <CheckCircle2 size={16} className="text-teal-400" />
              <span>Calculus topics successfully redistributed. No overall deadlines were missed!</span>
            </div>
          )}

          {/* AI Generated Plan Viewer */}
          {isGenerating ? (
            <div className="glass-panel rounded-3xl p-12 border border-slate-800/80 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
              <h4 className="text-sm font-bold text-white mb-1">AI Generator Core</h4>
              <p className="text-xs text-slate-400 font-semibold italic animate-pulse">
                {generationSteps[stepIndex]}
              </p>
            </div>
          ) : planGenerated ? (
            <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl">
              {/* Tab Selector */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/40 mb-6">
                <div className="flex gap-2">
                  {["daily", "weekly", "monthly"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        activeTab === tab
                          ? "bg-indigo-600/25 border border-indigo-500/45 text-indigo-300"
                          : "text-slate-400 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      {tab} Plan
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-950/40 border border-slate-900 px-2 py-1 rounded">
                  <Info size={11} className="text-slate-500" />
                  <span>Exam Target: {examDate}</span>
                </div>
              </div>

              {/* Tab Content 1: Daily */}
              {activeTab === "daily" && (
                <div className="space-y-4">
                  {dailySessions.map((session, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950/20 border border-slate-900/60 hover:border-slate-800/60 transition-all flex items-start gap-4"
                    >
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-indigo-400 text-xs font-bold tracking-tight text-center shrink-0">
                        {session.time.split(" ")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{session.title}</h4>
                          <span
                            className={`text-[9px] px-2 py-0.25 font-bold rounded-full border ${
                              session.status === "Rest"
                                ? "bg-teal-500/10 border-teal-500/35 text-teal-400"
                                : "bg-indigo-500/10 border-indigo-500/35 text-indigo-400"
                            }`}
                          >
                            {session.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-snug">{session.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab Content 2: Weekly */}
              {activeTab === "weekly" && (
                <div className="space-y-6">
                  {weeklyPlan.map((dayData, idx) => (
                    <div key={idx} className="border-b border-slate-900/60 last:border-b-0 pb-4 last:pb-0">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
                        {dayData.day}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {dayData.sessions.map((sess: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-xl bg-slate-950/20 border border-slate-900 hover:border-slate-850 transition-all text-left flex justify-between items-center"
                          >
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-500 font-bold block">{sess.time}</span>
                              <span className="text-xs font-bold text-slate-200 block truncate mt-0.5">
                                {sess.title}
                              </span>
                            </div>
                            <span className="text-[9px] font-semibold text-slate-400 shrink-0 bg-slate-900 px-2 py-0.75 rounded border border-slate-850">
                              {sess.dur}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab Content 3: Monthly Calendar outline */}
              {activeTab === "monthly" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-900">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 30 }).map((_, idx) => {
                      const dayNumber = idx + 1;
                      const hasStudy = dayNumber % 3 === 0;
                      const hasExam = dayNumber === 16;
                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded-xl flex flex-col justify-between p-1.5 border text-xs font-semibold ${
                            hasExam
                              ? "bg-red-500/10 border-red-500/40 text-red-400"
                              : hasStudy
                              ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40"
                              : "bg-slate-950/20 border-slate-900/60 text-slate-600"
                          }`}
                        >
                          <span className="self-end text-[10px]">{dayNumber}</span>
                          {hasExam && <span className="w-1.5 h-1.5 rounded-full bg-red-500 self-start ml-1 mb-1" />}
                          {hasStudy && !hasExam && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 self-start ml-1 mb-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-500 font-bold border-t border-slate-900 pt-3">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500/20 border border-indigo-500/35" /> Study Blocks</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/35" /> Exam Date</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 border border-slate-800/80 flex flex-col items-center justify-center min-h-[300px]">
              <Sparkles className="w-12 h-12 text-slate-700 mb-4" />
              <h4 className="text-sm font-bold text-slate-400">No Study Plan Active</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-normal text-center">
                Configure your target parameters in the sidebar and hit Generate to build your customized AI study schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
