/**
 * 他者のコンテンツを載せているプラットフォーム。
 * これらのサイトでは、スクリプト・ナビゲーション・フッターの規約はプラットフォーム自身のものなので、
 * ページの中身（contentSelector）だけを調べる。
 */
export type Platform = {
  id: string;
  name: string;
  host: RegExp;
  /** ページの中身を表す要素。最初に見つかったものを使う */
  contentSelector: string[];
};

export const PLATFORMS: Platform[] = [
  { id: "github", name: "GitHub", host: /^(?:www\.)?github\.com$/, contentSelector: ["article.markdown-body", "#readme", "main"] },
  { id: "gitlab", name: "GitLab", host: /^(?:www\.)?gitlab\.com$/, contentSelector: [".readme-holder", ".file-content", "main"] },
  { id: "app-store", name: "App Store", host: /^apps\.apple\.com$/, contentSelector: ["main"] },
  { id: "google-play", name: "Google Play", host: /^play\.google\.com$/, contentSelector: ["main", '[role="main"]'] },
  { id: "chrome-web-store", name: "Chrome ウェブストア", host: /^chromewebstore\.google\.com$/, contentSelector: ["main"] },
  { id: "microsoft-store", name: "Microsoft Store", host: /^apps\.microsoft\.com$/, contentSelector: ["main"] },
  { id: "firefox-addons", name: "Firefox Add-ons", host: /^addons\.mozilla\.org$/, contentSelector: ["main", ".Addon"] },
  { id: "steam", name: "Steam", host: /^store\.steampowered\.com$/, contentSelector: ["#game_area_description", ".game_description_snippet", ".page_content"] },
  { id: "npm", name: "npm", host: /^(?:www\.)?npmjs\.com$/, contentSelector: ["#readme", "main"] },
  { id: "pypi", name: "PyPI", host: /^pypi\.org$/, contentSelector: [".project-description", "main"] },
  { id: "youtube", name: "YouTube", host: /^(?:www\.|m\.)?youtube\.com$/, contentSelector: ["#description", "main"] },
  { id: "x", name: "X", host: /^(?:www\.)?(?:x|twitter)\.com$/, contentSelector: ["main"] },
  { id: "note", name: "note", host: /^note\.com$/, contentSelector: ["article", "main"] },
  { id: "qiita", name: "Qiita", host: /^qiita\.com$/, contentSelector: ["article", "main"] },
  { id: "zenn", name: "Zenn", host: /^zenn\.dev$/, contentSelector: ["article", "main"] },
];

export function findPlatform(host: string): Platform | undefined {
  return PLATFORMS.find((p) => p.host.test(host.toLowerCase()));
}
