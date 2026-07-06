const MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-flash-lite"];

export async function generateContent(
  payload: {
    contents: any[];
    systemInstruction?: any;
    generationConfig?: any;
  }
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  let lastError: any = null;

  for (const model of MODELS) {
    let retries = 0;
    const maxRetries = 2; // Try up to 3 times per model

    while (retries <= maxRetries) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          return await response.json();
        }

        const errText = await response.text();
        let errJSON: any = null;
        try {
          errJSON = JSON.parse(errText);
        } catch {}

        const status = response.status;
        const msg = errJSON?.error?.message || errText || "Unknown error";
        
        lastError = new Error(`Gemini API error (${model}, status ${status}): ${msg}`);

        // If it's a 503 (Unavailable) or 429 (Too Many Requests), retry with delay.
        // Otherwise, break to try the next model.
        if (status === 503 || status === 429) {
          retries++;
          if (retries <= maxRetries) {
            const delay = Math.pow(2, retries) * 1000; // 2s, 4s
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }
        break; // Break out of retry loop to try next model
      } catch (e: any) {
        lastError = e;
        retries++;
        if (retries <= maxRetries) {
          const delay = Math.pow(2, retries) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("Failed to generate content from Gemini after trying all models.");
}
