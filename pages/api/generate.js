import { generateContent } from "../../lib/gemini";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const { type, content } = req.body; // type = 'text' or 'topic'
    if (!content || content.length < 3) {
      return res.status(400).json({ error: "Please enter text or topic" });
    }
    
    const PROMPT_FOR_TEXT = `You are an expert teacher and exam creator.
Task: Read the text below and create study material from it ONLY.
Return ONLY valid JSON. Do not add any explanation, markdown, or \`\`\`json blocks.

JSON Format:
{"flashcards": [{"q": "string", "a": "string"}], "mcqs": [{"q": "string", "options": ["string","string","string","string"], "ans": "string"}]}

Rules:
1. Create exactly 10 flashcards from the most important points in the text
2. Create exactly 5 MCQs. Each MCQ must have 4 options and 1 correct answer
3. All questions must be based ONLY on the provided text. Do not use outside knowledge
4. Keep questions clear and exam-level. Answers max 2 lines
5. "ans" field must exactly match one of the 4 options

Text:
"""
${content.substring(0, 12000)}
"""`;

    const PROMPT_FOR_TOPIC = `You are an expert teacher and exam creator.
Task: For the given topic, generate comprehensive study material.
Return ONLY valid JSON. Do not add any explanation, markdown, or \`\`\`json blocks.

JSON Format:
{"flashcards": [{"q": "string", "a": "string"}], "mcqs": [{"q": "string", "options": ["string","string","string","string"], "ans": "string"}]}

Rules:
1. Topic: "${content}"
2. Create exactly 10 flashcards covering definitions, key concepts, and important facts
3. Create exactly 5 MCQs. Each MCQ must have 4 options and 1 correct answer
4. Questions should be standard and cover beginner to intermediate level
5. Make wrong options plausible but clearly incorrect
6. "ans" field must exactly match one of the 4 options`;

    const prompt = type === 'text' ? PROMPT_FOR_TEXT : PROMPT_FOR_TOPIC;
    
    const data = await generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini returned empty response.");
    }
    
    // Robust cleanup fallback if markdown markers are returned
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const output = JSON.parse(cleanedText);

    return res.status(200).json({ status: "success", ...output });
  } catch (error) {
    console.error("API ERROR:", error);
    return res.status(500).json({ error: "AI failed to generate. Try with shorter text." });
  }
}
