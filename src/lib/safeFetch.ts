import "server-only";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { isIP } from "node:net";
import { Agent, fetch as undiciFetch } from "undici";

/**
 * SSRF 対策付きの fetch。
 * - http/https のみ
 * - 接続時に解決した IP がプライベート/ループバック等なら拒否（DNSリバインディング対策として接続時に検査）
 * - リダイレクトは手動で追い、各ホップを再検査
 * - タイムアウトとサイズ上限
 */

const TIMEOUT_MS = 8000;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const USER_AGENT = "Mozilla/5.0 (compatible; AICheckerBot/0.1; +https://github.com/Hotakacchi/ai-checker)";

export class FetchBlockedError extends Error {}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80") ||
    v6.startsWith("ff")
  );
}

const guardedAgent = new Agent({
  connect: {
    lookup(hostname, options, callback) {
      dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
        if (err) return callback(err, "", 0);
        const list = addresses as unknown as LookupAddress[];
        const bad = list.find((a) => isPrivateAddress(a.address));
        if (bad) return callback(new FetchBlockedError(`内部ネットワークのアドレスにはアクセスできません`), "", 0);
        if ((options as { all?: boolean }).all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, list);
        callback(null, list[0].address, list[0].family);
      });
    },
  },
});

export function normalizeUrl(input: string): URL {
  let raw = input.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchBlockedError("http または https の URL を入力してください");
  }
  if (url.username || url.password) throw new FetchBlockedError("認証情報を含む URL は使えません");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new FetchBlockedError("内部ネットワークのアドレスにはアクセスできません");
  }
  if (isIP(host) && isPrivateAddress(host)) throw new FetchBlockedError("内部ネットワークのアドレスにはアクセスできません");
  return url;
}

/** Content-Type か <meta charset> から文字コードを判定してデコード（Shift_JIS のサイトにも対応） */
function decode(bytes: Buffer, contentType: string): string {
  const fromHeader = contentType.match(/charset=["']?([\w-]+)/i)?.[1];
  const head = bytes.subarray(0, 4096).toString("latin1");
  const fromMeta = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  const charset = (fromHeader ?? fromMeta ?? "utf-8").toLowerCase();
  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
}

export type FetchedPage ={ url: string; status: number; contentType: string; body: string };

export async function safeFetch(input: string | URL): Promise<FetchedPage> {
  let url = typeof input === "string" ? normalizeUrl(input) : normalizeUrl(input.href);
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await undiciFetch(url, {
      dispatcher: guardedAgent,
      redirect: "manual",
      signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5", "accept-language": "ja,en;q=0.8" },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      await res.body?.cancel();
      if (!location) throw new Error("リダイレクト先がありません");
      url = normalizeUrl(new URL(location, url).href);
      continue;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) {
      await res.body?.cancel();
      throw new Error("ページが大きすぎます");
    }

    // サイズ上限まで読み込む
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    const bytes = Buffer.concat(chunks);
    const body = decode(bytes, contentType);
    return { url: url.href, status: res.status, contentType, body };
  }
  throw new Error("リダイレクトが多すぎます");
}
