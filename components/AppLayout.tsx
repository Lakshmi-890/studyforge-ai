"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import FocusTimer from "./FocusTimer";
import { Timer, Bell, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Toaster } from "react-hot-toast";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [membershipTier, setMembershipTier] = useState<string>("free");
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !active) return;

      // Load notifications
      setLoadingNotifs(true);

      const { data: notifs, error: notifError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!active) return;

      if (!notifError && notifs) {
        setNotifications(notifs);
      }

      setLoadingNotifs(false);

      // Membership features are disabled. Users default to "free" tier.

      // Create unique realtime subscription to avoid conflicts in StrictMode
      const channelName = `notifications-${user.id}-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [
              payload.new as any,
              ...prev,
            ]);
          }
        )
        .subscribe();
    };

    fetchData();

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
    setNotifications([]);
  };

  const activeNotifCount = notifications.filter((n) => !n.read).length;

  const tierBadge: Record<string, string> = {
    free: "bg-slate-500/10 border-slate-500/30 text-slate-300",
    pro: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    premium: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  };

  return (
    <div className="min-h-screen bg-[#090a12] text-slate-100 flex font-sans">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e1b4b', color: '#fff', border: '1px solid #312e81' } }} />
      <Sidebar onToggle={(state) => setCollapsed(state)} />

      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${collapsed ? "pl-20" : "pl-64"}`}>
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/40 glass-panel sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-400">Workspace</span>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-sm font-bold text-slate-200 glow-text">Student Central</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Pomodoro */}
            <button onClick={() => setShowTimer(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/25 hover:border-indigo-500/40 text-indigo-400 text-xs font-semibold glow-btn cursor-pointer transition-all">
              <Timer className="w-4 h-4" />
              <span>Pomodoro</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 transition-all cursor-pointer relative">
                {loadingNotifs ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
                {activeNotifCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              </button>
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 glass-panel border border-slate-800 rounded-xl shadow-2xl p-4 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/40 mb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                    <button onClick={markAllRead} className="text-[10px] text-slate-500 hover:text-indigo-400 cursor-pointer">Mark all read</button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">No new notifications</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="p-2 rounded-lg bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-xs font-bold text-indigo-400">{notif.title}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Membership features disabled */}
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full relative overflow-y-auto">
          {children}
        </main>
      </div>

      {showTimer && <FocusTimer isOpen={showTimer} onClose={() => setShowTimer(false)} />}
    </div>
  );
}
