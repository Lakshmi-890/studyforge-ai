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

    const exam = new Date(examDate);
    const today = new Date();
    
    // Reset hours to start of day
    today.setHours(0,0,0,0);
    exam.setHours(0,0,0,0);
    
    const msDiff = exam.getTime() - today.getTime();
    const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    let weeksDiff = Math.ceil(daysDiff / 7);
    if (weeksDiff <= 0) weeksDiff = 1;
    if (weeksDiff > 52) weeksDiff = 52; // Enforce maximum of 52 weeks

    const formatDate = (date: Date): string => {
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const m = months[date.getMonth()];
      const d = String(date.getDate()).padStart(2, "0");
      return `${m} ${d}`;
    };

    const computedWeeks: any[] = [];
    let currentStart = new Date(today);
    
    for (let w = 1; w <= weeksDiff; w++) {
      let currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 6);
      
      if (w === weeksDiff) {
        currentEnd = new Date(exam);
      }
      
      computedWeeks.push({
        weekNumber: w,
        dateRange: `${formatDate(currentStart)} - ${formatDate(currentEnd)}`,
        startDateStr: currentStart.toISOString(),
        endDateStr: currentEnd.toISOString()
      });
      
      currentStart.setDate(currentStart.getDate() + 7);
    }

    const systemInstruction = `You are an expert AI Study Planner. Output a custom study plan as raw JSON only.
The output MUST match this schema exactly:
{
  "weeks": [
    {
      "weekNumber": 1,
      "dateRange": "JUL 17 - JUL 23",
      "weekGoal": "Weekly Goal Title (e.g. Complete Mechanics - Kinematics + 100 Problems)",
      "tasks": [
        { "title": "Read Kinematics chapter & notes", "type": "Core Study" },
        { "title": "Solve 50 easy/medium problems", "type": "Practice" },
        { "title": "Review formula sheet & active recall", "type": "Review" },
        { "title": "Weak area quiz: Motion in 2D", "type": "Practice" }
      ]
    }
  ]
}

DIFFERENCE IN TOPICS DISTRIBUTION:
- Systematically distribute the subjects: "${subjects}" and weak topics: "${weakTopics}" across exactly ${weeksDiff} weeks.
- Each week MUST have a custom, specific weekGoal (e.g. 'Complete Mechanics - Kinematics + 100 Problems') and exactly 3-4 specific, actionable study tasks.
- For the last 3 weeks before the exam date (or all weeks if the total weeks is less than 3), focus heavily on 'Revision, Mock Exams, and Weak Topic Audits'.
- Return only raw JSON matching the schema. No markdown, no wrapping, no explanations.`;

    const promptText = `Generate a personalized study plan spanning exactly ${weeksDiff} weeks until the target exam date of ${examDate}:
- Exam Date: ${examDate}
- Subjects: ${subjects}
- Target Score: ${targetScore}
- Daily Study Hours: ${studyHours} Hours/Day
- Weak Topics: ${weakTopics}

The date ranges for each week are pre-calculated as follows. You MUST output exactly ${weeksDiff} weeks in the "weeks" array using these exact weekNumbers and dateRanges:
${computedWeeks.map(w => `- Week ${w.weekNumber}: ${w.dateRange}`).join("\n")}`;

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

    // Merge computed weeks date strings into AI's parsed plan
    if (parsedPlan.weeks && Array.isArray(parsedPlan.weeks)) {
      parsedPlan.weeks = parsedPlan.weeks.map((wk: any, idx: number) => {
        const computed = computedWeeks[idx] || {};
        return {
          ...wk,
          dateRange: computed.dateRange || wk.dateRange,
          startDateStr: computed.startDateStr,
          endDateStr: computed.endDateStr
        };
      });
    }

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
