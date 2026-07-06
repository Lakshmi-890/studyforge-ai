import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { title, subject, durationMins, sessionType } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();

    // Save the completed study session
    await admin.from("study_sessions").insert({
      user_id: user.id,
      title: title || "Pomodoro Session",
      subject: subject || "General",
      session_type: sessionType || "pomodoro",
      duration_mins: durationMins || 25,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    // Upsert today's analytics row
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await admin
      .from("analytics")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    const newFocusMins = (existing?.focus_mins ?? 0) + durationMins;
    const newSessions = (existing?.sessions_completed ?? 0) + 1;
    const newHours = parseFloat(((newFocusMins) / 60).toFixed(2));

    await admin.from("analytics").upsert(
      {
        user_id: user.id,
        date: today,
        focus_mins: newFocusMins,
        study_hours: newHours,
        sessions_completed: newSessions,
        tasks_completed: existing?.tasks_completed ?? 0,
        productivity_score: Math.min(100, Math.round((newSessions / 4) * 100)),
      },
      { onConflict: "user_id,date" }
    );

    // Update total focus mins on profiles
    await admin
      .from("profiles")
      .update({ total_focus_mins: (existing?.focus_mins ?? 0) + durationMins, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    // Update streak — check yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const { data: yesterdayData } = await admin.from("analytics").select("sessions_completed").eq("user_id", user.id).eq("date", yesterday).single();
    if (yesterdayData || (existing?.sessions_completed === 0 && newSessions === 1)) {
      // Simple streak logic: if studied yesterday too, increment streak
      const { data: profile } = await admin.from("profiles").select("streak_count").eq("id", user.id).single();
      if (profile && newSessions === 1) {
        // First session of the day — increment streak if studied yesterday
        if (yesterdayData) {
          await admin.from("profiles").update({ streak_count: (profile.streak_count ?? 0) + 1 }).eq("id", user.id);
        } else {
          // No session yesterday, reset streak to 1
          await admin.from("profiles").update({ streak_count: 1 }).eq("id", user.id);
        }
      }
    }

    return NextResponse.json({ success: true, focusMins: newFocusMins, sessions: newSessions });
  } catch (error: any) {
    console.error("Session save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
