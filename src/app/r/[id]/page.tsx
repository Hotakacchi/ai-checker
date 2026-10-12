import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ResultView } from "@/components/ResultView";
import { VERDICT_TITLE } from "@/lib/verdicts";
import { getScan } from "@/lib/store";

export async function generateMetadata({ params }: PageProps<"/r/[id]">): Promise<Metadata> {
  const { id } = await params;
  const stored = await getScan(id);
  if (!stored) return { title: "結果が見つかりません — AIチェッカー" };
  const host = new URL(stored.result.url).hostname;
  const title = `${host}：${VERDICT_TITLE[stored.result.verdict]} — AIチェッカー`;
  return { title, description: `${host} に AI が使われているかを調べた結果です。`, openGraph: { title } };
}

export default function SharedResultPage({ params }: PageProps<"/r/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
      <Link href="/" className="text-sm font-medium text-accent">
        ← AIチェッカー
      </Link>
      <Suspense fallback={<p className="mt-8 text-sm text-muted">読み込んでいます…</p>}>
        {params.then(({ id }) => (
          <SharedResult id={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function SharedResult({ id }: { id: string }) {
  const stored = await getScan(id);
  if (!stored) notFound();
  const { result, scannedAt } = stored;
  const date = new Date(scannedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{new URL(result.url).hostname} の判定結果</h1>
      <p className="mt-2 text-sm text-muted">
        {date} に調べた結果です。サイトの内容が変わっている場合があります。
        <Link href={`/?url=${encodeURIComponent(result.url)}`} className="ml-1 font-medium text-accent underline underline-offset-2">
          もう一度調べる
        </Link>
      </p>
      <ResultView result={result} shareId={id} />
    </>
  );
}
