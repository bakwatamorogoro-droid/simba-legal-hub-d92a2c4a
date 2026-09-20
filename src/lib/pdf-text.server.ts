// Lightweight PDF text extraction for Cloudflare Workers — no external deps.
// Extracts text from content streams (BT/ET blocks with Tj/TJ operators).
// Best-effort: returns "" for scanned/complex PDFs; callers degrade gracefully.

import { inflateSync } from "node:zlib";

function decodePdfString(s: string): string {
  return s
    .replace(/\\([nrtbf()\\])/g, (_, c: string) => {
      const map: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };
      return map[c] ?? c;
    })
    .replace(/\\([0-7]{1,3})/g, (_, oct: string) => String.fromCharCode(parseInt(oct, 8)));
}

function extractFromContent(content: string): string {
  const out: string[] = [];
  const blocks = content.match(/BT[\s\S]*?ET/g) ?? [];
  for (const block of blocks) {
    // (text) Tj  and  [(a) -12 (b)] TJ
    const tj = block.matchAll(/\(((?:\\.|[^\\()])*)\)\s*Tj/g);
    for (const m of tj) out.push(decodePdfString(m[1]!));
    const arrays = block.matchAll(/\[([\s\S]*?)\]\s*TJ/g);
    for (const arr of arrays) {
      const parts = arr[1]!.matchAll(/\(((?:\\.|[^\\()])*)\)/g);
      let line = "";
      for (const p of parts) line += decodePdfString(p[1]!);
      if (line) out.push(line);
    }
    // T* / Td / TD move to a new line
    if (block.match(/(T\*|Td|TD)/)) out.push("\n");
  }
  return out.join(" ").replace(/[ \t]+/g, " ");
}

export function extractPdfText(bytes: Uint8Array): string {
  try {
    const raw = new TextDecoder("latin1").decode(bytes);
    const texts: string[] = [];
    const streamRe = /stream\r?\n/g;
    let m: RegExpExecArray | null;
    while ((m = streamRe.exec(raw)) !== null) {
      const start = m.index + m[0].length;
      const end = raw.indexOf("endstream", start);
      if (end === -1) continue;
      const streamData = raw.slice(start, end).replace(/\r?\n$/, "");
      // Look back for the dictionary to detect /FlateDecode
      const dictStart = raw.lastIndexOf("<<", m.index);
      const dict = dictStart !== -1 ? raw.slice(dictStart, m.index) : "";
      try {
        if (dict.includes("/FlateDecode")) {
          const data = new Uint8Array(streamData.length);
          for (let i = 0; i < streamData.length; i++) data[i] = streamData.charCodeAt(i) & 0xff;
          const inflated = inflateSync(Buffer.from(data));
          texts.push(extractFromContent(inflated.toString("latin1")));
        } else if (dict.includes("/Length")) {
          // Uncompressed content stream
          texts.push(extractFromContent(streamData));
        }
      } catch {
        // skip broken stream
      }
    }
    return texts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  } catch {
    return "";
  }
}
