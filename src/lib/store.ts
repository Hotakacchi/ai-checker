import "server-only";
import { Redis } from "@upstash/redis";
import type { ScanResult } from "./types";

/**
 * スキャン結果の保存（共有リンク用）と、同じ URL の再スキャンを省くキャッシュ。
 * Redis の環境変数がなければ何もしない（共有リンクなしで動く）。
 */

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const RESULT_TTL = 60 * 60 * 24 * 90; // 共有リンクは90日
const CACHE_TTL = 60 * 60; // 同じ URL は1時間キャッシュ
const ID_PATTERN = /^[A-Za-z0-9]{10}$/;

export type StoredScan = { id: string; scannedAt: string; result: ScanResult };

function newId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const cacheKey = (scannedUrl: string) => `cache:${scannedUrl.toLowerCase()}`;

export async function getCachedScan(scannedUrl: string): Promise<StoredScan | null> {
  if (!redis) return null;
  try {
    const id = await redis.get<string>(cacheKey(scannedUrl));
    return id ? await getScan(id) : null;
  } catch {
    return null;
  }
}

export async function saveScan(requestedUrl: string, result: ScanResult): Promise<StoredScan | null> {
  if (!redis) return null;
  const stored: StoredScan = { id: newId(), scannedAt: new Date().toISOString(), result };
  try {
    await Promise.all([
      redis.set(`result:${stored.id}`, stored, { ex: RESULT_TTL }),
      // 入力した URL とリダイレクト後の URL の両方でキャッシュを引けるようにする
      redis.set(cacheKey(requestedUrl), stored.id, { ex: CACHE_TTL }),
      redis.set(cacheKey(result.url), stored.id, { ex: CACHE_TTL }),
    ]);
    return stored;
  } catch {
    return null;
  }
}

export async function getScan(id: string): Promise<StoredScan | null> {
  if (!redis || !ID_PATTERN.test(id)) return null;
  try {
    return await redis.get<StoredScan>(`result:${id}`);
  } catch {
    return null;
  }
}
