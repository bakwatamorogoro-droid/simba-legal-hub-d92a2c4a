// Server-only helper: extract text from PDF/DOCX and score AI-likelihood via Lovable AI Gateway.

export type AiCheckResult = { ai_score: number | null; ai_reason: string | null };

async function extractText(bytes: Uint8Array, fileName: string): Promise<string> {
  const n = fileName.toLowerCase();
  try {
    if (n.endsWith(".pdf")) {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      const t: unknown = text;
      return typeof t === "string" ? t : Array.isArray(t) ? (t as string[]).join("\n") : "";
    }
    if (n.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      // mammoth accepts a Buffer in Node; on Worker we need arrayBuffer
      const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const res = await mammoth.extractRawText({ arrayBuffer: ab });
      return res.value ?? "";
    }
  } catch (e) {
    console.warn("[ai-check] extract failed", (e as Error).message);
  }
  return "";
}

export async function runAiCheck(bytes: Uint8Array, fileName: string): Promise<AiCheckResult> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return { ai_score: null, ai_reason: "AI key haipo" };

  const raw = await extractText(bytes, fileName);
  const text = raw.trim();
  if (text.length < 80) {
    return { ai_score: null, ai_reason: "Maandishi hayakuweza kusomeka" };
  }
  // cap for LLM
  const sample = text.slice(0, 12000);

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an AI-text detector for a student assignment. Respond with JSON ONLY: {\"ai_score\": number 0-100 estimating the probability the text was AI-generated, \"ai_reason\": one short bilingual explanation in the format 'EN: <english sentence> | SW: <sentensi ya Kiswahili>'}. No extra text.",
          },
          { role: "user", content: sample },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      return { ai_score: null, ai_reason: `AI check imeshindwa (${res.status})` };
    }
    const j = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = j.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as { ai_score?: number; ai_reason?: string };
    const score = typeof parsed.ai_score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.ai_score))) : null;
    return { ai_score: score, ai_reason: parsed.ai_reason ?? null };
  } catch (e) {
    return { ai_score: null, ai_reason: `AI check hitilafu: ${(e as Error).message}` };
  }
}
