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
  /** blog: 記事を載せるサービス。記事として判定する */
  kind?: "blog";
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
  { id: "note", name: "note", kind: "blog", host: /^note\.com$/, contentSelector: ["article", "main"] },
  { id: "qiita", name: "Qiita", kind: "blog", host: /^qiita\.com$/, contentSelector: ["article", "main"] },
  { id: "zenn", name: "Zenn", kind: "blog", host: /^zenn\.dev$/, contentSelector: ["article", "main"] },

  // --- ブログサービス ---
  { id: "hatena", name: "はてなブログ", kind: "blog", host: /(?:^|\.)(?:hatenablog\.(?:com|jp)|hatena\.blog|hateblo\.jp|hatenadiary\.(?:com|jp|org))$/, contentSelector: [".entry-content", "article", "main"] },
  { id: "ameblo", name: "アメーバブログ", kind: "blog", host: /^(?:s\.)?ameblo\.jp$/, contentSelector: ["#entryBody", '[data-uranus-component="entryBody"]', "article", "main"] },
  { id: "medium", name: "Medium", kind: "blog", host: /(?:^|\.)medium\.com$/, contentSelector: ["article", "main"] },
  { id: "wordpress-com", name: "WordPress.com", kind: "blog", host: /\.wordpress\.com$/, contentSelector: [".entry-content", "article", "main"] },
  { id: "blogger", name: "Blogger", kind: "blog", host: /\.blogspot\.[a-z.]+$/, contentSelector: [".post-body", "article", "main"] },
  { id: "substack", name: "Substack", kind: "blog", host: /(?:^|\.)substack\.com$/, contentSelector: [".available-content", ".body.markup", "article", "main"] },
  { id: "livedoor", name: "ライブドアブログ", kind: "blog", host: /(?:^|\.)(?:livedoor\.(?:blog|jp|biz)|blog\.jp|doorblog\.jp)$/, contentSelector: [".article-body", ".article-body-inner", "article", "main"] },
  { id: "fc2", name: "FC2ブログ", kind: "blog", host: /\.(?:blog\d*\.)?fc2\.com$/, contentSelector: [".entry_body", ".entry-body", ".entry_text", "article", "main"] },
  { id: "seesaa", name: "Seesaaブログ", kind: "blog", host: /\.seesaa\.net$/, contentSelector: [".text", ".article", "article", "main"] },
  { id: "goo-blog", name: "gooブログ", kind: "blog", host: /^blog\.goo\.ne\.jp$/, contentSelector: [".entry-body", "article", "main"] },
  { id: "jugem", name: "JUGEM", kind: "blog", host: /\.jugem\.jp$/, contentSelector: [".entry_body", ".entry", "article", "main"] },
  { id: "exblog", name: "エキサイトブログ", kind: "blog", host: /\.exblog\.jp$/, contentSelector: [".post-main", ".POST_BODY", "article", "main"] },
  { id: "tumblr", name: "Tumblr", kind: "blog", host: /(?:^|\.)tumblr\.com$/, contentSelector: ["article", "main"] },
];

export function findPlatform(host: string): Platform | undefined {
  return PLATFORMS.find((p) => p.host.test(host.toLowerCase()));
}
