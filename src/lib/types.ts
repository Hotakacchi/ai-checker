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

/**
 * 入力・投稿したデータがAIの学習に使われるか。「AIを使っているか」とは別に判定する。
 * used: 使うと書かれている / not-used: 使わないと明記 / unknown: 記述なし
 */
export type TrainingUse = {
  status: "used" | "not-used" | "unknown";
  /** 学習への利用を止める方法（オプトアウト）が書かれているか */
  optOut: boolean;
  evidence: Finding[];
};

export type AnalysisResult = {
  verdict: Verdict;
  score: number;
  findings: Finding[];
  /** 否定文の中で見つかった語（例:「AIは使用していません」） */
  negated: Finding[];
  training: TrainingUse;
};

export type ScanResult = AnalysisResult & {
  url: string;
  title: string | null;
  /** GitHub や App Store など、他者のコンテンツを載せているプラットフォーム上のページ */
  platform: { name: string; isRepository: boolean } | null;
  /** ブログ記事など。AIの話題ではなく、AIで作成したことの開示を重視して判定した */
  isArticle: boolean;
  pagesChecked: { url: string; kind: string; ok: boolean }[];
};
