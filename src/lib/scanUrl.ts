import "server-only";
import * as cheerio from "cheerio";
import { findTextSignals, summarize } from "./analyzeText";
import { safeFetch } from "./safeFetch";
import { TECH_SIGNATURES } from "./signatures";
import type { Finding, ScanResult } from "./types";

const MAX_BUNDLES = 6;
const MAX_POLICY_PAGES = 3;

/** ポリシー系ページへのリンクを見分ける。kind は結果表示に使う */
const POLICY_LINKS: { kind: string; pattern: RegExp }[] = [
  { kind: "AIポリシー", pattern: /(?<![a-z])ai(?![a-z])[-_ ]?(?:policy|principles|ethics|ポリシー|方針|倫理)|AI(?:ポリシー|方針|利用|倫理|ガバナンス)|responsible[-_ ]ai/i },
  { kind: "プライバシーポリシー", pattern: /privacy|プライバシー|個人情報/i },
  { kind: "利用規約", pattern: /(?<![a-z])terms|利用規約|ご利用条件|tos(?![a-z])/i },
];

type Haystack = { source: string; value: string };

function matchTech(haystacks: Haystack[]): Finding[] {
  const out = new Map<string, Finding>();
  for (const sig of TECH_SIGNATURES) {
    for (const h of haystacks) {
      const m = h.value.match(sig.pattern);
      if (!m) continue;
      const evidence = h.value.length > 160 ? excerpt(h.value, m.index ?? 0, m[0].length) : h.value;
      const existing = out.get(sig.id);
      if (existing) {
        if (existing.evidence.length < 3 && !existing.evidence.includes(evidence)) existing.evidence.push(evidence);
        continue;
      }
      out.set(sig.id, { id: `tech:${sig.id}`, label: sig.label, source: h.source, strength: sig.strength, evidence: [evidence], note: sig.note });
    }
  }
  return [...out.values()];
}

function excerpt(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + length + 50);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

function visibleText($: cheerio.CheerioAPI): string {
  $("script, style, noscript, template, svg").remove();
  // .text() は要素同士をそのまま連結するので、ブロック要素の後ろに改行を入れて文の区切りを残す
  $("br, p, div, li, dt, dd, h1, h2, h3, h4, h5, h6, td, th, tr, section, article, header, footer, nav, aside, button, a").append("\n");
  const meta = [$('meta[name="description"]').attr("content"), $('meta[property="og:description"]').attr("content")].filter(Boolean).join("\n");
  return `${$("title").text()}\n${meta}\n${$("body").text()}`.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n");
}

export async function scanUrl(input: string): Promise<ScanResult> {
  const page = await safeFetch(input);
  const base = new URL(page.url);
  const pagesChecked: ScanResult["pagesChecked"] = [{ url: page.url, kind: "トップページ", ok: page.status < 400 }];
  if (page.status >= 400) throw new Error(`ページを取得できませんでした (HTTP ${page.status})`);

  const $ = cheerio.load(page.body);
  const title = $("title").first().text().trim() || null;
  const resolve = (href: string | undefined) => {
    if (!href) return null;
    try {
      return new URL(href, base);
    } catch {
      return null;
    }
  };

  // --- 1. 埋め込まれた技術を調べる ---
  const haystacks: Haystack[] = [];
  const bundleUrls: URL[] = [];
  $("script[src]").each((_, el) => {
    const u = resolve($(el).attr("src"));
    if (!u) return;
    haystacks.push({ source: "読み込みスクリプト", value: u.href });
    if (u.host === base.host && bundleUrls.length < MAX_BUNDLES) bundleUrls.push(u);
  });
  $('link[rel="preload"], link[rel="modulepreload"], link[rel="preconnect"], link[rel="dns-prefetch"]').each((_, el) => {
    const u = resolve($(el).attr("href"));
    if (u) haystacks.push({ source: "事前読み込み", value: u.href });
  });
  $("iframe[src]").each((_, el) => {
    const u = resolve($(el).attr("src"));
    if (u) haystacks.push({ source: "埋め込みフレーム", value: u.href });
  });
  $("script:not([src])").each((_, el) => {
    const code = $(el).html();
    if (code && code.length > 20) haystacks.push({ source: "インラインスクリプト", value: code.slice(0, 200_000) });
  });
  // <df-messenger> のようなカスタム要素も対象にする
  haystacks.push({ source: "HTML要素", value: page.body.match(/<[a-z]+-[a-z-]+[\s>]/gi)?.join(" ") ?? "" });

  // 同一オリジンのJSバンドル（ライブラリが同梱されていることがある）
  const bundles = await Promise.allSettled(bundleUrls.map((u) => safeFetch(u)));
  bundles.forEach((r, i) => {
    pagesChecked.push({ url: bundleUrls[i].href, kind: "JavaScript", ok: r.status === "fulfilled" && r.value.status < 400 });
    if (r.status === "fulfilled" && r.value.status < 400) haystacks.push({ source: "JavaScriptバンドル", value: r.value.body });
  });

  const findings: Finding[] = matchTech(haystacks);
  const negated: Finding[] = [];

  // --- 2. ページ本文の記述を調べる ---
  const policyLinks: { kind: string; url: URL }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = `${$(el).text()} ${href}`;
    const u = resolve(href);
    if (!u || !/^https?:$/.test(u.protocol) || u.href === page.url) return;
    const hit = POLICY_LINKS.find((p) => p.pattern.test(text));
    if (hit && !policyLinks.some((p) => p.kind === hit.kind || p.url.href === u.href)) policyLinks.push({ kind: hit.kind, url: u });
  });
  const mainText = findTextSignals(visibleText($), "ページ本文");
  findings.push(...mainText.findings);
  negated.push(...mainText.negated);

  // --- 3. プライバシーポリシー・利用規約・AIポリシーを調べる ---
  const selected = policyLinks.sort((a, b) => POLICY_LINKS.findIndex((p) => p.kind === a.kind) - POLICY_LINKS.findIndex((p) => p.kind === b.kind)).slice(0, MAX_POLICY_PAGES);
  const llmsTxtUrl = new URL("/llms.txt", base);
  const [policies, llmsTxt] = await Promise.all([
    Promise.allSettled(selected.map((p) => safeFetch(p.url))),
    safeFetch(llmsTxtUrl).catch(() => null),
  ]);
  policies.forEach((r, i) => {
    const { kind, url } = selected[i];
    const ok = r.status === "fulfilled" && r.value.status < 400;
    pagesChecked.push({ url: url.href, kind, ok });
    if (!ok) return;
    const signals = findTextSignals(visibleText(cheerio.load(r.value.body)), kind);
    findings.push(...signals.findings);
    negated.push(...signals.negated);
  });

  if (llmsTxt && llmsTxt.status === 200 && /text\/plain|text\/markdown/i.test(llmsTxt.contentType)) {
    pagesChecked.push({ url: llmsTxtUrl.href, kind: "llms.txt", ok: true });
    findings.push({
      id: "info:llms-txt",
      label: "llms.txt を公開",
      source: "llms.txt",
      strength: "info",
      evidence: [llmsTxt.body.slice(0, 120).trim()],
      note: "AIエージェント向けの案内ファイル。サイト自体がAIを使っている証拠ではない",
    });
  }

  return { url: page.url, title, pagesChecked, ...summarize(findings, negated) };
}
