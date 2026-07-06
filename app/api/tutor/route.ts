import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateContent } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
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

    // Format conversation for Gemini
    const contents = messages.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const data = await generateContent({
      contents,
      systemInstruction: {
        parts: [{
          text: "You are a Socratic AI Tutor. Rather than directly giving answers, guide the student step-by-step with brief, constructive questions to help them discover concepts themselves. Keep responses friendly, concise, and focused on active learning.",
        }],
      },
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
    });

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Let me rephrase that. What aspect is most confusing?";

    // Save updated chat history to Supabase
    const aiMsgId = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const allMessages = [
      ...messages,
      {
        id: aiMsgId,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    const admin = createAdminClient();
    await admin.from("chat_history").upsert(
      { user_id: user.id, messages_json: allMessages, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    return NextResponse.json({ text: replyText, id: aiMsgId });
  } catch (error: any) {
    console.error("Tutor route error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
