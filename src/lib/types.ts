export type Strength = "strong" | "medium" | "weak" | "info";

export type Finding = {
  id: string;
  label: string;
  /** どこで見つかったか（例: "script src", "プライバシーポリシー"） */
  source: string;
  strength: Strength;
  /** 根拠となる文字列の抜粋 */
  evidence: string[];
  note?: string;
};

export type Verdict = "likely" | "possible" | "faint" | "none";

export type AnalysisResult = {
  verdict: Verdict;
  score: number;
  findings: Finding[];
  /** 否定文の中で見つかった語（例:「AIは使用していません」） */
  negated: Finding[];
};

export type ScanResult = AnalysisResult & {
  url: string;
  title: string | null;
  pagesChecked: { url: string; kind: string; ok: boolean }[];
};
