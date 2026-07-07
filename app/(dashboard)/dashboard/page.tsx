"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import {
  Flame, Clock, CheckCircle2, Calendar, Sparkles,
  Play, Plus, TrendingUp, Award, Loader2, Pause, SkipForward, Music, Volume2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import confetti from "canvas-confetti";

interface Task {
  id: string;
  title: string;
  subject: string;
  completed: boolean;
  status: string;
}

interface AnalyticsDay {
  day: string;
  hours: number;
}

export default function Dashboard() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [studyData, setStudyData] = useState<AnalyticsDay[]>([]);
  const [stats, setStats] = useState({ streak: 0, focusMins: 0, tasksCompleted: 0, productivityScore: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Calculus");
  const [savingTask, setSavingTask] = useState(false);
  const [fullName, setFullName] = useState("");
  const [activeTask, setActiveTask] = useState<string | null>(null);

  // Background Focus Music Player States
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [showMusicControls, setShowMusicControls] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const tracks = [
    { name: "Focus Lofi", url: "https://cdn.pixabay.com/audio/1/lofi-study-112191.mp3" },
    { name: "Chill Lofi", url: "https://cdn.pixabay.com/audio/2/chill-lofi-103574.mp3" },
    { name: "Rain on Window", url: "https://cdn.pixabay.com/audio/3/rain-on-window-102353.mp3" }
  ];

  // Initialize and clean up background music player
  useEffect(() => {
    audioPlayerRef.current = new Audio();
    audioPlayerRef.current.volume = musicVolume;

    const handleTrackEnd = () => {
      setCurrentTrackIdx((prev) => (prev + 1) % tracks.length);
      setMusicPlaying(true);
    };

    audioPlayerRef.current.addEventListener("ended", handleTrackEnd);

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.removeEventListener("ended", handleTrackEnd);
        audioPlayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    if (!audioPlayerRef.current) return;

    const track = tracks[currentTrackIdx];
    if (audioPlayerRef.current.src !== track.url) {
      audioPlayerRef.current.src = track.url;
      audioPlayerRef.current.load();
    }

    if (musicPlaying) {
      audioPlayerRef.current.play().catch((err) => {
        console.error("Audio playback blocked/failed:", err);
        setMusicPlaying(false);
      });
    } else {
      audioPlayerRef.current.pause();
    }
  }, [currentTrackIdx, musicPlaying]);

  const handleNextTrack = () => {
    setCurrentTrackIdx((prev) => (prev + 1) % tracks.length);
    setMusicPlaying(true);
  };

  const togglePlayPause = () => {
    setMusicPlaying(!musicPlaying);
  };

  const handleStartSession = (title: string) => {
    setActiveTask(title);
    window.dispatchEvent(new CustomEvent("start-focus-session", { detail: { taskName: title } }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Fetch today's tasks
    const today = new Date().toISOString().split("T")[0];
    const [tasksRes, analyticsRes, planRes, profileRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("analytics").select("*").eq("user_id", user.id).gte("date", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]).order("date"),
      supabase.from("study_plans").select("plan_json, title").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1),
      supabase.from("profiles").select("streak_count, total_focus_mins, full_name").eq("id", user.id).single(),
    ]);

    if (profileRes.data) {
      setFullName(profileRes.data.full_name || "");
    }

    // Tasks
    if (tasksRes.data) setTasks(tasksRes.data);

    // Analytics chart
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (analyticsRes.data && analyticsRes.data.length > 0) {
      const mapped = analyticsRes.data.map((a: any) => ({
        day: days[new Date(a.date).getDay()],
        hours: parseFloat(a.study_hours) || 0,
      }));
      setStudyData(mapped);

      const todayData = analyticsRes.data.find((a: any) => a.date === today);
      setStats({
        streak: profileRes.data?.streak_count ?? 0,
        focusMins: profileRes.data?.total_focus_mins ?? 0,
        tasksCompleted: todayData?.tasks_completed ?? 0,
        productivityScore: todayData?.productivity_score ?? 0,
      });
    } else {
      setStats({ streak: profileRes.data?.streak_count ?? 0, focusMins: profileRes.data?.total_focus_mins ?? 0, tasksCompleted: 0, productivityScore: 0 });
      setStudyData([]);
    }

    // Today's schedule from active plan
    if (planRes.data && planRes.data[0]) {
      const plan = planRes.data[0].plan_json as any;
      if (plan?.dailySessions) {
        setSchedule(plan.dailySessions.slice(0, 3).map((s: any, i: number) => ({
          id: `s${i}`,
          time: s.time,
          title: s.title,
          done: s.status === "Done",
          color: i % 3 === 0 ? "border-purple-500 bg-purple-500/5 text-purple-400"
               : i % 3 === 1 ? "border-indigo-500 bg-indigo-500/5 text-indigo-400"
               : "border-teal-500 bg-teal-500/5 text-teal-400",
        })));
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSavingTask(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id: user.id, title: newTitle.trim(), subject: newSubject, status: "todo" })
      .select()
      .single();

    if (!error && data) {
      setTasks((prev) => [data, ...prev]);
      setNewTitle("");
      setShowAddTask(false);
      confetti({ particleCount: 40, spread: 30, colors: ["#6366f1", "#a855f7"] });
    }
    setSavingTask(false);
  };

  const handleTaskToggle = async (id: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: newCompleted, status: newCompleted ? "done" : "todo" } : t));
    await supabase.from("tasks").update({ completed: newCompleted, status: newCompleted ? "done" : "todo" }).eq("id", id);
    if (newCompleted) {
      confetti({ particleCount: 30, spread: 25, colors: ["#14b8a6", "#10b981"] });
    }
  };

  const subjectColors: Record<string, string> = {
    Chemistry: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    Calculus: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    Physics: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    Writing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Biology: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading your workspace...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome {fullName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Your personalized AI study command center</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Day Streak", value: `${stats.streak}`, unit: "days", icon: Flame, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/25" },
          { label: "Focus Time", value: `${Math.floor(stats.focusMins / 60)}h ${stats.focusMins % 60}m`, unit: "total", icon: Clock, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/25" },
          { label: "Tasks Done", value: `${stats.tasksCompleted}`, unit: "today", icon: CheckCircle2, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/25" },
          { label: "Productivity", value: `${stats.productivityScore}%`, unit: "score", icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/25" },
        ].map((stat) => (
          <div key={stat.label} className={`glass-panel rounded-2xl p-5 border ${stat.bg} text-left`}>
            <div className={`p-2 rounded-lg border ${stat.bg} w-fit mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label} <span className="text-slate-600">· {stat.unit}</span></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-white">Weekly Study Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Hours studied per day</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          {studyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={studyData}>
                <defs>
                  <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} unit="h" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 12 }} labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#a5b4fc" }} />
                <Area type="monotone" dataKey="hours" stroke="#6366f1" fill="url(#studyGrad)" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center gap-2">
              <Award className="w-8 h-8 text-slate-600" />
              <p className="text-sm text-slate-500">No study data yet.</p>
              <p className="text-xs text-slate-600">Complete your first Pomodoro session to see analytics!</p>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-bold text-white">Today's Plan</h2>
          </div>
          {schedule.length > 0 ? (
            <div className="space-y-3">
              {schedule.map((s) => (
                <div key={s.id} className={`p-3.5 rounded-xl border-l-4 ${s.color} bg-slate-950/30 relative group cursor-pointer`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1">{s.time}</p>
                      <p className="text-xs font-semibold text-slate-200 leading-snug">{s.title}</p>
                    </div>
                    {s.done && <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />}
                  </div>
                  {!s.done && (
                    <button 
                      onClick={() => handleStartSession(s.title)}
                      className="mt-2 flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-pink-400 transition-all cursor-pointer"
                    >
                      <Play size={10} /> Start Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
              <Calendar className="w-8 h-8 text-slate-600" />
              <p className="text-xs text-slate-500">No plan yet.</p>
              <a href="/planner" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">Generate a Study Plan →</a>
            </div>
          )}
        </div>

        {/* Focus Tasks */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Focus Tasks</h2>
            </div>
            <button onClick={() => setShowAddTask(!showAddTask)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-650/25 transition-all cursor-pointer">
              <Plus size={12} /> Add Task
            </button>
          </div>

          {showAddTask && (
            <form onSubmit={handleAddTask} className="mb-4 p-4 rounded-xl bg-slate-950/40 border border-indigo-500/25">
              <input type="text" placeholder="Task description..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none mb-3 border-b border-slate-800 pb-2" autoFocus />
              <div className="flex items-center gap-3">
                <select value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 px-2 py-1.5 outline-none cursor-pointer">
                  {["Calculus", "Chemistry", "Physics", "Biology", "Writing", "History", "Other"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button type="submit" disabled={savingTask}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1">
                  {savingTask ? <Loader2 size={12} className="animate-spin" /> : null}
                  {savingTask ? "Saving..." : "Add"}
                </button>
                <button type="button" onClick={() => setShowAddTask(false)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
              </div>
            </form>
          )}

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600" />
              <p className="text-xs text-slate-500">No tasks yet. Add one above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all group cursor-pointer ${task.completed ? "bg-slate-950/20 border-slate-900 opacity-60" : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"}`}
                  onClick={() => handleTaskToggle(task.id, task.completed)}>
                  <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${task.completed ? "bg-teal-500 border-teal-500" : "border-slate-600 group-hover:border-indigo-400"}`}>
                    {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <p className={`text-xs font-medium flex-1 leading-snug ${task.completed ? "line-through text-slate-500" : "text-slate-200"}`}>
                    {task.title}
                  </p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${subjectColors[task.subject] ?? "bg-slate-700/30 text-slate-400 border-slate-700/50"}`}>
                    {task.subject}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-panel rounded-3xl p-6">
          <h2 className="text-sm font-bold text-white mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: "Open AI Planner", desc: "Generate study schedule", href: "/planner", color: "text-purple-400 border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10" },
              { label: "Ask AI Tutor", desc: "Socratic study session", href: "/tutor", color: "text-pink-400 border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10" },
              { label: "Upload Material", desc: "PDF to flashcards & quiz", href: "/materials", color: "text-teal-400 border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10" },
            ].map((action) => (
              <a key={action.label} href={action.href}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all group ${action.color}`}>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-white">{action.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{action.desc}</p>
                </div>
                <Play className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
              </a>
            ))}

            {/* Focus Music Toggle & Player Controls */}
            <div className="border-t border-slate-800/40 pt-4 mt-4 text-left">
              <button
                onClick={() => setShowMusicControls(!showMusicControls)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  showMusicControls
                    ? "border-pink-500/35 bg-pink-500/5 text-pink-300"
                    : "border-slate-900 bg-slate-950/20 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Music size={16} className={musicPlaying ? "animate-pulse text-pink-400" : ""} />
                  <div>
                    <span className="text-xs font-bold block">Focus Music Player</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {musicPlaying ? `Playing: ${tracks[currentTrackIdx].name}` : "Study beats channel"}
                    </span>
                  </div>
                </div>
                {/* Waveform Equalizer animation */}
                {musicPlaying && (
                  <div className="flex items-end gap-0.75 h-5 px-2 shrink-0">
                    <span className="w-0.75 bg-pink-400 rounded-full animate-bar-1" />
                    <span className="w-0.75 bg-pink-400 rounded-full animate-bar-2" />
                    <span className="w-0.75 bg-pink-400 rounded-full animate-bar-3" />
                    <span className="w-0.75 bg-pink-400 rounded-full animate-bar-4" />
                    <span className="w-0.75 bg-pink-400 rounded-full animate-bar-5" />
                  </div>
                )}
              </button>

              {showMusicControls && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Lofi Beats</span>
                    <span className="text-[10px] text-slate-505 font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                      Track {currentTrackIdx + 1}/3
                    </span>
                  </div>

                  {/* Player actions row */}
                  <div className="flex items-center justify-between gap-4 mt-1 bg-slate-900/40 border border-slate-900 p-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlayPause}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border border-purple-500/30 flex items-center justify-center text-white cursor-pointer shadow-md hover:scale-105 transition-all"
                        title={musicPlaying ? "Pause" : "Play"}
                      >
                        {musicPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5 fill-white" />}
                      </button>
                      <button
                        onClick={handleNextTrack}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Next Track"
                      >
                        <SkipForward size={14} />
                      </button>
                    </div>

                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <Volume2 size={13} className="text-slate-500 shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                        className="flex-1 accent-pink-550 h-1 rounded-lg bg-slate-800 outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
