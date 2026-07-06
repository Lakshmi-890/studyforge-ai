"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  ShieldAlert,
  Server,
  Users,
  Database,
  Terminal,
  Activity,
  Cpu,
  RefreshCw,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Play
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import confetti from "canvas-confetti";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [logs, setLogs] = useState([
    { time: "21:30:12", type: "INFO", message: "User session auth approved for Lakshmi Priya" },
    { time: "21:30:05", type: "WARN", message: "Slow response from DB read for /dashboard metrics (340ms)" },
    { time: "21:29:45", type: "INFO", message: "Adaptive Reschedule request dispatched successfully" },
    { time: "21:29:10", type: "ERROR", message: "Failed Google Fonts download resource (Geist font fallback loaded)" },
    { time: "21:28:15", type: "INFO", message: "Task 2 checkbox toggled - Completed state achieved" },
  ]);

  // System metrics data
  const apiRequestsData = [
    { time: "15:00", reqs: 140 },
    { time: "16:00", reqs: 220 },
    { time: "17:00", reqs: 180 },
    { time: "18:00", reqs: 310 },
    { time: "19:00", reqs: 430 },
    { time: "20:00", reqs: 380 },
    { time: "21:00", reqs: 480 },
  ];

  const dbPerformanceData = [
    { name: "Queries", count: 420 },
    { name: "Mutations", count: 180 },
    { name: "Transactions", count: 90 },
    { name: "Cache Hits", count: 850 },
  ];

  const registeredUsers = [
    { id: "u_1", name: "Lakshmi Priya", email: "priya@studyforge.edu", plan: "Pro Student", joind: "2026-06-25", status: "Active" },
    { id: "u_2", name: "Sarah Jenkins", email: "sarah@mit.edu", plan: "Free Plan", joind: "2026-07-01", status: "Active" },
    { id: "u_3", name: "Alex Mercer", email: "alex@stanford.edu", plan: "Premium Squad", joind: "2026-07-03", status: "Active" },
    { id: "u_4", name: "David Kim", email: "kim.d@harvard.edu", plan: "Pro Student", joind: "2026-07-04", status: "Pending" },
  ];

  const triggerRefreshMetrics = () => {
    // Simulate updating logs
    const newLog = {
      time: new Date().toLocaleTimeString(),
      type: "INFO",
      message: "Admin metrics refresh triggered. Recharts cache flushed."
    };
    setLogs([newLog, ...logs.slice(0, 4)]);
    
    confetti({
      particleCount: 40,
      spread: 30,
      colors: ["#6366f1", "#14b8a6"]
    });
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Admin Central Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor API throughput, database efficiency metrics, client logs, and registrations.
          </p>
        </div>
        <button
          onClick={triggerRefreshMetrics}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-350 hover:text-white cursor-pointer transition-all"
        >
          <RefreshCw size={14} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Grid: High Level stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-left">
        <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
            <Cpu size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">API Load</span>
            <span className="text-lg font-extrabold text-white mt-0.5 block">14.2 ms latency</span>
            <span className="text-[9px] text-teal-400 font-semibold mt-0.5 flex items-center gap-0.5">
              <TrendingUp size={9} /> Healthy
            </span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Students</span>
            <span className="text-lg font-extrabold text-white mt-0.5 block">1,840 Users</span>
            <span className="text-[9px] text-purple-400 font-semibold mt-0.5">+48 today</span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400">
            <Database size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">DB Queries</span>
            <span className="text-lg font-extrabold text-white mt-0.5 block">1,540 / min</span>
            <span className="text-[9px] text-teal-400 font-semibold mt-0.5">99.8% cache hits</span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-450">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">System Health</span>
            <span className="text-lg font-extrabold text-white mt-0.5 block">99.98% Uptime</span>
            <span className="text-[9px] text-rose-400 font-semibold mt-0.5">0 Active Outages</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-900 mb-6 gap-2 text-left">
        {["overview", "registrations", "logs"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-xs font-bold capitalize transition-all cursor-pointer border-b-2 -mb-px ${
              activeTab === tab
                ? "border-indigo-500 text-indigo-300 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Overview Graphing */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          {/* Recharts Area Chart */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800/60 shadow-xl">
            <h3 className="text-base font-bold text-white mb-5">Hourly API Request Volume</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={apiRequestsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10, 12, 28, 0.9)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      color: "#fff"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reqs"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReqs)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="lg:col-span-1 glass-panel rounded-3xl p-6 border border-slate-800/60 shadow-xl">
            <h3 className="text-base font-bold text-white mb-5">DB Operation Distribution</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dbPerformanceData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10, 12, 28, 0.9)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      color: "#fff"
                    }}
                  />
                  <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Registrations */}
      {activeTab === "registrations" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl text-left">
          <h3 className="text-base font-bold text-white mb-5">Registered Users Directory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3 text-left">User ID</th>
                  <th className="pb-3 text-left">Student Name</th>
                  <th className="pb-3 text-left">Email Address</th>
                  <th className="pb-3 text-left">Subscription Plan</th>
                  <th className="pb-3 text-left">Registration Date</th>
                  <th className="pb-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40">
                {registeredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-3.5 font-semibold text-slate-500">{user.id}</td>
                    <td className="py-3.5 font-bold text-slate-200">{user.name}</td>
                    <td className="py-3.5">{user.email}</td>
                    <td className="py-3.5 text-indigo-400 font-bold">{user.plan}</td>
                    <td className="py-3.5">{user.joind}</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          user.status === "Active"
                            ? "bg-teal-500/10 border-teal-500/35 text-teal-400"
                            : "bg-amber-500/10 border-amber-500/35 text-amber-400"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Server Logs */}
      {activeTab === "logs" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 bg-slate-950/20 shadow-xl text-left flex flex-col h-[350px]">
          <div className="flex justify-between items-center pb-3 border-b border-slate-900 mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal size={14} className="text-indigo-400" />
              <span>Real-Time Server Console</span>
            </span>
          </div>

          <div className="flex-1 font-mono text-[11px] space-y-2 overflow-y-auto leading-relaxed bg-[#05060b] p-4 rounded-2xl border border-slate-900">
            {logs.map((log, idx) => {
              let typeColor = "text-indigo-400";
              if (log.type === "WARN") typeColor = "text-amber-400";
              if (log.type === "ERROR") typeColor = "text-rose-500";
              return (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-600">[{log.time}]</span>
                  <span className={`font-bold ${typeColor}`}>[{log.type}]</span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
