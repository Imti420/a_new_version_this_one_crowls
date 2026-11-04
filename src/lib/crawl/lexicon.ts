const TERMS: { phrase: string; weight: number }[] = [
  { phrase: "ভর্তি বিজ্ঞপ্তি", weight: 8 },
  { phrase: "আবেদনের সময়সীমা", weight: 7 },
  { phrase: "ভর্তি পরীক্ষা", weight: 6 },
  { phrase: "প্রবেশপত্র", weight: 5 },
  { phrase: "সংশোধিত", weight: 4 },
  { phrase: "স্থগিত", weight: 4 },
  { phrase: "সময়সূচি", weight: 3 },
  { phrase: "আসন সংখ্যা", weight: 4 },
  { phrase: "ফলাফল", weight: 3 },
  { phrase: "ভর্তি", weight: 4 },
  { phrase: "আবেদন", weight: 3 },
  { phrase: "admission circular", weight: 8 },
  { phrase: "undergraduate admission", weight: 6 },
  { phrase: "admission notice", weight: 6 },
  { phrase: "admission test", weight: 5 },
  { phrase: "admit card", weight: 5 },
  { phrase: "corrigendum", weight: 5 },
  { phrase: "deadline extension", weight: 5 },
  { phrase: "postponed", weight: 4 },
  { phrase: "circular", weight: 4 },
  { phrase: "admission", weight: 3 },
  { phrase: "notice", weight: 1 },
];

export function scoreLink(text: string, url: string): number {
  const hay = `${text} ${url}`.toLowerCase();
  let score = 0;
  for (const term of TERMS) {
    if (hay.includes(term.phrase)) score += term.weight;
  }
  if (url.toLowerCase().includes(".pdf")) score += 2;
  return score;
}

export const FOLLOW_SCORE = 4;
