"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  BrainCircuit,
  BookOpen,
  CalendarRange,
  Zap,
  Timer,
  BarChart3,
  CheckCircle,
  FileText,
  HelpCircle,
  Play,
  Menu,
  X
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      title: "AI Study Planner",
      desc: "Generates tailored daily and weekly study tracks based on your exam date, target grades, and weak areas.",
      icon: CalendarRange,
      color: "text-indigo-400 border-indigo-500/25 bg-indigo-500/5",
    },
    {
      title: "Adaptive Rescheduling",
      desc: "Missed a session? The AI dynamically shifts and redistributes tasks to prevent cognitive overload.",
      icon: BrainCircuit,
      color: "text-purple-400 border-purple-500/25 bg-purple-500/5",
    },
    {
      title: "Document Parsing",
      desc: "Upload PDFs, lecture slides, or images. AI extracts concepts, generating flashcards and practice quizzes instantly.",
      icon: FileText,
      color: "text-teal-400 border-teal-500/25 bg-teal-500/5",
    },
    {
      title: "Context-Aware AI Tutor",
      desc: "Doubt clearing with Socratic questioning to guide you through tough concepts instead of just giving answers.",
      icon: BookOpen,
      color: "text-blue-400 border-blue-500/25 bg-blue-500/5",
    },
    {
      title: "Pomodoro Focus Timer",
      desc: "Tracks your sessions and alerts you when your typing cadence indicates mental fatigue.",
      icon: Timer,
      color: "text-amber-400 border-amber-500/25 bg-amber-500/5",
    },
    {
      title: "Gamified Analytics",
      desc: "Sleek weekly productivity reports, study heatmaps, and streak tracking that awards motivational milestones.",
      icon: BarChart3,
      color: "text-rose-400 border-rose-500/25 bg-rose-500/5",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-slate-100 flex flex-col font-sans select-none">
      {/* Floating Header */}
      <header className="fixed top-4 inset-x-4 max-w-6xl mx-auto h-16 glass-panel rounded-2xl z-50 px-6 flex items-center justify-between border border-slate-800/60 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400 glow-text" />
          </div>
          <span className="font-bold text-lg text-white tracking-wide text-gradient font-sans">
            StudyForge AI
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQs</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-bold text-white border border-purple-500/25 hover:border-pink-405 glow-btn transition-all cursor-pointer"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#090a12]/95 backdrop-blur-md flex flex-col justify-center p-8 animate-in fade-in duration-200">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-lg border border-slate-850 text-slate-400"
          >
            <X size={20} />
          </button>
          <nav className="flex flex-col gap-6 text-lg font-bold text-center text-slate-300 mb-8">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Features</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">FAQs</a>
          </nav>
          <div className="flex flex-col gap-4">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 rounded-xl border border-slate-800 text-center font-bold text-sm hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-center font-bold text-sm text-white"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6 flex flex-col items-center text-center relative z-10 max-w-4xl mx-auto">
        {/* Floating gradient glow behind hero */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-900/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-6 animate-pulse">
          <Zap className="w-3.5 h-3.5 fill-indigo-400" />
          <span>Next-Generation Study Companion</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
          Forge Your Path to Academic Excellence with <span className="text-gradient">StudyForge AI</span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-400 mt-6 max-w-2xl leading-relaxed">
          Unlock an ultra-personalized study tracker. Let AI construct dynamic schedules, process dense textbooks into flashcards, tutor you through complex math, and monitor fatigue—all in a beautifully unified dark interface.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-sm font-bold text-white border border-purple-500/25 hover:border-pink-400 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20 glow-btn transition-all cursor-pointer"
          >
            <span>Get Started Free</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-bold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play size={14} className="fill-slate-400" />
            <span>Interactive Demo</span>
          </Link>
        </div>

        {/* Dashboard Mockup Preview */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-950/65 shadow-2xl p-2 animate-in fade-in slide-in-from-y-12 duration-1000 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-indigo-500/5 rounded-2xl pointer-events-none" />
          <div className="border border-slate-800/40 rounded-xl overflow-hidden glass-panel h-64 sm:h-96 flex flex-col justify-center items-center text-center p-6">
            <div className="p-4 rounded-full bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 mb-4 animate-bounce">
              <BrainCircuit size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Interactive Student dashboard preview</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-2">
              Generate weekly revision plans, track focus streaks, and consult the AI tutor in real-time.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 text-xs text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-1.5"
            >
              <span>Explore Dashboard Demo</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto relative z-10 border-t border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">Full Suite of AI Study Tools</h2>
          <p className="text-xs text-slate-500 mt-2">Everything you need to optimize your study habits and achieve top grades.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="glass-panel glass-panel-hover rounded-2xl p-6 text-left flex flex-col justify-between"
              >
                <div>
                  <div className={`p-3 rounded-xl border w-fit flex items-center justify-center ${feat.color}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-200 mt-5">{feat.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="mt-6 flex items-center text-indigo-400 text-xs font-bold gap-1 cursor-pointer hover:text-indigo-300">
                  <span>Learn more</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </section>



      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto relative z-10 border-t border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 mt-2">Have questions? We have got answers.</p>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 text-left">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>How does the Adaptive Rescheduling algorithm work?</span>
            </h4>
            <p className="text-xs text-slate-400 mt-2 pl-6 leading-relaxed">
              If you miss an assigned study block, our background logic checks your syllabus load and exam deadline, then gently redistributes the outstanding topics across remaining days, keeping daily hours under your preset threshold.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 text-left">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>What formats are supported for document uploads?</span>
            </h4>
            <p className="text-xs text-slate-400 mt-2 pl-6 leading-relaxed">
              We fully support PDFs, DOCX, PPTX, TXT files, and raw lecture screenshots. The AI parses the text and organizes it into revision segments, flashcards, and practice quiz modules.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 text-left">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Is my billing information secured?</span>
            </h4>
            <p className="text-xs text-slate-400 mt-2 pl-6 leading-relaxed">
              Yes, all payment transaction operations are routed through Stripe & Razorpay. We do not store credit card details directly on our servers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center border-t border-slate-900 text-xs text-slate-650 z-10 relative">
        <p className="text-slate-500">&copy; {new Date().getFullYear()} StudyForge AI. All rights reserved. Created for Lakshmi Priya.</p>
      </footer>
    </div>
  );
}
