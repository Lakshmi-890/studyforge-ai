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
  const [focusTaskName, setFocusTaskName] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [membershipTier, setMembershipTier] = useState<string>("free");
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    const handleStartFocus = (e: Event) => {
      const customEvent = e as CustomEvent<{ taskName: string }>;
      if (customEvent.detail?.taskName) {
        setFocusTaskName(customEvent.detail.taskName);
        setShowTimer(true);
      }
    };
    window.addEventListener("start-focus-session", handleStartFocus);
    return () => {
      window.removeEventListener("start-focus-session", handleStartFocus);
    };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-slate-100 flex font-sans">
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
            <button onClick={() => {
              setFocusTaskName("");
              setShowTimer(true);
            }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold glow-btn cursor-pointer transition-all border border-purple-500/35 hover:border-pink-400 shadow-md shadow-purple-500/10">
              <Timer className="w-4 h-4" />
              <span>Pomodoro</span>
            </button>

            {/* Notifications removed */}

            {/* Membership features disabled */}
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full relative overflow-y-auto">
          {children}
        </main>
      </div>

      {showTimer && <FocusTimer isOpen={showTimer} onClose={() => setShowTimer(false)} initialTaskName={focusTaskName} />}
    </div>
  );
}
