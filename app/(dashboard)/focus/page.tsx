"use client";
import React from "react";
import AppLayout from "@/components/AppLayout";
import FocusTimer from "@/components/FocusTimer";
import { useRouter } from "next/navigation";

export default function FocusPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <FocusTimer
        isOpen={true}
        onClose={() => router.push("/dashboard")}
      />
    </AppLayout>
  );
}