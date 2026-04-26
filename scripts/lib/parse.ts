import { readFileSync } from "node:fs";
import { parse as parseCsv } from "csv-parse/sync";
import matter from "gray-matter";

export type Email = {
  messageId: string;
  date: string;
  from: { name: string; email: string };
  to: { name: string; email: string }[];
  cc: { name: string; email: string }[];
  subject: string;
  headers: Record<string, string>;
  body: string;
  path: string;
};

const ADDR_RE = /"?([^"<]+?)"?\s*<([^>]+)>/;

function parseAddrList(s: string): { name: string; email: string }[] {
  if (!s) return [];
  const out: { name: string; email: string }[] = [];
  let depth = 0;
  let inQuote = false;
  let cur = "";
  for (const ch of s) {
    if (ch === '"') inQuote = !inQuote;
    else if (!inQuote && ch === "<") depth++;
    else if (!inQuote && ch === ">") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0 && !inQuote) {
      out.push(...parseOne(cur.trim()));
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(...parseOne(cur.trim()));
  return out;
}

function parseOne(s: string): { name: string; email: string }[] {
  const m = s.match(ADDR_RE);
  if (m) return [{ name: m[1].trim(), email: m[2].trim() }];
  if (s.includes("@")) return [{ name: "", email: s.trim() }];
  return [];
}

export function parseEml(path: string): Email {
  if (path.includes("..") || require("path").isAbsolute(path)) throw new Error("Invalid path");
  const raw = readFileSync(path, "utf-8");
  const split = raw.indexOf("\n\n");
  const headerBlock = split === -1 ? raw : raw.slice(0, split);
  const body = split === -1 ? "" : raw.slice(split + 2);

  // Unfold continuation lines (RFC 5322 §2.2.3)
  const unfolded = headerBlock.replace(/\n[ \t]+/g, " ");
  const headers: Record<string, string> = {};
  for (const line of unfolded.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    headers[k.toLowerCase()] = v;
  }

  const messageId = (headers["message-id"] || "").replace(/^<|>$/g, "");
  const fromList = parseAddrList(headers["from"] || "");
  const toList = parseAddrList(headers["to"] || "");
  const ccList = parseAddrList(headers["cc"] || "");

  return {
    messageId,
    date: headers["date"] || "",
    from: fromList[0] || { name: "", email: "" },
    to: toList,
    cc: ccList,
    subject: headers["subject"] || "",
    headers,
    body,
    path,
  };
}

export function parseJsonl<T = unknown>(path: string): T[] {
  if (path.includes('..') || require('path').isAbsolute(path)) {
    throw new Error('Invalid path');
  }
  return readFileSync(path, "utf-8")
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l) as T);
}

export function parseCsvFile<T = Record<string, string>>(path: string): T[] {
  if (path.includes('..') || require('path').isAbsolute(path)) {
    throw new Error('Invalid file path');
  }
  return parseCsv(readFileSync(path, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

export function parseMarkdownDoc(path: string): {
  data: Record<string, unknown>;
  content: string;
} {
  if (path.includes('..') || require('path').isAbsolute(path)) {
    throw new Error('Invalid path');
  }
  const f = matter(readFileSync(path, "utf-8"));
  return { data: f.data as Record<string, unknown>, content: f.content };
}

export type MarkdownChunk = {
  heading: string;
  level: number;
  text: string;
  index: number;
};

/**
 * Split markdown body on H2 (`## `) headings. The first chunk picks up
 * any H1 + preamble. Each chunk text is trimmed and capped at 2000 chars.
 */
export function chunkMarkdownByH2(md: string): MarkdownChunk[] {
  const lines = md.split("\n");
  const chunks: MarkdownChunk[] = [];
  let current: { heading: string; level: number; lines: string[] } = {
    heading: "Preamble",
    level: 1,
    lines: [],
  };
  let idx = 0;
  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (m && m[1].length === 2) {
      if (current.lines.join("").trim()) {
        chunks.push({
          heading: current.heading,
          level: current.level,
          text: current.lines.join("\n").trim().slice(0, 2000),
          index: idx++,
        });
      }
      current = { heading: m[2], level: m[1].length, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.join("").trim()) {
    chunks.push({
      heading: current.heading,
      level: current.level,
      text: current.lines.join("\n").trim().slice(0, 2000),
      index: idx++,
    });
  }
  return chunks;
}

/**
 * Cheap NCCN chunker. Takes raw pdftotext output and splits on lines
 * matching NCCN-style heading codes (BINV-x, BINV-Dx, ST-x, etc).
 */
export function chunkNccnText(text: string): MarkdownChunk[] {
  const lines = text.split("\n");
  const chunks: MarkdownChunk[] = [];
  let current: { heading: string; lines: string[] } = {
    heading: "NCCN front-matter",
    lines: [],
  };
  let idx = 0;
  const HEADING = /^([A-Z]{2,5}-[A-Z0-9]{1,5}(?:\s+\d+\s+OF\s+\d+)?)/;
  for (const line of lines) {
    const m = line.trim().match(HEADING);
    if (m) {
      if (current.lines.join("").trim()) {
        chunks.push({
          heading: current.heading,
          level: 2,
          text: current.lines.join("\n").trim().slice(0, 1200),
          index: idx++,
        });
      }
      current = { heading: m[1], lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.join("").trim()) {
    chunks.push({
      heading: current.heading,
      level: 2,
      text: current.lines.join("\n").trim().slice(0, 1200),
      index: idx++,
    });
  }
  return chunks;
}
