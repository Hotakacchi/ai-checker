import { NEGATION_PATTERN, STRENGTH_WEIGHT, TEXT_KEYWORDS } from "./signatures";
import type { AnalysisResult, Finding, TrainingUse, Verdict } from "./types";

const SNIPPET_RADIUS = 40;
const MAX_SNIPPETS = 3;

/** マッチ位置を含む1文を切り出す（否定文の判定用） */
function sentenceAround(text: string, index: number, length: number): string {
  const boundary = /[。．.!?！？\n]/;
  // 区切りのない長い文でも判定が広がりすぎないよう、前後150文字までに制限する
  const MAX = 150;
  let start = index;
  while (start > 0 && index - start < MAX && !boundary.test(text[start - 1])) start--;
  let end = index + length;
  while (end < text.length && end - index < MAX && !boundary.test(text[end])) end++;
  return text.slice(start, end + 1);
}

function snippetAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(text.length, index + length + SNIPPET_RADIUS);
  const body = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${body}${end < text.length ? "…" : ""}`;
}

/** 文章中のAI関連の記述を探す。source は結果表示用のラベル */
export function findTextSignals(text: string, source: string): { findings: Finding[]; negated: Finding[] } {
  const normalized = text.normalize("NFKC");
  const findings: Finding[] = [];
  const negated: Finding[] = [];

  for (const kw of TEXT_KEYWORDS) {
    const positive: string[] = [];
    const negative: string[] = [];
    for (const m of normalized.matchAll(new RegExp(kw.pattern.source, kw.pattern.flags.includes("g") ? kw.pattern.flags : kw.pattern.flags + "g"))) {
      const idx = m.index ?? 0;
      const sentence = sentenceAround(normalized, idx, m[0].length);
      const bucket = NEGATION_PATTERN.test(sentence) ? negative : positive;
      if (bucket.length < MAX_SNIPPETS) bucket.push(snippetAround(normalized, idx, m[0].length));
    }
    const base = { id: `${source}:${kw.id}`, label: kw.label, source, strength: kw.strength, note: kw.note };
    if (positive.length) findings.push({ ...base, evidence: positive });
    if (negative.length) negated.push({ ...base, evidence: negative });
  }
  return { findings, negated };
}

/**
 * 発見事項からスコアと判定を出す。
 * 同じ種類のシグナルが複数の場所で見つかっても、加点は最初の1回だけ（重み付けの水増しを防ぐ）。
 */
export function summarize(allFindings: Finding[], allNegated: Finding[]): AnalysisResult {
  // 学習利用の記述は「AIを使っているか」のスコアから切り離して、別に判定する
  const isTraining = (f: Finding) => /:(?:training|optout)$/.test(f.id);
  const findings = allFindings.filter((f) => !isTraining(f));
  const negated = allNegated.filter((f) => !isTraining(f));
  const trainingYes = allFindings.filter((f) => f.id.endsWith(":training"));
  const trainingNo = allNegated.filter((f) => f.id.endsWith(":training"));
  // オプトアウトの文は「使わないようにできる」と否定形になりやすいので、否定文の中のものも数える
  const optOut = [...allFindings, ...allNegated].filter((f) => f.id.endsWith(":optout"));
  const training: TrainingUse = {
    status: trainingYes.length ? "used" : trainingNo.length ? "not-used" : "unknown",
    optOut: optOut.length > 0,
    evidence: [...trainingYes, ...trainingNo.map((f) => ({ ...f, label: "AIの学習に使わないとの記述" })), ...optOut],
  };

  const counted = new Set<string>();
  let score = 0;
  for (const f of findings) {
    const kind = f.id.split(":").pop()!;
    if (counted.has(kind)) continue;
    counted.add(kind);
    score += STRENGTH_WEIGHT[f.strength];
  }
  score = Math.min(100, score);

  const hasStrong = findings.some((f) => f.strength === "strong");
  let verdict: Verdict;
  if (hasStrong && score >= 30) verdict = "likely";
  // 弱い根拠をいくら積み重ねても「可能性あり」にはしない
  else if (score >= 12 && findings.some((f) => f.strength === "medium" || f.strength === "strong")) verdict = "possible";
  else if (score > 0) verdict = "faint";
  else verdict = "none";

  const order = { strong: 0, medium: 1, weak: 2, info: 3 };
  findings.sort((a, b) => order[a.strength] - order[b.strength]);
  return { verdict, score, findings, negated, training };
}

export function analyzeText(text: string, source = "入力テキスト"): AnalysisResult {
  const { findings, negated } = findTextSignals(text, source);
  return summarize(findings, negated);
}
