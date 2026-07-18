"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarRange, CheckSquare, MessageSquare,
  UploadCloud, CreditCard, ShieldAlert, LogOut, ChevronLeft,
  ChevronRight, Sparkles, Flame, Loader2, Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateStreak } from "@/lib/streak";

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

export default function Sidebar({ onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; membership_tier: string; streak_count: number } | null>(null);

  useEffect(() => {
    const fetchProfileAndStreak = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, tasksRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, membership_tier")
          .eq("id", user.id)
          .single(),
        supabase
          .from("tasks")
          .select("status, updated_at")
          .eq("user_id", user.id)
      ]);

      const computedStreak = tasksRes.data ? calculateStreak(tasksRes.data) : 0;

      if (profileRes.data) {
        setProfile({
          full_name: profileRes.data.full_name || "",
          membership_tier: profileRes.data.membership_tier || "free",
          streak_count: computedStreak
        });
      }
    };
    fetchProfileAndStreak();
  }, [supabase]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onToggle) onToggle(newState);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const sidebarItems = [
    { id: "dashboard", name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { id: "planner", name: "AI Planner", path: "/planner", icon: CalendarRange },
    { id: "tasks", name: "Tasks & Kanban", path: "/tasks", icon: CheckSquare },
    { id: "tutor", name: "AI Tutor Chat", path: "/tutor", icon: MessageSquare },
    { id: "materials", name: "Study Materials", path: "/materials", icon: UploadCloud },
    { id: "focus", name: "Focus Session", path: "/focus", icon: Clock },
  ];

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const tierColor: Record<string, string> = {
    free: "bg-slate-500/25 border-slate-500/45 text-slate-300",
    pro: "bg-purple-500/25 border-purple-500/45 text-purple-300",
    premium: "bg-amber-500/25 border-amber-500/45 text-amber-300",
  };
  const tier = "free";

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"} glass-panel border-r border-slate-800/80 flex flex-col justify-between`}>
      <div>
        {/* Header Logo */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/40">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-indigo-600/35 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400 glow-text" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg text-white tracking-wide text-gradient font-sans transition-opacity duration-200">StudyForge AI</span>
            )}
          </Link>
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/80 text-slate-400 hover:text-white transition-all">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Streak Banner */}
        <div className="p-3 border-b border-slate-800/40">
          <div className="flex items-center gap-3 bg-indigo-950/20 border border-indigo-900/20 rounded-xl p-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/35 text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
              <Flame className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left">
                <span className="text-xs text-slate-400 font-semibold leading-none">STREAK</span>
                <span className="text-sm font-bold text-amber-400">{profile?.streak_count ?? 0} Days 🔥</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 flex-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${isActive ? "bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500" : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/40 border-l-2 border-transparent"}`}>
                <Icon size={18} className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800/40">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/30 border border-slate-800/50 overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shrink-0">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate">{profile?.full_name ?? "Loading..."}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={handleLogout} disabled={isLoggingOut}
              className="p-1.5 rounded-lg border border-slate-800/80 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all shrink-0 disabled:opacity-50 cursor-pointer"
              title="Logout">
              {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
