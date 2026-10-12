import { ImageResponse } from "next/og";
import { getScan } from "@/lib/store";
import type { Verdict } from "@/lib/types";
import { VERDICT_TITLE } from "@/lib/verdicts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AIチェッカーの判定結果";

const COLORS: Record<Verdict, { bg: string; fg: string }> = {
  likely: { bg: "#ede9fe", fg: "#4c1d95" },
  possible: { bg: "#fef3c7", fg: "#78350f" },
  faint: { bg: "#e0f2fe", fg: "#0c4a6e" },
  none: { bg: "#d1fae5", fg: "#064e3b" },
};

/** 画像に使う文字だけを含む日本語フォントを Google Fonts から取得する（TTF で返してもらうため UA は付けない） */
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return src ? await (await fetch(src)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stored = await getScan(id);
  const verdict = stored?.result.verdict ?? "none";
  const host = stored ? new URL(stored.result.url).hostname : "";
  const title = stored ? VERDICT_TITLE[verdict] : "結果が見つかりません";
  const score = stored ? String(stored.result.score) : "";
  const brand = "AIチェッカー — そのサービス、AI使ってる？";
  const font = await loadFont(`${host}${title}${score}${brand}/100`);
  const c = COLORS[verdict];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: c.bg, color: c.fg, fontFamily: "NotoSansJP" }}>
        <div style={{ fontSize: 40, opacity: 0.75 }}>{host}</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
          <div style={{ fontSize: 76, lineHeight: 1.2, maxWidth: 820 }}>{title}</div>
          {score && (
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontSize: 160, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 40, opacity: 0.6 }}>/100</span>
            </div>
          )}
        </div>
        <div style={{ fontSize: 32, opacity: 0.7 }}>{brand}</div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "NotoSansJP", data: font, weight: 700 }] : undefined },
  );
}
