"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset/update`,
    });

    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg(`Password recovery link sent to ${email}. Check your inbox!`);
    }
  };

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
        <h2 className="text-xl font-bold text-white text-center">Reset Password</h2>
        <p className="text-xs text-slate-500 text-center mt-1.5">
          Enter your registered email address to recover your account credentials.
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs text-center">{errorMsg}</div>
        )}

        {successMsg ? (
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs text-center leading-normal">
              {successMsg}
            </div>
            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white border border-indigo-400/35 hover:border-indigo-400 glow-btn flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-6"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              <span>{isLoading ? "Sending Link..." : "Send Reset Link"}</span>
            </button>

            <Link
              href="/login"
              className="w-full py-3 rounded-xl border border-slate-800/80 hover:bg-slate-900/30 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-center gap-2 transition-all mt-4"
            >
              <ArrowLeft size={14} />
              <span>Cancel &amp; Sign In</span>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
