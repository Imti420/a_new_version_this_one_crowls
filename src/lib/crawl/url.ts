const MULTI_SUFFIXES = ["ac.bd", "edu.bd", "gov.bd", "com.bd", "org.bd", "net.bd", "mil.bd"];

export function siteKey(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  for (const suffix of MULTI_SUFFIXES) {
    if (host === suffix || host.endsWith(`.${suffix}`)) {
      const parts = host.split(".");
      const suffixParts = suffix.split(".").length;
      if (parts.length <= suffixParts) return host;
      return parts.slice(-(suffixParts + 1)).join(".");
    }
  }
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  return parts.slice(-2).join(".");
}

export function sameSite(a: string, b: string): boolean {
  try {
    return siteKey(new URL(a).hostname) === siteKey(new URL(b).hostname);
  } catch {
    return false;
  }
}

export function normalizeUrl(raw: string, base?: string): string | null {
  try {
    const url = new URL(raw, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (url.port && url.port !== "80" && url.port !== "443") return null;
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
    const full = url.toString();
    if (full.length > 500) return null;
    return full;
  } catch {
    return null;
  }
}

export function isPdfUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

export function isDocumentUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(pdf|docx?|xlsx?|pptx?)$/.test(path);
  } catch {
    return false;
  }
}
