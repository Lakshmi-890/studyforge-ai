"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Plus,
  Trash2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  AlertTriangle,
  FolderOpen
} from "lucide-react";
import confetti from "canvas-confetti";

interface Task {
  id: string;
  title: string;
  subject: string;
  status: "todo" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Review organic synthesis flashcards",
      subject: "Chemistry",
      status: "todo",
      priority: "high",
      dueDate: "2026-07-08",
    },
    {
      id: "2",
      title: "Solve derivatives worksheet 4",
      subject: "Calculus",
      status: "completed",
      priority: "medium",
      dueDate: "2026-07-04",
    },
    {
      id: "3",
      title: "Read Chapter 6: Wave-particle duality",
      subject: "Physics",
      status: "in-progress",
      priority: "high",
      dueDate: "2026-07-06",
    },
    {
      id: "4",
      title: "Draft introduction for history essay",
      subject: "Writing",
      status: "todo",
      priority: "low",
      dueDate: "2026-07-10",
    },
    {
      id: "5",
      title: "Prepare programming lab report",
      subject: "Computer Science",
      status: "in-progress",
      priority: "medium",
      dueDate: "2026-07-07",
    },
  ]);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Calculus");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newDueDate, setNewDueDate] = useState("2026-07-10");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle,
      subject: newSubject,
      status: "todo",
      priority: newPriority,
      dueDate: newDueDate,
    };

    setTasks([...tasks, newTask]);
    setNewTitle("");
    setShowAddForm(false);
    
    confetti({
      particleCount: 30,
      spread: 30,
      colors: ["#6366f1", "#a855f7"]
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const moveTask = (id: string, newStatus: "todo" | "in-progress" | "completed") => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          if (newStatus === "completed" && t.status !== "completed") {
            confetti({
              particleCount: 80,
              spread: 60,
              colors: ["#10b981", "#14b8a6", "#6366f1"],
              origin: { y: 0.7 }
            });
          }
          return { ...t, status: newStatus };
        }
        return t;
      })
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-rose-500/10 border-rose-500/30 text-rose-400";
      case "medium":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      default:
        return "bg-teal-500/10 border-teal-500/30 text-teal-400";
    }
  };

  const getStatusColumnTasks = (status: "todo" | "in-progress" | "completed") => {
    return tasks.filter((t) => t.status === status);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tasks & Kanban Board
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize, prioritize, and track your study milestones dynamically.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white border border-indigo-400/35 hover:border-indigo-400 glow-btn transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10"
        >
          <Plus size={16} />
          <span>Add Study Task</span>
        </button>
      </div>

      {/* Add Task Form Modal Overlay */}
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
                  className="w-full bg-slate-955/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Subject
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-955/40 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-350 outline-none focus:border-indigo-500/80 cursor-pointer"
                  >
                    <option value="Calculus">Calculus II</option>
                    <option value="Chemistry">Organic Chemistry</option>
                    <option value="Physics">Physics Mechanics</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Writing">Academic Essay</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-955/40 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-350 outline-none focus:border-indigo-500/80 cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-slate-955/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-850">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Create Task
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

      {/* Kanban Board Columns Grid */}
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
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-900/30 border border-slate-905 hover:border-slate-800/70 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded">
                        {task.subject}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mt-2.5 leading-snug">
                      {task.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900/50 pt-3">
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Calendar size={12} />
                      {task.dueDate}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moveTask(task.id, "in-progress")}
                        className="p-1 rounded bg-slate-950/45 border border-slate-900 hover:border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Move to In Progress"
                      >
                        <ArrowRight size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-slate-550 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete Task"
                      >
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
              {getStatusColumnTasks("in-progress").length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {getStatusColumnTasks("in-progress").length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-850 rounded-2xl text-slate-600 text-xs">
                <FolderOpen size={24} className="mb-2 opacity-40" />
                No tasks in progress
              </div>
            ) : (
              getStatusColumnTasks("in-progress").map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-900/30 border border-slate-905 hover:border-slate-800/70 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded">
                        {task.subject}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mt-2.5 leading-snug">
                      {task.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900/50 pt-3">
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Calendar size={12} />
                      {task.dueDate}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moveTask(task.id, "todo")}
                        className="p-1 rounded bg-slate-955 border border-slate-900 hover:border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Move back to To Do"
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        onClick={() => moveTask(task.id, "completed")}
                        className="p-1 rounded bg-indigo-600 border border-indigo-500/30 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                        title="Move to Completed"
                      >
                        <CheckCircle size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-slate-555 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete Task"
                      >
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
              {getStatusColumnTasks("completed").length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {getStatusColumnTasks("completed").length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-850 rounded-2xl text-slate-600 text-xs">
                <FolderOpen size={24} className="mb-2 opacity-40" />
                No completed tasks
              </div>
            ) : (
              getStatusColumnTasks("completed").map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-900/10 border border-slate-950 opacity-65 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-bold text-slate-555 uppercase tracking-wide bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                        {task.subject}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-455 mt-2.5 leading-snug line-through">
                      {task.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900/30 pt-3">
                    <span className="text-[10px] text-slate-655 font-semibold flex items-center gap-1">
                      <CheckCircle size={12} className="text-teal-500" />
                      Completed
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moveTask(task.id, "in-progress")}
                        className="p-1 rounded bg-slate-955 border border-slate-900 hover:border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Move back to In Progress"
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-slate-555 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete Task"
                      >
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
