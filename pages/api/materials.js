import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import zlib from 'zlib';
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

function ascii85Decode(str) {
  let cleaned = str.trim();
  if (cleaned.startsWith('<~')) cleaned = cleaned.slice(2);
  if (cleaned.endsWith('~>')) cleaned = cleaned.slice(0, -2);
  cleaned = cleaned.replace(/\s+/g, '');

  const bytes = [];
  let i = 0;
  while (i < cleaned.length) {
    const c = cleaned[i];
    if (c === 'z') {
      bytes.push(0, 0, 0, 0);
      i++;
      continue;
    }

    const block = [];
    let count = 0;
    while (count < 5 && i < cleaned.length) {
      block.push(cleaned.charCodeAt(i) - 33);
      count++;
      i++;
    }

    if (count > 0) {
      const padding = 5 - count;
      for (let p = 0; p < padding; p++) {
        block.push(84);
      }

      let val = block[0] * 52200625 + block[1] * 614125 + block[2] * 7225 + block[3] * 85 + block[4];

      const b0 = (val >> 24) & 255;
      const b1 = (val >> 16) & 255;
      const b2 = (val >> 8) & 255;
      const b3 = val & 255;

      if (count === 5) {
        bytes.push(b0, b1, b2, b3);
      } else if (count === 4) {
        bytes.push(b0, b1, b2);
      } else if (count === 3) {
        bytes.push(b0, b1);
      } else if (count === 2) {
        bytes.push(b0);
      }
    }
  }
  return Buffer.from(bytes);
}

