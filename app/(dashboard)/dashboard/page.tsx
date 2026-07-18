"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import { Flame, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { calculateStreak } from "@/lib/streak";

interface Task {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  duration_minutes: number | null;
  status: "todo" | "in_progress" | "done";
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Get the current logged in user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log("Dashboard - Supabase User:", user);

        if (authError) {
          throw authError;
        }

        if (!user) {
          setError("User not authenticated. Please log in.");
          setLoading(false);
          return;
        }

        // 2. Fetch tasks and profile in parallel
        const [tasksRes, profileRes] = await Promise.all([
          supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single()
        ]);

        console.log("Dashboard - Tasks Response:", tasksRes);
        console.log("Dashboard - Profile Response:", profileRes);

        if (tasksRes.error) {
          throw tasksRes.error;
        }

        setTasks(tasksRes.data || []);
        if (profileRes.data) {
          setFullName(profileRes.data.full_name || "");
        }
      } catch (err: any) {
        console.error("Dashboard data fetch error:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [supabase]);

  // 3. Calculate statistics
  const totalTasks = tasks.length;
  const totalMinutes = tasks.reduce((sum, task) => {
    return sum + (task.duration_minutes ?? 0);
  }, 0);
  const activeStreak = calculateStreak(tasks);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400 font-medium animate-pulse">Loading dashboard statistics...</p>
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
            Welcome {fullName || "User"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time study analytics and overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-red-400 text-left">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Error Loading Dashboard</h4>
            <p className="text-xs text-red-400/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Total Tasks", value: `${totalTasks}`, unit: "tasks", icon: CheckCircle2, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/25" },
          { label: "Total Minutes", value: `${totalMinutes}m`, unit: "focus time", icon: Clock, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/25" },
          { label: "Active Streak", value: `${activeStreak}`, unit: "day", icon: Flame, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/25" },
        ].map((stat) => (
          <div key={stat.label} className={`glass-panel rounded-2xl p-6 border ${stat.bg} text-left transition-all hover:scale-[1.01] hover:border-opacity-50`}>
            <div className={`p-2.5 rounded-xl border ${stat.bg} w-fit mb-4`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{stat.label} <span className="text-slate-600">· {stat.unit}</span></p>
          </div>
        ))}
      </div>

      {/* Tasks List */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl text-left">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-white">Your Tasks</h2>
            <p className="text-xs text-slate-500 mt-0.5">Overview of all assigned tasks and duration</p>
          </div>
          <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-3 py-1 rounded-full">
            {totalTasks} {totalTasks === 1 ? "Task" : "Tasks"}
          </span>
        </div>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-sm text-slate-400 font-medium">No tasks found</p>
            <p className="text-xs text-slate-600 mt-1">Create some tasks to start tracking your progress.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-4">Title</th>
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-4 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-950/20 transition-all">
                    <td className="py-4 pl-4 font-semibold text-slate-200">{task.title}</td>
                    <td className="py-4">
                      {task.subject ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300">
                          {task.subject}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-4 text-slate-300">{task.duration_minutes !== null ? `${task.duration_minutes}m` : "—"}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        task.status === "done"
                          ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                          : task.status === "in_progress"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      }`}>
                        {task.status === "todo" ? "To Do" : task.status === "in_progress" ? "In Progress" : "Done"}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-right text-slate-400">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}