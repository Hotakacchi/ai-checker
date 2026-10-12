import type { Verdict } from "./types";

export const REPO_URL = "https://github.com/Hotakacchi/ai-checker";

const VERDICT_TEXT: Record<Verdict, string> = {
  likely: "可能性が高い",
  possible: "可能性あり",
  faint: "わずかな兆候",
  none: "兆候なし",
};

/** GitHub Issue フォーム（.github/ISSUE_TEMPLATE）を、項目を埋めた状態で開く URL */
function issueFormUrl(template: string, title: string, fields: Record<string, string>): string {
  const params = new URLSearchParams({ template, title, ...fields });
  return `${REPO_URL}/issues/new?${params}`;
}

export function wrongResultUrl(opts: { target: string; verdict: Verdict; score: number; mode: "url" | "text" }): string {
  return issueFormUrl("wrong-result.yml", `誤判定: ${opts.target}`, {
    target: opts.target,
    actual: `${VERDICT_TEXT[opts.verdict]}（${opts.score}点）`,
    mode: opts.mode === "url" ? "Webサイト（URL）" : "文章を貼り付け",
  });
}

export function addProductUrl(name: string): string {
  return issueFormUrl("add-product.yml", `製品の追加: ${name}`, { name });
}
