import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { generateContent } from '../../lib/gemini';

// Disable default body parser so formidable can process multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Lazy-load Supabase to avoid global pollution conflicts with pdf-parse
function getSupabaseClients(req, res) {
  const { createServerClient } = require("@supabase/ssr");
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          const cookieHeader = req.headers.cookie || "";
          const cookies = [];
          cookieHeader.split(";").forEach(cookie => {
            const parts = cookie.split("=");
            const name = parts[0]?.trim();
            const value = parts.slice(1).join("=").trim();
            if (name) cookies.push({ name, value });
          });
          return cookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieStr = `${name}=${encodeURIComponent(value)}`;
            if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
            if (options.domain) cookieStr += `; Domain=${options.domain}`;
            if (options.path) cookieStr += `; Path=${options.path}`;
            if (options.httpOnly) cookieStr += `; HttpOnly`;
            if (options.secure) cookieStr += `; Secure`;
            if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
            res.appendHeader('Set-Cookie', cookieStr);
          });
        },
      },
    }
  );

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  return { supabase, admin };
}

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => {
      reject(err);
    });
  });
}

export default async function handler(req, res) {
  // Handle GET requests
  if (req.method === 'GET') {
    try {
      const { supabase } = getSupabaseClients(req, res);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { data, error } = await supabase
        .from("materials")
        .select("id, filename, processing_status, summary, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let materialId = undefined;
  let text = "";
  let filename = "";

  try {
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      const form = formidable({ multiples: false });
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });

      const file = files.file?.[0] || files.file;
      if (!file) {
        throw new Error("No file uploaded in form data");
      }

      filename = file.originalFilename || file.name || "document";
      const mimeType = file.mimetype || file.type || "";
      
      if (filename.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(file.filepath);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text;
      } else {
        text = fs.readFileSync(file.filepath, 'utf8');
      }

      // Clean up temp file
      try {
        fs.unlinkSync(file.filepath);
      } catch {}

      materialId = fields.materialId?.[0] || fields.materialId;
    } else {
      // Parse JSON body manually
      const body = await parseJsonBody(req);
      materialId = body.materialId;

      if (!materialId) {
        throw new Error("Missing materialId in JSON request");
      }

      const { admin } = getSupabaseClients(req, res);
      const { data: material } = await admin.from("materials").select("*").eq("id", materialId).single();
      if (!material) {
        throw new Error("Material record not found");
      }

      filename = material.filename;
      const mimeType = material.mime_type;

      // Mark as processing
      await admin.from("materials").update({ processing_status: "processing" }).eq("id", materialId);

      // Download from Storage
      const { data: fileData, error: downloadError } = await admin.storage.from("materials").download(material.storage_path);
      if (downloadError || !fileData) {
        throw new Error(`Failed to download file from storage: ${downloadError?.message || 'No data'}`);
      }

      const fileBuffer = Buffer.from(await fileData.arrayBuffer());

      if (filename.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf') {
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else {
        text = fileBuffer.toString('utf-8');
      }
    }

    if (!text || !text.trim()) {
      throw new Error("Extracted text is empty");
    }

    // Call Gemini
    const data = await generateContent({
      contents: [{ role: 'user', parts: [{ text: `Based ONLY on the following text, generate 5 flashcards with q and a, and 3 MCQs with q, options array of 4, and ans. Return ONLY valid JSON.

Text:
${text.substring(0, 15000)}` }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini returned empty response.");
    }

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
    const flashcards = output.flashcards || [];
    const mcqs = output.mcqs || output.quiz || [];

    // Map questions to DB schema
    const flashcardsList = flashcards.map((fc) => ({
      question: fc.question || fc.q || "",
      answer: fc.answer || fc.a || "",
    }));

    const quizList = mcqs.map((m) => {
      const options = m.options || [];
      let correctIndex = 0;
      if (typeof m.ans === 'number') {
        correctIndex = m.ans;
      } else if (typeof m.ans === 'string') {
        const idx = options.indexOf(m.ans);
        if (idx !== -1) correctIndex = idx;
      } else if (typeof m.correct === 'number') {
        correctIndex = m.correct;
      }
      return {
        question: m.question || m.q || "",
        options,
        correct: correctIndex,
        explanation: m.explanation || ""
      };
    });

    const summaryText = text ? (text.substring(0, 150).replace(/\r?\n/g, " ") + "...") : "Flashcards and Quiz generated successfully.";

    // Save to DB if materialId exists
    if (materialId) {
      const { admin } = getSupabaseClients(req, res);

      // Get user_id of owner
      const { data: material } = await admin.from("materials").select("user_id").eq("id", materialId).single();
      if (!material) {
        throw new Error("Could not find user associated with material");
      }

      // Update material
      await admin.from("materials").update({
        extracted_text: text.slice(0, 15000),
        summary: summaryText,
        processing_status: "done",
      }).eq("id", materialId);

      // Save flashcards
      if (flashcardsList.length > 0) {
        await admin.from("flashcards").insert(
          flashcardsList.map((fc) => ({
            user_id: material.user_id,
            material_id: materialId,
            question: fc.question,
            answer: fc.answer,
          }))
        );
      }

      // Save quiz
      if (quizList.length > 0) {
        await admin.from("quizzes").insert({
          user_id: material.user_id,
          material_id: materialId,
          title: `Quiz: ${filename}`,
          questions_json: quizList,
        });
      }
    }

    return res.status(200).json({ status: "success", summary: summaryText, flashcards: flashcardsList, quiz: quizList });

  } catch (error) {
    console.error("Material process error:", error);

    if (materialId) {
      try {
        const { admin } = getSupabaseClients(req, res);
        await admin.from("materials").update({
          processing_status: "error",
        }).eq("id", materialId);
      } catch (dbErr) {
        console.error("Failed to update status to error in DB:", dbErr);
      }
    }

    return res.status(500).json({ error: error.message || "Failed to process material" });
  }
}
