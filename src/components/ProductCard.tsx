import type { AiStatus, Product, ProductCategory } from "@/data/products";

const STATUS: Record<AiStatus, { text: string; className: string }> = {
  core: { text: "AIが製品の中心", className: "bg-violet-600 text-white" },
  builtin: { text: "AI機能を標準搭載", className: "bg-indigo-500 text-white" },
  optional: { text: "AI機能あり（選択式）", className: "bg-amber-500 text-white" },
};

const CATEGORY: Record<ProductCategory, string> = {
  software: "ソフトウェア",
  hardware: "ハードウェア",
  app: "アプリ",
  web: "Webサービス",
};

export function ProductCard({ product: p }: { product: Product }) {
  const s = STATUS[p.status];
  return (
    <article className="rounded-2xl border border-line bg-surface px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold">{p.name}</h3>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.text}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        {p.maker} ・ {CATEGORY[p.category]}
      </p>
      <p className="mt-3 text-sm leading-relaxed">{p.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.features.map((f) => (
          <span key={f} className="rounded-full border border-line px-2.5 py-0.5 text-xs">
            {f}
          </span>
        ))}
      </div>
      {p.training && (
        <p className="mt-3 rounded-lg bg-background px-3 py-2 text-xs leading-relaxed text-muted">
          <b className="text-foreground">データの学習利用：</b>
          {p.training}
        </p>
      )}
      <p className="mt-3 text-xs text-muted">
        出典：
        {p.sources.map((src, i) => (
          <span key={src.url}>
            {i > 0 && "、"}
            <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
              {src.label}
            </a>
          </span>
        ))}
        （{p.checkedAt} 時点）
      </p>
    </article>
  );
}
