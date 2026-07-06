import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateContent } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { examDate, subjects, studyHours, targetScore, weakTopics } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return NextResponse.json(
        { error: "Gemini API key is not configured. Add GEMINI_API_KEY to .env.local" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const systemInstruction = `You are an expert AI Study Planner. Output a custom study plan as raw JSON only.
The output MUST match this schema exactly:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "sessions": [
        { "time": "09:00 AM", "title": "Specific Topic Session", "type": "Core Study", "dur": "90m" }
      ]
    }
  ],
  "dailySessions": [
    { "time": "09:00 AM - 10:30 AM", "title": "Specific Topic Session", "desc": "Checklist of what to do", "subject": "Subject Name", "type": "Core Study", "status": "Due" }
  ]
}
Focus heavily on weak areas. No explanations. No markdown. Return raw JSON only.`;

    const promptText = `Generate a personalized study plan:
- Exam Date: ${examDate}
- Subjects: ${subjects}
- Target Score: ${targetScore}
- Daily Study Hours: ${studyHours} Hours/Day
- Weak Topics: ${weakTopics}`;

    const data = await generateContent({
      contents: [{ parts: [{ text: promptText }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("No content from Gemini");

    const parsedPlan = JSON.parse(rawText.trim());

    // Save plan to Supabase using admin client (bypasses RLS)
    const admin = createAdminClient();

    // Deactivate old plans
    await admin.from("study_plans").update({ is_active: false }).eq("user_id", user.id);

    // Insert new plan
    const { data: savedPlan, error: saveErr } = await admin
      .from("study_plans")
      .insert({
        user_id: user.id,
        title: `${subjects} — Exam on ${examDate}`,
        subjects,
        exam_date: examDate,
        study_hours: studyHours,
        target_score: targetScore,
        weak_topics: weakTopics,
        plan_json: parsedPlan,
        is_active: true,
      })
      .select()
      .single();

    if (saveErr) console.error("Failed to save plan:", saveErr);

    return NextResponse.json({ ...parsedPlan, planId: savedPlan?.id });
  } catch (error: any) {
    console.error("Planner route error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
