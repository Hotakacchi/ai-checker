"use client";

import { useMemo, useState } from "react";
import { analyzeText } from "@/lib/analyzeText";
import type { AnalysisResult, ScanResult } from "@/lib/types";
import { searchProducts } from "@/data/products";
import { ProductCard } from "./ProductCard";
import { ResultView } from "./ResultView";

type Mode = "url" | "product" | "text";

const TABS: { mode: Mode; label: string; hint: string }[] = [
  { mode: "url", label: "Webサイト", hint: "URLを入力すると、埋め込まれた技術とポリシーを調べます" },
  { mode: "product", label: "製品・アプリ名", hint: "ソフト・ハード・アプリの名前で検索します" },
  { mode: "text", label: "文章を貼り付け", hint: "製品説明・利用規約・プライバシーポリシーなど" },
];

export function Checker() {
  const [mode, setMode] = useState<Mode>("url");

  return (
    <div>
      <div role="tablist" className="mb-4 flex gap-1 rounded-xl bg-line/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.mode}
            role="tab"
            aria-selected={mode === t.mode}
            onClick={() => setMode(t.mode)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === t.mode ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mb-4 text-sm text-muted">{TABS.find((t) => t.mode === mode)!.hint}</p>

      {mode === "url" && <UrlChecker onPaste={() => setMode("text")} />}
      {mode === "product" && <ProductSearch onScanUrl={() => setMode("url")} />}
      {mode === "text" && <TextChecker />}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";
const buttonClass =
  "shrink-0 rounded-xl bg-accent px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50";

function UrlChecker({ onPaste }: { onPaste: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; canPaste: boolean } | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ message: data.error ?? "エラーが発生しました", canPaste: Boolean(data.canPaste) });
        return;
      }
      setResult(data);
    } catch {
      setError({ message: "通信エラーが発生しました", canPaste: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          className={inputClass}
          type="text"
          inputMode="url"
          placeholder="example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="調べるURL"
        />
        <button className={buttonClass} disabled={loading || !url.trim()}>
          {loading ? "調べています…" : "調べる"}
        </button>
      </form>
      {loading && <p className="mt-6 text-sm text-muted">ページ・スクリプト・ポリシーを取得しています。10秒ほどかかることがあります。</p>}
      {error && (
        <div className="mt-6 rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          <p>{error.message}</p>
          {error.canPaste && (
            <p className="mt-2">
              ボット対策などで取得できないサイトがあります。ページの本文をコピーして
              <button onClick={onPaste} className="mx-1 font-medium underline underline-offset-2">
                「文章を貼り付け」で調べる
              </button>
              こともできます。
            </p>
          )}
        </div>
      )}
      {result && <ResultView result={result} />}
    </>
  );
}

function ProductSearch({ onScanUrl }: { onScanUrl: () => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchProducts(query), [query]);

  return (
    <>
      <input
        className={inputClass}
        type="search"
        placeholder="例: iPhone、Photoshop、Notion"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="製品名"
        autoFocus
      />
      <div className="mt-6 space-y-4">
        {results.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {query.trim() && results.length === 0 && (
          <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            「{query}」はまだデータベースにありません。
            <br />
            公式サイトがあれば
            <button onClick={onScanUrl} className="mx-1 font-medium text-accent underline underline-offset-2">
              URLで調べる
            </button>
            か、利用規約の文章を貼り付けて調べられます。
          </div>
        )}
      </div>
    </>
  );
}

function TextChecker() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  return (
    <>
      <textarea
        className={`${inputClass} min-h-48 resize-y leading-relaxed`}
        placeholder="製品説明・利用規約・プライバシーポリシーの文章を貼り付けてください"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="調べる文章"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">{text.length.toLocaleString()} 文字（文章はブラウザ内で処理され、送信されません）</span>
        <button className={buttonClass} disabled={!text.trim()} onClick={() => setResult(analyzeText(text))}>
          調べる
        </button>
      </div>
      {result && <ResultView result={result} />}
    </>
  );
}
