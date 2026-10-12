import { beforeEach, describe, expect, it, vi } from "vitest";

// ネットワークに出ずに、URL ごとに用意した HTML を返す
const pages = new Map<string, { status?: number; contentType?: string; body: string }>();
vi.mock("@/lib/safeFetch", () => ({
  safeFetch: vi.fn(async (input: string | URL) => {
    let url = typeof input === "string" ? input : input.href;
    if (!/^https?:/.test(url)) url = `https://${url}`;
    url = new URL(url).href;
    const page = pages.get(url);
    if (!page) return { url, status: 404, contentType: "text/html", body: "" };
    return { url, status: page.status ?? 200, contentType: page.contentType ?? "text/html", body: page.body };
  }),
}));

const { scanUrl } = await import("@/lib/scanUrl");

beforeEach(() => pages.clear());

describe("URL スキャン", () => {
  it("AIチャットボットの埋め込みを検出する", async () => {
    pages.set("https://shop.example/", {
      body: `<html><head><title>Shop</title><script src="https://www.chatbase.co/embed.min.js"></script></head><body>ようこそ</body></html>`,
    });
    const r = await scanUrl("shop.example");
    expect(r.verdict).toBe("likely");
    expect(r.findings[0].label).toBe("Chatbase");
  });

  it("プライバシーポリシーをたどって学習利用を判定する", async () => {
    pages.set("https://app.example/", { body: `<body><a href="/privacy">プライバシーポリシー</a></body>` });
    pages.set("https://app.example/privacy", { body: `<body><p>お客様の入力内容はAIの学習に利用する場合があります。設定からオプトアウトできます。</p></body>` });
    const r = await scanUrl("app.example");
    expect(r.training.status).toBe("used");
    expect(r.training.optOut).toBe(true);
    expect(r.pagesChecked.map((p) => p.kind)).toContain("プライバシーポリシー");
  });

  it("GitHub ではプラットフォームの規約やメニューを調べない", async () => {
    pages.set("https://github.com/someone/todo-app", {
      body: `<html><head><title>someone/todo-app</title></head><body>
        <header>GitHub Copilot — AI-powered developer platform</header>
        <article class="markdown-body"><h1>todo-app</h1><p>シンプルなTODOアプリです。</p></article>
        <footer><a href="https://docs.github.com/site-policy/privacy">Privacy</a><a href="https://docs.github.com/terms">Terms</a></footer>
      </body></html>`,
    });
    pages.set("https://docs.github.com/site-policy/privacy", { body: "<body>machine learning artificial intelligence</body>" });
    pages.set("https://raw.githubusercontent.com/someone/todo-app/HEAD/package.json", {
      contentType: "text/plain",
      body: JSON.stringify({ dependencies: { react: "19" } }),
    });

    const r = await scanUrl("https://github.com/someone/todo-app");
    expect(r.platform?.name).toBe("GitHub");
    expect(r.verdict).toBe("none");
    expect(r.pagesChecked.some((p) => p.url.includes("docs.github.com"))).toBe(false);
    expect(r.findings.map((f) => f.label)).toContain("依存関係に AI ライブラリは見つかりませんでした");
  });

  it("GitHub リポジトリの依存関係から AI ライブラリを検出する", async () => {
    pages.set("https://github.com/someone/bot", { body: `<body><article class="markdown-body">Discord bot</article></body>` });
    pages.set("https://raw.githubusercontent.com/someone/bot/HEAD/requirements.txt", { contentType: "text/plain", body: "discord.py\nopenai>=1\n" });
    const r = await scanUrl("https://github.com/someone/bot");
    expect(r.verdict).toBe("likely");
    expect(r.findings[0].label).toBe("OpenAI SDK");
  });

  it("ブログ記事では AI の話題を弱い根拠にし、開示を重視する", async () => {
    pages.set("https://someone.hatenablog.com/entry/1", {
      body: `<body><div class="entry-content"><p>ChatGPTを使ってみた感想です。機械学習ってすごい。</p></div><footer><a href="https://policies.hatena.ne.jp/privacypolicy">プライバシーポリシー</a></footer></body>`,
    });
    const topic = await scanUrl("https://someone.hatenablog.com/entry/1");
    expect(topic.isArticle).toBe(true);
    expect(topic.verdict).not.toBe("likely");
    expect(topic.pagesChecked).toHaveLength(1);

    pages.set("https://someone.hatenablog.com/entry/2", {
      body: `<body><div class="entry-content"><p>この記事はChatGPTを使って作成しました。</p></div></body>`,
    });
    const disclosed = await scanUrl("https://someone.hatenablog.com/entry/2");
    expect(disclosed.verdict).toBe("likely");
  });

  it("取得できないページはエラーにする", async () => {
    await expect(scanUrl("missing.example")).rejects.toThrow("HTTP 404");
  });
});
