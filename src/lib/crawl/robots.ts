interface AgentRules {
  agent: string;
  allow: string[];
  disallow: string[];
}

export interface RobotsFile {
  groups: AgentRules[];
  sitemaps: string[];
}

export function parseRobots(body: string): RobotsFile {
  const groups: AgentRules[] = [];
  const sitemaps: string[] = [];
  let current: AgentRules | null = null;
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const split = line.indexOf(":");
    if (split < 0) continue;
    const key = line.slice(0, split).trim().toLowerCase();
    const value = line.slice(split + 1).trim();
    if (key === "user-agent") {
      current = { agent: value.toLowerCase(), allow: [], disallow: [] };
      groups.push(current);
      continue;
    }
    if (key === "sitemap") {
      sitemaps.push(value);
      continue;
    }
    if (!current) continue;
    if (key === "allow") current.allow.push(value);
    if (key === "disallow") current.disallow.push(value);
  }
  return { groups, sitemaps };
}

function matchingGroups(file: RobotsFile, ua: string): AgentRules[] {
  const agent = ua.toLowerCase();
  const specific = file.groups.filter((group) => group.agent !== "*" && agent.includes(group.agent));
  if (specific.length) return specific;
  return file.groups.filter((group) => group.agent === "*");
}

export function robotsAllows(file: RobotsFile, path: string, ua: string): boolean {
  const groups = matchingGroups(file, ua);
  if (!groups.length) return true;
  let winner: { length: number; allow: boolean } | null = null;
  for (const group of groups) {
    for (const rule of group.allow) {
      if (!rule) continue;
      if (path.startsWith(rule) && (!winner || rule.length > winner.length)) winner = { length: rule.length, allow: true };
    }
    for (const rule of group.disallow) {
      if (!rule) continue;
      if (path.startsWith(rule) && (!winner || rule.length > winner.length)) winner = { length: rule.length, allow: false };
    }
  }
  return winner ? winner.allow : true;
}
