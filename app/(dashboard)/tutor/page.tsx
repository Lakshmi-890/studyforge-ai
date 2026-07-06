"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AppLayout from "@/components/AppLayout";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Lightbulb,
  Compass,
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGE: Message = {
  id: "1",
  sender: "ai",
  text: "Hello! I am your Socratic AI Tutor. Rather than just giving you the answers directly, I'll help guide you step-by-step to discover them yourself. What subject or concept are we working on today?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export default function TutorPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load chat history from Supabase on mount
  useEffect(() => {
    const loadHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("chat_history").select("messages_json").eq("user_id", user.id).single();
      if (data?.messages_json && Array.isArray(data.messages_json) && data.messages_json.length > 0) {
        const sanitized = data.messages_json.map((msg: any, idx: number) => ({
          ...msg,
          id: msg.id || `msg-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        }));
        setMessages(sanitized);
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, []);

  const suggestionPrompts = [
    { text: "Explain wave-particle duality simply", subject: "Physics" },
    { text: "Walk me through integration by parts step-by-step", subject: "Calculus" },
    { text: "Test my knowledge on aromatic reactions", subject: "Chemistry" },
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputVal("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to contact Socratic Tutor engine.");
      }

      const aiMsg: Message = {
        id: data.id || `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: "ai",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        sender: "ai",
        text: `⚠️ Error: ${error.message || "Something went wrong."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Socratic Tutor
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Develop true mastery of complex topics through interactive, guided inquiry.
          </p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-12rem)] min-h-[500px]">
        {/* Left column: Suggestions & Philosophy */}
        <div className="lg:col-span-1 flex flex-col gap-6 text-left">
          {/* Socratic philosophy description card */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 relative overflow-hidden bg-indigo-950/5">
            <div className="absolute -top-6 -right-6 p-4 text-indigo-500/10 pointer-events-none">
              <Compass size={80} />
            </div>
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Lightbulb size={14} />
              <span>Socratic Method</span>
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed">
              Instead of giving you raw answers that are easy to forget, this tutor asks guided questions. 
              This exercises your cognitive recall and helps you form deeper mental maps of the subjects.
            </p>
          </div>

          {/* Quick Prompts List */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 flex flex-col flex-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Suggested Topics
            </h3>
            <div className="space-y-3 flex-1">
              {suggestionPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt.text)}
                  disabled={isTyping}
                  className="w-full p-3 rounded-2xl bg-slate-950/20 border border-slate-900 hover:border-slate-800 hover:bg-slate-900/40 text-left transition-all group cursor-pointer disabled:opacity-50"
                >
                  <span className="text-[9px] font-bold text-indigo-400 uppercase block tracking-wider mb-1">
                    {prompt.subject}
                  </span>
                  <span className="text-xs text-slate-200 group-hover:text-white leading-normal block">
                    {prompt.text}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                    Ask Tutor <ArrowRight size={10} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Interactive Chat Interface */}
        <div className="lg:col-span-3 glass-panel rounded-3xl border border-slate-800/60 flex flex-col h-full overflow-hidden shadow-xl bg-slate-950/5 relative">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-800/40 flex justify-between items-center bg-slate-900/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/20 text-indigo-400">
                <Bot size={18} />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Socratic Assistant</span>
                <span className="text-[10px] text-teal-400 font-semibold block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Active Learning Agent
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([
                  {
                    id: Date.now().toString(),
                    sender: "ai",
                    text: "Hello! Let's start fresh. What concept should we work on next?",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  }
                ]);
              }}
              className="p-2 rounded-lg border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-slate-300 transition-all"
              title="Reset Chat"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => {
              const isAI = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    isAI ? "self-start text-left mr-auto" : "self-end flex-row-reverse text-left ml-auto"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isAI
                        ? "bg-indigo-600/15 border-indigo-500/35 text-indigo-400"
                        : "bg-purple-600/15 border-purple-500/35 text-purple-400"
                    }`}
                  >
                    {isAI ? <Bot size={15} /> : <User size={15} />}
                  </div>

                  {/* Bubble */}
                  <div className="space-y-1">
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isAI
                          ? "bg-slate-900/30 border border-slate-900 text-slate-200"
                          : "bg-indigo-600 border border-indigo-500/40 text-white shadow-md shadow-indigo-500/5"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-600 font-semibold block px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%] self-start text-left mr-auto">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/35 text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Bar */}
          <div className="p-4 border-t border-slate-800/40 bg-slate-900/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputVal);
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                placeholder="Ask your tutor anything... (e.g. Help me with integration)"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isTyping}
                className="flex-1 bg-slate-950/40 border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isTyping || !inputVal.trim()}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-400/35 hover:border-indigo-400 glow-btn flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
