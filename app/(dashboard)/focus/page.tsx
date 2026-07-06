"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import FocusTimer from "@/components/FocusTimer";
import { useRouter } from "next/navigation";

export default function FocusPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        {/* Render the FocusTimer modal, routing back to dashboard when closed */}
        <FocusTimer isOpen={true} onClose={() => router.push("/dashboard")} />
        
        {/* Fallback visual state if the modal overlay is somehow dismissed/hidden */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Focus Session Active</h2>
          <p className="text-sm text-slate-400">Your intelligent Pomodoro session is running.</p>
        </div>
      </div>
    </AppLayout>
  );
}
