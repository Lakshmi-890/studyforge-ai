"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, CheckCircle, ArrowRight, ArrowLeft, Sparkles, Calendar, FolderOpen, Loader2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface Task {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  duration_minutes: number | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
}

export default function TasksPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Calculus");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newDueDate, setNewDueDate] = useState("2026-07-20");
  const [newDuration, setNewDuration] = useState("30");
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) {
          setError("User not authenticated. Please log in.");
          setLoading(false);
          return;
        }

        const { data: fetchedTasks, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (tasksError) throw tasksError;
        setTasks(fetchedTasks || []);
      } catch (err: any) {
        console.error("Tasks fetch error:", err);
        setError(err.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [supabase]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSavingTask(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("No authenticated user");

      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          subject: newSubject,
          status: "todo",
          priority: newPriority,
          due_date: newDueDate || null,
          duration_minutes: parseInt(newDuration) || 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setTasks((prev) => [data, ...prev]);
        setNewTitle("");
        setShowAddForm(false);
        confetti({ particleCount: 30, spread: 30, colors: ["#6366f1", "#a855f7"] });
      }
    } catch (err: any) {
      console.error("Failed to add task:", err);
      alert(err.message || "Failed to add task");
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      console.error("Failed to delete task:", err);
      alert(err.message || "Failed to delete task");
    }
  };

  const moveTask = async (id: string, newStatus: "todo" | "in_progress" | "done") => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            if (newStatus === "done" && t.status !== "done") {
              confetti({ particleCount: 80, spread: 60, colors: ["#10b981", "#14b8a6", "#6366f1"], origin: { y: 0.7 } });
            }
            return {
              ...t,
              status: newStatus,
              completed: newStatus === "done",
              updated_at: new Date().toISOString(),
            };
          }
          return t;
        })
      );

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
          completed: newStatus === "done",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;
    } catch (err: any) {
      console.error("Failed to move task:", err);
      // Revert if error
      const { data: refetched } = await supabase.from("tasks").select("*").eq("id", id).single();
      if (refetched) {
        setTasks((prev) => prev.map((t) => t.id === id ? refetched : t));
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-rose-500/10 border-rose-500/30 text-rose-400";
      case "medium": return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      default: return "bg-teal-500/10 border-teal-500/30 text-teal-400";
    }
  };

  const getStatusColumnTasks = (status: "todo" | "in_progress" | "done") => {
    return tasks.filter((t) => t.status === status);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading tasks board...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tasks & Kanban Board
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize, prioritize, and track your study milestones dynamically.
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white border-indigo-400/35 hover:border-indigo-400 transition-all cursor-pointer shadow-lg">
          <Plus size={16} />
          <span>Add Study Task</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-red-400 text-left">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Error Loading Tasks</h4>
            <p className="text-xs text-red-400/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-slate-800/80 shadow-2xl p-6 relative text-left">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Create Study Task</span>
            </h3>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Write response essay on Chapter 4"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-350 outline-none cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-850">
                <button
                  type="submit"
                  disabled={savingTask}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {savingTask && <Loader2 size={12} className="animate-spin" />}
                  <span>{savingTask ? "Creating..." : "Create Task"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Column: To Do */}
        <div className="glass-panel rounded-3xl border border-slate-800/60 p-5 bg-slate-950/5 flex flex-col text-left">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/40 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <h3 className="font-bold text-slate-200 text-sm">To Do</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 border border-indigo-500/35 text-indigo-400">
              {getStatusColumnTasks("todo").length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {getStatusColumnTasks("todo").length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-850 rounded-2xl text-slate-600 text-xs">
                <FolderOpen size={24} className="mb-2 opacity-40" />
                No tasks to do
              </div>
            ) : (
              getStatusColumnTasks("todo").map((task) => (
                <div key={task.id} className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800 transition-all flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded max-w-[100px] truncate">
                        {task.subject || "General"}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mt-2.5 leading-snug">
                      {task.title}
                    </h4>
                    {task.duration_minutes !== null && (
                      <p className="text-[10px] text-indigo-400 font-semibold mt-1">Duration: {task.duration_minutes}m</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-900/50 pt-3">
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Calendar size={12} />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No Date"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => moveTask(task.id, "in_progress")} className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer" title="Move to In Progress">
                        <ArrowRight size={12} />
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded border border-transparent hover:text-red-400 transition-all cursor-pointer" title="Delete Task">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column: In Progress */}
        <div className="glass-panel rounded-3xl border border-slate-800/60 p-5 bg-slate-950/5 flex flex-col text-left">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/40 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-bold text-slate-200 text-sm">In Progress</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 border border-amber-500/35 text-amber-400">
              {getStatusColumnTasks("in_progress").length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {getStatusColumnTasks("in_progress").length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-850 rounded-2xl text-slate-600 text-xs">
                <FolderOpen size={24} className="mb-2 opacity-40" />
                No tasks in progress
              </div>
            ) : (
              getStatusColumnTasks("in_progress").map((task) => (
                <div key={task.id} className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800 transition-all flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded max-w-[100px] truncate">
                        {task.subject || "General"}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mt-2.5 leading-snug">
                      {task.title}
                    </h4>
                    {task.duration_minutes !== null && (
                      <p className="text-[10px] text-indigo-400 font-semibold mt-1">Duration: {task.duration_minutes}m</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-900/50 pt-3">
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Calendar size={12} />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No Date"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => moveTask(task.id, "todo")} className="p-1 rounded bg-slate-955 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer" title="Move to To Do">
                        <ArrowLeft size={12} />
                      </button>
                      <button onClick={() => moveTask(task.id, "done")} className="p-1 rounded bg-indigo-600 text-white transition-all cursor-pointer" title="Complete Task">
                        <CheckCircle size={12} />
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded border border-transparent hover:text-red-400 transition-all cursor-pointer" title="Delete Task">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column: Completed */}
        <div className="glass-panel rounded-3xl border border-slate-800/60 p-5 bg-slate-950/5 flex flex-col text-left">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/40 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h3 className="font-bold text-slate-200 text-sm">Completed</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-500/10 border border-teal-500/35 text-teal-400">
              {getStatusColumnTasks("done").length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {getStatusColumnTasks("done").length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-850 rounded-2xl text-slate-600 text-xs">
                <FolderOpen size={24} className="mb-2 opacity-40" />
                No completed tasks
              </div>
            ) : (
              getStatusColumnTasks("done").map((task) => (
                <div key={task.id} className="p-4 rounded-2xl bg-slate-900/10 border border-slate-950 opacity-65 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide bg-slate-900 px-2 py-0.5 rounded max-w-[100px] truncate">
                      {task.subject || "General"}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-400 mt-2.5 leading-snug line-through">
                      {task.title}
                    </h4>
                    {task.duration_minutes !== null && (
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Duration: {task.duration_minutes}m</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-900/30 pt-3">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                      <CheckCircle size={12} className="text-teal-500" />
                      Completed
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => moveTask(task.id, "in_progress")} className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer" title="Move to In Progress">
                        <ArrowLeft size={12} />
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded border border-transparent hover:text-red-400 transition-all cursor-pointer" title="Delete Task">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}