import { describe, expect, it } from "vitest";
import { PRODUCTS, searchProducts } from "@/data/products";
import { detectAiPackages, parseGitHubRepo } from "@/lib/dependencies";
import { findPlatform } from "@/lib/platforms";
import { isPrivateAddress, normalizeUrl } from "@/lib/safeFetch";

describe("SSRF 対策", () => {
  it.each(["127.0.0.1", "10.0.0.1", "172.16.5.4", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"])(
    "%s はプライベートアドレス",
    (ip) => expect(isPrivateAddress(ip)).toBe(true),
  );

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700::1111"])("%s は公開アドレス", (ip) => expect(isPrivateAddress(ip)).toBe(false));

  it.each(["localhost", "http://foo.localhost", "file:///etc/passwd", "http://user:pass@example.com", "http://127.0.0.1:3000", "http://[::1]/"])(
    "%s は拒否する",
    (url) => expect(() => normalizeUrl(url)).toThrow(),
  );

  it("スキームがなければ https を補う", () => {
    expect(normalizeUrl("example.com").href).toBe("https://example.com/");
  });
});

describe("プラットフォーム", () => {
  it.each([
    ["github.com", "github"],
    ["staff.hatenablog.com", "hatena"],
    ["ameblo.jp", "ameblo"],
    ["foo.medium.com", "medium"],
    ["example.blogspot.com", "blogger"],
    ["apps.apple.com", "app-store"],
  ])("%s → %s", (host, id) => expect(findPlatform(host)?.id).toBe(id));

  it("普通のサイトはプラットフォームではない", () => {
    expect(findPlatform("www.notion.com")).toBeUndefined();
  });

  it("GitHub のリポジトリ URL を読み取る", () => {
    expect(parseGitHubRepo(new URL("https://github.com/Hotakacchi/ai-checker?tab=readme-ov-file"))).toEqual({ owner: "Hotakacchi", repo: "ai-checker" });
    expect(parseGitHubRepo(new URL("https://github.com/features/copilot"))).toBeNull();
  });
});

describe("依存関係", () => {
  const names = (path: string, body: string) => detectAiPackages(path, body).map((d) => d.name);

  it("package.json", () => {
    const body = JSON.stringify({ dependencies: { next: "16", openai: "5", "@anthropic-ai/sdk": "1" }, devDependencies: { ai: "5" } });
    expect(names("package.json", body).sort()).toEqual(["@anthropic-ai/sdk", "ai", "openai"]);
  });

  it("AIと関係ない依存関係は拾わない", () => {
    expect(names("package.json", JSON.stringify({ dependencies: { react: "19", aiohttp: "1", "said-hi": "1" } }))).toEqual([]);
  });

  it("requirements.txt", () => {
    expect(names("requirements.txt", "flask==3.0\ntorch>=2.0\n# comment\nscikit-learn\n").sort()).toEqual(["scikit-learn", "torch"]);
  });

  it("pyproject.toml（PEP 621 と Poetry）", () => {
    const body = '[project]\ndependencies = ["requests>=2", "langchain-core>=0.3"]\n\n[tool.poetry.dependencies]\ntransformers = "^4"\n';
    expect(names("pyproject.toml", body).sort()).toEqual(["langchain-core", "transformers"]);
  });

  it("go.mod", () => {
    expect(names("go.mod", "module x\n\nrequire (\n\tgithub.com/sashabaranov/go-openai v1.0.0\n)\n")).toEqual(["github.com/sashabaranov/go-openai"]);
  });

  it("壊れた package.json でも落ちない", () => {
    expect(names("package.json", "{not json")).toEqual([]);
  });
});

describe("製品データベース", () => {
  it("別名やカタカナでも検索できる", () => {
    expect(searchProducts("iphone")[0]?.id).toBe("iphone");
    expect(searchProducts("フォトショ")[0]?.id).toBe("photoshop");
  });

  it("すべての製品に https の出典がある", () => {
    for (const p of PRODUCTS) {
      expect(p.sources.length, p.id).toBeGreaterThan(0);
      for (const s of p.sources) expect(s.url, p.id).toMatch(/^https:\/\//);
    }
  });

  it("ID が重複していない", () => {
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length);
  });
});
