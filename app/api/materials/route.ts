import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import * as pdfParseModule from "pdf-parse";
import { generateContent } from "@/lib/gemini";

const PDFParse = (pdfParseModule as any).default || (pdfParseModule as any).PDFParse;

// GET: list user's materials
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("materials")
    .select("id, filename, processing_status, summary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: process uploaded material (extract text + generate AI content)
export async function POST(req: Request) {
  let materialId: string | undefined = undefined;
  try {
    const body = await req.json();
    materialId = body.materialId;
    const apiKey = process.env.GEMINI_API_KEY;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();

    // Get material record
    const { data: material } = await admin.from("materials").select("*").eq("id", materialId).single();
    if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

    // Mark as processing
    await admin.from("materials").update({ processing_status: "processing" }).eq("id", materialId);

    // Download file from Supabase Storage
    const { data: fileData } = await admin.storage.from("materials").download(material.storage_path);
    if (!fileData) throw new Error("Failed to download file from storage");

    // Extract text from PDF
    let extractedText = "";
    try {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const parsed = await PDFParse(buffer);
      extractedText = parsed.text.slice(0, 15000); // Limit context to 15k chars
    } catch (e) {
      extractedText = "Text extraction failed. Manual review needed.";
    }

    // Call Gemini to generate summary, flashcards, quiz
    const prompt = `Based on this document content, generate:
1. A concise summary (3-5 sentences)
2. 10 flashcard question-answer pairs
3. 5 multiple-choice quiz questions with 4 options each (mark the correct answer)

Document content:
${extractedText}

Return as raw JSON with this structure:
{
  "summary": "...",
  "flashcards": [{"question": "...", "answer": "..."}],
  "quiz": [{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..."}]
}`;

    let summary = "AI processing complete.";
    let flashcards: any[] = [];
    let quiz: any[] = [];

    if (apiKey) {
      const aiData = await generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
      });
      const rawJson = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        summary = parsed.summary ?? summary;
        flashcards = parsed.flashcards ?? [];
        quiz = parsed.quiz ?? [];
      }
    }

    // Update material with extracted text and summary
    await admin.from("materials").update({
      extracted_text: extractedText,
      summary,
      processing_status: "done",
    }).eq("id", materialId);

    // Save flashcards
    if (flashcards.length > 0) {
      await admin.from("flashcards").insert(
        flashcards.map((fc: any) => ({
          user_id: user.id,
          material_id: materialId,
          question: fc.question,
          answer: fc.answer,
        }))
      );
    }

    // Save quiz
    if (quiz.length > 0) {
      await admin.from("quizzes").insert({
        user_id: user.id,
        material_id: materialId,
        title: `Quiz: ${material.filename}`,
        questions_json: quiz,
      });
    }

    return NextResponse.json({ success: true, summary, flashcardsCount: flashcards.length, quizCount: quiz.length });
  } catch (error: any) {
    console.error("Material process error:", error);
    // Try to mark as error
    try {
      if (materialId) {
        const admin = createAdminClient();
        await admin.from("materials").update({ processing_status: "error" }).eq("id", materialId);
      }
    } catch {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
