import type { AnalysisResult, Finding, ScanResult, Strength, Verdict } from "@/lib/types";

const VERDICTS: Record<Verdict, { title: string; body: string; tone: string }> = {
  likely: {
    title: "AIが使われている可能性が高い",
    body: "AIサービスやAI関連の明確な記述が見つかりました。",
    tone: "border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100",
  },
  possible: {
    title: "AIが使われている可能性あり",
    body: "AI機能を持つサービスや、AIに関係する記述が見つかりました。実際に使われているかは確認が必要です。",
    tone: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  },
  faint: {
    title: "わずかな兆候あり",
    body: "AIと関係するかもしれない語が見つかりましたが、決め手にはなりません。",
    tone: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100",
  },
  none: {
    title: "AIの兆候は見つかりませんでした",
    body: "外から見える範囲には見つかりませんでした。サーバー側でAIを使っている可能性は残ります。",
    tone: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
};

const STRENGTH_LABEL: Record<Strength, { text: string; className: string }> = {
  strong: { text: "強い根拠", className: "bg-violet-600 text-white" },
  medium: { text: "中程度", className: "bg-amber-500 text-white" },
  weak: { text: "弱い", className: "bg-line text-foreground" },
  info: { text: "参考", className: "bg-line text-muted" },
};

export function ResultView({ result }: { result: AnalysisResult | ScanResult }) {
  const v = VERDICTS[result.verdict];
  const scan = "url" in result ? result : null;

  return (
    <div className="mt-8 space-y-6">
      <div className={`rounded-2xl border px-5 py-5 ${v.tone}`}>
        {scan && (
          <p className="mb-2 truncate text-sm opacity-80">
            {scan.title ? `${scan.title} — ` : ""}
            {scan.url}
          </p>
        )}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{v.title}</h2>
            <p className="mt-1 text-sm leading-relaxed opacity-90">{v.body}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tabular-nums">{result.score}</div>
            <div className="text-xs opacity-70">/ 100</div>
          </div>
        </div>
      </div>

      {scan?.platform && (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
          <b className="text-foreground">{scan.platform.name}</b> 上のページです。{scan.platform.name}
          自体のスクリプトや規約ではなく、ページに載っている内容
          {scan.platform.isRepository && "（README と依存関係ファイル）"}
          だけを調べました。
        </p>
      )}

      {scan?.isArticle && (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
          <b className="text-foreground">記事ページ</b>
          として判定しました。記事に AI の話題が出てくるだけでは弱い根拠とし、「AIで作成した」など AI を使って作ったことを明かす記述を重視しています。
        </p>
      )}

      {result.findings.length > 0 && (
        <section>
          <h3 className="mb-3 font-semibold">見つかった根拠（{result.findings.length}件）</h3>
          <ul className="space-y-3">
            {result.findings.map((f) => (
              <FindingItem key={f.id} finding={f} />
            ))}
          </ul>
        </section>
      )}

      {result.negated.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold">否定文の中の記述</h3>
          <p className="mb-3 text-sm text-muted">「使用していません」などの否定文で見つかった語です。スコアには含めていません。</p>
          <ul className="space-y-3">
            {result.negated.map((f) => (
              <FindingItem key={f.id} finding={f} muted />
            ))}
          </ul>
        </section>
      )}

      {scan && (
        <details className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium">調べたページ（{scan.pagesChecked.length}件）</summary>
          <ul className="mt-3 space-y-1.5">
            {scan.pagesChecked.map((p) => (
              <li key={p.url} className="flex gap-2">
                <span className={p.ok ? "text-emerald-600" : "text-red-500"}>{p.ok ? "✓" : "✗"}</span>
                <span className="shrink-0 text-muted">{p.kind}</span>
                <span className="truncate">{p.url}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function FindingItem({ finding, muted }: { finding: Finding; muted?: boolean }) {
  const s = STRENGTH_LABEL[finding.strength];
  return (
    <li className={`rounded-xl border border-line bg-surface px-4 py-3 ${muted ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        {!muted && <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.text}</span>}
        <span className="font-medium">{finding.label}</span>
        <span className="text-xs text-muted">{finding.source}</span>
      </div>
      {finding.note && <p className="mt-1 text-sm text-muted">{finding.note}</p>}
      <ul className="mt-2 space-y-1">
        {finding.evidence.map((e, i) => (
          <li key={i} className="break-all rounded-md bg-background px-2.5 py-1.5 font-mono text-xs leading-relaxed text-muted">
            {e}
          </li>
        ))}
      </ul>
    </li>
  );
}
