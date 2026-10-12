import { describe, expect, it } from "vitest";
import { analyzeText } from "@/lib/analyzeText";

/** 検出ルールを変えたときに壊れていないかを確かめる例。誤判定の報告を受けたら、ここに例を足していく */
const labelsOf = (text: string) => analyzeText(text).findings.map((f) => f.label);

describe("AI使用の判定", () => {
  it.each([
    ["当社は生成AIを活用したチャットボットを提供します。", "likely"],
    ["本サービスは機械学習を用いて不正利用を検知します。", "likely"],
    ["Our AI-powered assistant answers your questions.", "likely"],
    ["The AI workspace that works for you.", "likely"],
    ["Notion AI で議事録をまとめられます。", "possible"],
    ["画像認識で商品を探せます。", "possible"],
    ["AI", "faint"],
    ["おすすめアルゴリズムで表示順を決めています。", "faint"],
    ["本製品は職人がひとつずつ手作りしています。", "none"],
  ])("%s → %s", (text, verdict) => {
    expect(analyzeText(text).verdict).toBe(verdict);
  });

  it("弱い根拠だけを積み重ねても「可能性あり」にしない", () => {
    expect(analyzeText("AI。AI。おすすめアルゴリズム。自動翻訳。").verdict).toBe("faint");
  });

  it("同名の別物があるモデル名は中程度の根拠にとどめる", () => {
    const r = analyzeText("ふたご座（Gemini）の運勢");
    expect(r.findings.find((f) => f.label.startsWith("AIモデル・アシスタント名"))?.strength).toBe("medium");
  });
});

describe("否定文", () => {
  it.each([
    "この記事はAIを使用せずに書いています。",
    "本製品はAIを使用していません。",
    "We do not use AI-powered tools in our products.",
  ])("%s は否定文として扱う", (text) => {
    const r = analyzeText(text);
    expect(r.verdict).toBe("none");
    expect(r.negated.length).toBeGreaterThan(0);
  });

  it("否定文の判定は同じ文の中だけ", () => {
    const r = analyzeText("AIは使用していません。ただし、問い合わせ対応には生成AIを活用しています。");
    expect(r.findings.map((f) => f.label)).toContain("生成AI");
  });
});

describe("AIで作成したことの開示", () => {
  it.each([
    "この記事はChatGPTを使って作成しました。",
    "※本記事の画像は生成AIで作成しています。",
    "This article was written with the help of AI.",
    "AIが書いた文章です。",
  ])("%s", (text) => {
    expect(labelsOf(text)).toContain("AIで作成したことの開示");
  });

  it("AIを使ってみた感想は開示ではない", () => {
    expect(labelsOf("ChatGPTを使ってみた感想を書きます。")).not.toContain("AIで作成したことの開示");
  });
});

describe("データの学習利用", () => {
  it("学習に使うと書かれていれば used", () => {
    const r = analyzeText("お客様の入力内容はAIの学習に利用する場合があります。");
    expect(r.training.status).toBe("used");
  });

  it("使わないと明記されていれば not-used", () => {
    const r = analyzeText("We do not use your content to train our models.");
    expect(r.training.status).toBe("not-used");
  });

  it("記述がなければ unknown", () => {
    expect(analyzeText("生成AIで画像を作れます。").training.status).toBe("unknown");
  });

  it("オプトアウトの記述を拾う（否定形の文でも）", () => {
    const r = analyzeText("設定からオプトアウトすれば、会話はモデルの学習に使用されません。");
    expect(r.training.optOut).toBe(true);
  });

  it("学習利用はAI使用のスコアに含めない", () => {
    const r = analyzeText("お客様のデータをAIの学習に利用することがあります。");
    expect(r.findings.some((f) => f.id.endsWith(":training"))).toBe(false);
  });
});
