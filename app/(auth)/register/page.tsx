"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, Lock, User, Target, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import confetti from "canvas-confetti";

export default function RegisterPage() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [goal, setGoal] = useState("GPA 4.0");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, goal },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setSuccess(true);
    confetti({ particleCount: 80, spread: 50, origin: { y: 0.6 } });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#090a12] text-slate-100 flex flex-col justify-center items-center px-4 font-sans">
        <div className="w-full max-w-md glass-panel rounded-3xl p-10 border border-slate-800/80 shadow-2xl text-center">
          <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Check Your Email!</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            We sent a confirmation link to <span className="text-indigo-400 font-semibold">{email}</span>. Click it to activate your StudyForge account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white transition-all"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a12] text-slate-100 flex flex-col justify-center items-center px-4 relative font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl -z-10" />

      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400 glow-text" />
          </div>
          <span className="font-bold text-lg text-white tracking-wide text-gradient font-sans">StudyForge AI</span>
        </Link>
      </div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-800/80 shadow-2xl relative">
        <h2 className="text-xl font-bold text-white text-center">Create Your Account</h2>
        <p className="text-xs text-slate-500 text-center mt-1.5">Join thousands of students studying smarter with AI.</p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs text-center">{errorMsg}</div>
        )}

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type="text" placeholder="Your Full Name" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Core Study Goal</label>
            <div className="relative">
              <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <select value={goal} onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all cursor-pointer">
                <option value="GPA 4.0">Maintain 4.0 GPA</option>
                <option value="Exam Prep">Ace College Exams</option>
                <option value="Certification">Pass IT Certification</option>
                <option value="Self Improvement">Personal Self-Learning</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white border border-indigo-400/35 hover:border-indigo-400 glow-btn flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-6">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            <span>{isLoading ? "Forging Account..." : "Create Account"}</span>
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-indigo-400 hover:text-indigo-300">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
