"use client";

import { useState } from "react";

export function ShareButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${location.origin}/r/${id}`;
    // スマホでは OS の共有シートを使い、使えなければクリップボードにコピー
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch (err) {
        // ユーザーがキャンセルしたときはコピーに切り替えない
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={share} className="rounded-lg border border-line bg-surface px-3 py-1.5 font-medium hover:border-accent">
      {copied ? "リンクをコピーしました" : "結果を共有"}
    </button>
  );
}
