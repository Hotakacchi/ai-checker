import type { Verdict } from "./types";

/** 判定の見出し。結果画面・共有ページ・OGP画像で共通 */
export const VERDICT_TITLE: Record<Verdict, string> = {
  likely: "AIが使われている可能性が高い",
  possible: "AIが使われている可能性あり",
  faint: "わずかな兆候あり",
  none: "AIの兆候は見つかりませんでした",
};
