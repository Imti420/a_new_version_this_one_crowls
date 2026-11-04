import { isDocumentUrl, normalizeUrl } from "./url.ts";

export interface FoundLink {
  url: string;
  text: string;
}

function decode(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/"/gi, '"')
    .replace(/&#39;|'/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractAnchors(html: string, base: string): FoundLink[] {
  const found: FoundLink[] = [];
  const seen = new Set<string>();
  const re = /<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    const raw = match[1] || match[2] || match[3] || "";
    const url = normalizeUrl(raw, base);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    found.push({ url, text: decode(match[4] ?? "").slice(0, 240) });
    if (found.length >= 80) break;
  }
  return found;
}

export function extractFeedUrls(html: string, base: string): string[] {
  const urls: string[] = [];
  const re = /<link\b[^>]*>/gi;
  for (const match of html.matchAll(re)) {
    const tag = match[0] ?? "";
    if (!/type\s*=\s*["']application\/(rss|atom)\+xml["']/i.test(tag)) continue;
    const href = tag.match(/href\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    const url = normalizeUrl(href?.[1] || href?.[2] || "", base);
    if (url) urls.push(url);
  }
  return urls.slice(0, 3);
}

export function extractSitemapLocs(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  for (const match of xml.matchAll(re)) {
    const url = normalizeUrl(match[1] ?? "");
    if (url) urls.push(url);
    if (urls.length >= 200) break;
  }
  return urls;
}

export function looksLikeHtml(contentType: string | null, url: string): boolean {
  if (isDocumentUrl(url)) return false;
  if (!contentType) return true;
  const type = contentType.toLowerCase();
  return type.includes("html") || type.includes("xml") || type.includes("text/");
}