function fallbackPdfExtract(buffer) {
  try {
    let extractedText = '';
    const streamStartKeyword = Buffer.from('stream');
    const streamEndKeyword = Buffer.from('endstream');

    let offset = 0;
    while (offset < buffer.length) {
      // Find the next 'stream' keyword
      const streamIdx = buffer.indexOf(streamStartKeyword, offset);
      if (streamIdx === -1) break;

      // Filter out 'endstream' false matches (where 'stream' is preceded by 'end')
      if (streamIdx >= 3 && buffer[streamIdx - 1] === 100 && buffer[streamIdx - 2] === 110 && buffer[streamIdx - 3] === 101) {
        offset = streamIdx + 6;
        continue;
      }

      // The actual stream data starts after 'stream' and a newline (either \r\n or \n)
      let dataStart = streamIdx + 6;
      if (buffer[dataStart] === 13) dataStart++; // \r
      if (buffer[dataStart] === 10) dataStart++; // \n

      // Find the next 'endstream' keyword
      let dataEnd = buffer.indexOf(streamEndKeyword, dataStart);

      // Try decompression with each found 'endstream' boundary to handle false matches
      while (dataEnd !== -1) {
        // Trim trailing \r or \n before 'endstream'
        let actualEnd = dataEnd;
        if (buffer[actualEnd - 1] === 10) actualEnd--;
        if (buffer[actualEnd - 1] === 13) actualEnd--;

        const streamBytes = buffer.slice(dataStart, actualEnd);
        let decompressed = null;

        try {
          decompressed = zlib.inflateSync(streamBytes);
        } catch (err1) {
          try {
            decompressed = zlib.inflateRawSync(streamBytes);
          } catch (err2) {
            try {
              decompressed = zlib.unzipSync(streamBytes);
            } catch (err3) {
              // Raw bytes failed; try ASCII85 decoding first
              try {
                const decodedBytes = ascii85Decode(streamBytes.toString('utf-8'));
                try {
                  decompressed = zlib.inflateSync(decodedBytes);
                } catch (err4) {
                  try {
                    decompressed = zlib.inflateRawSync(decodedBytes);
                  } catch (err5) {
                    try {
                      decompressed = zlib.unzipSync(decodedBytes);
                    } catch (err6) {
                      // Failed completely
                    }
                  }
                }
              } catch (decodeErr) {
                // ASCII85 decode failed
              }
            }
          }
        }

        if (decompressed) {
          const textBlock = decompressed.toString('utf-8');

          // Extract Tj strings: (text) Tj
          const tjRegex = /\(((?:\\[()]|[^)])*)\)\s*(?:Tj|TJ)/g;
          let tjMatch;
          while ((tjMatch = tjRegex.exec(textBlock)) !== null) {
            let s = tjMatch[1].replace(/\\(.)/g, '$1');
            extractedText += s + ' ';
          }

          // Extract TJ array strings: [(text) 10 (text)] TJ
          const tjArrayRegex = /\[((?:\((?:\\[()]|[^)])*\)\s*\d*\s*)+)\]\s*TJ/g;
          let tjArrayMatch;
          while ((tjArrayMatch = tjArrayRegex.exec(textBlock)) !== null) {
            const arrayBlock = tjArrayMatch[1];
            const strRegex = /\(((?:\\[()]|[^)])*)\)/g;
            let strMatch;
            while ((strMatch = strRegex.exec(arrayBlock)) !== null) {
              let s = strMatch[1].replace(/\\(.)/g, '$1');
              extractedText += s + ' ';
            }
          }
          break; // Successfully decompressed this stream!
        }

        // Decompression failed; try next 'endstream'
        dataEnd = buffer.indexOf(streamEndKeyword, dataEnd + 9);
      }

      offset = streamIdx + 6;
    }

    // Final fallback: if nothing was extracted, scan the raw file text for parentheses contents
    if (!extractedText.trim()) {
      const rawText = buffer.toString('binary');
      const parenRegex = /\(([^)]+)\)/g;
      let parenMatch;
      const parts = [];
      while ((parenMatch = parenRegex.exec(rawText)) !== null) {
        let s = parenMatch[1].replace(/\\(.)/g, '$1');
        // Filter out very short or system PDF metadata keys
        if (s.trim().length > 3 && !s.includes('/') && !s.includes('Font')) {
          parts.push(s);
        }
      }
      extractedText = parts.join(' ');
    }

    return extractedText.replace(/[^\x20-\x7E\s]/g, '').replace(/\s+/g, ' ').trim();
  } catch (err) {
    console.error("Buffer-based fallback PDF extraction error:", err);
    return "";
  }
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

  const { supabase, admin } = getSupabaseClients(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

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
        try {
          const pdfData = await pdfParse(dataBuffer);
          text = pdfData.text;
        } catch (pdfErr) {
          console.warn("pdfParse failed, trying fallback extraction:", pdfErr);
          text = fallbackPdfExtract(dataBuffer);
          if (!text || !text.trim()) {
            throw new Error(`Failed to parse PDF (${pdfErr.message || "bad XRef entry"}). The file may be encrypted or corrupted. Try converting it to TXT.`);
          }
        }
      } else {
        text = fs.readFileSync(file.filepath, 'utf8');
      }

      // Clean up temp file
      try {
        fs.unlinkSync(file.filepath);
      } catch { }

      materialId = fields.materialId?.[0] || fields.materialId;
    } else {
      // Parse JSON body manually
      const body = await parseJsonBody(req);
      materialId = body.materialId;

      if (!materialId) {
        throw new Error("Missing materialId in JSON request");
      }

      const { data: material } = await admin.from("materials").select("*").eq("id", materialId).eq("user_id", user.id).single();
      if (!material) {
        throw new Error("Material record not found or unauthorized");
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

      try {
        if (!fs.existsSync('scratch')) {
          fs.mkdirSync('scratch', { recursive: true });
        }
        fs.writeFileSync('scratch/materials_debug.log', `size: ${fileBuffer.length} bytes\nhex: ${fileBuffer.slice(0, 20).toString('hex')}\ntext: ${fileBuffer.slice(0, 500).toString('utf-8')}\n`);
      } catch (logErr) { }

      if (filename.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf') {
        try {
          const pdfData = await pdfParse(fileBuffer);
          text = pdfData.text;
        } catch (pdfErr) {
          console.warn("pdfParse failed, trying fallback extraction:", pdfErr);
          text = fallbackPdfExtract(fileBuffer);
          if (!text || !text.trim()) {
            throw new Error(`Failed to parse PDF (${pdfErr.message || "bad XRef entry"}). The file may be encrypted or corrupted. Try converting it to TXT.`);
          }
        }
      } else {
        text = fileBuffer.toString('utf-8');
      }
    }

    if (!text || !text.trim()) {
      throw new Error("Extracted text is empty");
    }

    // Call Gemini
    const data = await generateContent({
      contents: [{
        role: 'user', parts: [{
          text: `Based ONLY on the following text, generate 5 flashcards with q and a, and 5 MCQs with q, options array of 4, and ans. Return ONLY valid JSON.

Text:
${text.substring(0, 15000)}`
        }]
      }],
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

    // Robust key matching for flashcards
    let flashcards = [];
    if (output.flashcards && Array.isArray(output.flashcards)) {
      flashcards = output.flashcards;
    } else {
      const fcKey = Object.keys(output).find(k => k.toLowerCase().includes('flashcard') || k.toLowerCase().includes('card'));
      if (fcKey && Array.isArray(output[fcKey])) {
        flashcards = output[fcKey];
      } else if (Array.isArray(output)) {
        flashcards = output;
      }
    }

    // Robust key matching for quiz/MCQs
    let mcqs = [];
    if (output.mcqs && Array.isArray(output.mcqs)) {
      mcqs = output.mcqs;
    } else if (output.quiz && Array.isArray(output.quiz)) {
      mcqs = output.quiz;
    } else {
      const quizKey = Object.keys(output).find(k => k.toLowerCase().includes('mcq') || k.toLowerCase().includes('quiz') || k.toLowerCase().includes('question') || k.toLowerCase().includes('test'));
      if (quizKey && Array.isArray(output[quizKey])) {
        mcqs = output[quizKey];
      }
    }

    // Map questions to DB schema
    const flashcardsList = flashcards.map((fc) => ({
      question: fc.question || fc.q || fc.front || fc.Question || fc.frontText || fc.front_text || "",
      answer: fc.answer || fc.a || fc.back || fc.Answer || fc.backText || fc.back_text || "",
    })).filter(fc => fc.question && fc.answer);

    const quizList = mcqs.map((m) => {
      const options = m.options || m.choices || [];
      let correctIndex = 0;
      if (typeof m.ans === 'number') {
        correctIndex = m.ans;
      } else if (typeof m.ans === 'string') {
        const idx = options.indexOf(m.ans);
        if (idx !== -1) correctIndex = idx;
      } else if (typeof m.correct === 'number') {
        correctIndex = m.correct;
      } else if (typeof m.correctAnswer === 'number') {
        correctIndex = m.correctAnswer;
      } else if (typeof m.correctAnswer === 'string') {
        const idx = options.indexOf(m.correctAnswer);
        if (idx !== -1) correctIndex = idx;
      }
      return {
        question: m.question || m.q || m.Question || "",
        options,
        correct: correctIndex,
        explanation: m.explanation || m.exp || ""
      };
    }).filter(q => q.question && q.options.length > 0);

    const summaryText = text ? (text.substring(0, 150).replace(/\r?\n/g, " ") + "...") : "Flashcards and Quiz generated successfully.";

    // Save to DB if materialId exists
    if (materialId) {
      // Verify owner
      const { data: material } = await admin.from("materials").select("id").eq("id", materialId).eq("user_id", user.id).single();
      if (!material) {
        throw new Error("Could not find material or unauthorized");
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
            user_id: user.id,
            material_id: materialId,
            question: fc.question,
            answer: fc.answer,
          }))
        );
      }

      // Save quiz
      if (quizList.length > 0) {
        await admin.from("quizzes").insert({
          user_id: user.id,
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
