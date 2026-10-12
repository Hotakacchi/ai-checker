import { FetchBlockedError } from "@/lib/safeFetch";
import { scanUrl } from "@/lib/scanUrl";

export const maxDuration = 30;

// インスタンス単位の簡易レート制限（サーバーレスでは完全ではないが、連打による踏み台化を抑える）
const WINDOW_MS = 60_000;
const LIMIT = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "リクエストが多すぎます。1分ほど待ってから再度お試しください" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url : "";
  if (!url || url.length > 2048) {
    return Response.json({ error: "URLを入力してください" }, { status: 400 });
  }

  try {
    return Response.json(await scanUrl(url));
  } catch (err) {
    // undici は接続時のエラーを "fetch failed" の cause に包んで投げる
    const blocked = err instanceof FetchBlockedError ? err : err instanceof Error && err.cause instanceof FetchBlockedError ? err.cause : null;
    if (blocked) {
      return Response.json({ error: blocked.message }, { status: 400 });
    }
    if (err instanceof TypeError && err.message.includes("Invalid URL")) {
      return Response.json({ error: "URLの形式が正しくありません" }, { status: 400 });
    }
    const message = err instanceof Error && err.name === "TimeoutError" ? "ページの応答がタイムアウトしました" : err instanceof Error ? err.message : "不明なエラー";
    return Response.json({ error: `取得に失敗しました: ${message}` }, { status: 502 });
  }
}
