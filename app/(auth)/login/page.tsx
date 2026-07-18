"use client";
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const signup = searchParams?.get("signup");
    if (signup === "success") {
      setEmail("");
      setPassword("");
      toast.success("Account created successfully! Please log in.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.refresh();
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#090a12] text-slate-100 flex flex-col justify-center items-center px-4 relative font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl -z-10" />
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-650/30 border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400 glow-text" />
          </div>
          <span className="font-bold text-lg text-white tracking-wide text-gradient font-sans"> StudyForge AI </span>
        </Link>
      </div>
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-800/80 shadow-2xl relative">
        <h2 className="text-xl font-bold text-white text-center">Welcome Back</h2>
        <p className="text-xs text-slate-500 text-center mt-1.5"> Sign in to access your customized schedules &amp; tutor. </p>
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs text-center">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5"> Email Address </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all" required autoComplete="email" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block"> Password </label>
              <Link href="/reset" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"> Forgot? </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-sm font-bold text-white border border-purple-500/25 hover:border-pink-400 glow-btn flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-6 shadow-md shadow-purple-500/10">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            <span>{loading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>
        <p className="mt-8 text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-indigo-400 hover:text-indigo-300">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#090a12] text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}