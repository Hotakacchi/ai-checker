/**
 * AI使用状況がわかっている製品のデータベース。
 * 追加・修正するときは、公式の発表や製品ページを sources に必ず入れること。
 */
export type ProductCategory = "software" | "hardware" | "app" | "web";

/**
 * core: AIが製品の中心
 * builtin: AI機能が標準で組み込まれている
 * optional: AI機能はあるが、オン/オフや追加契約で選べる
 */
export type AiStatus = "core" | "builtin" | "optional";

export type Product = {
  id: string;
  name: string;
  aliases: string[];
  maker: string;
  category: ProductCategory;
  status: AiStatus;
  summary: string;
  features: string[];
  /** 入力データがAIの学習に使われるか（わかる範囲で） */
  training?: string;
  sources: { label: string; url: string }[];
  checkedAt: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    aliases: ["チャットGPT", "チャットジーピーティー"],
    maker: "OpenAI",
    category: "app",
    status: "core",
    summary: "大規模言語モデルを使った対話型AIそのもの。",
    features: ["文章生成", "画像生成", "音声会話", "Web検索"],
    training: "設定の「データコントロール」で、会話をモデル改善に使うかを選べる",
    sources: [{ label: "OpenAI 公式", url: "https://openai.com/chatgpt/" }],
    checkedAt: "2026-10",
  },
  {
    id: "claude",
    name: "Claude",
    aliases: ["クロード"],
    maker: "Anthropic",
    category: "app",
    status: "core",
    summary: "Anthropicが開発した大規模言語モデルと、その対話アプリ。",
    features: ["文章生成", "コード生成", "ファイル分析"],
    sources: [{ label: "Anthropic 公式", url: "https://www.anthropic.com/claude" }],
    checkedAt: "2026-10",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    aliases: ["Gemini", "ジェミニ", "Bard"],
    maker: "Google",
    category: "app",
    status: "core",
    summary: "Googleの生成AIモデルと、その対話アプリ。",
    features: ["文章生成", "画像生成", "Googleサービス連携"],
    sources: [{ label: "Google 公式", url: "https://gemini.google.com/" }],
    checkedAt: "2026-10",
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    aliases: ["Copilot", "コパイロット"],
    maker: "GitHub (Microsoft)",
    category: "software",
    status: "core",
    summary: "エディタ上でコードを提案・生成するAIアシスタント。",
    features: ["コード補完", "チャット", "コードレビュー", "エージェント"],
    sources: [{ label: "GitHub 公式", url: "https://github.com/features/copilot" }],
    checkedAt: "2026-10",
  },
  {
    id: "m365-copilot",
    name: "Microsoft 365 Copilot",
    aliases: ["Word", "Excel", "PowerPoint", "Outlook", "Office", "Microsoft 365", "オフィス"],
    maker: "Microsoft",
    category: "software",
    status: "optional",
    summary: "Word・Excel・PowerPointなどに組み込まれた生成AIアシスタント。プランによって使える範囲が異なる。",
    features: ["文書の下書き・要約", "スライド生成", "データ分析", "メール要約"],
    sources: [{ label: "Microsoft 公式", url: "https://www.microsoft.com/microsoft-365/copilot" }],
    checkedAt: "2026-10",
  },
  {
    id: "windows-11",
    name: "Windows 11",
    aliases: ["Windows", "ウィンドウズ", "Copilot+ PC"],
    maker: "Microsoft",
    category: "software",
    status: "builtin",
    summary: "Copilotアプリが標準搭載。Copilot+ PCではNPUを使ったオンデバイスAI機能も使える。",
    features: ["Copilot", "画像の生成・編集（ペイント／フォト）", "ライブキャプション", "Windows Studio エフェクト（対応PC）"],
    sources: [{ label: "Microsoft 公式", url: "https://www.microsoft.com/windows" }],
    checkedAt: "2026-10",
  },
  {
    id: "iphone",
    name: "iPhone (Apple Intelligence)",
    aliases: ["iPhone", "アイフォン", "Apple Intelligence", "iOS", "Siri", "Mac", "iPad"],
    maker: "Apple",
    category: "hardware",
    status: "builtin",
    summary: "対応機種ではApple Intelligenceによる生成AI機能が使える。写真検索や顔認識など、従来から機械学習も広く使われている。",
    features: ["文章ツール（書き直し・要約）", "通知の要約", "画像生成", "Siri", "写真の被写体認識"],
    training: "Appleは、ユーザーの個人データをモデルの学習に使わないと説明している",
    sources: [{ label: "Apple 公式", url: "https://www.apple.com/apple-intelligence/" }],
    checkedAt: "2026-10",
  },
  {
    id: "pixel",
    name: "Google Pixel",
    aliases: ["Pixel", "ピクセル", "Android"],
    maker: "Google",
    category: "hardware",
    status: "builtin",
    summary: "Gemini（オンデバイスのGemini Nanoを含む）や、AIを使ったカメラ・編集機能を搭載。",
    features: ["Gemini", "消しゴムマジック", "かこって検索", "通話スクリーニング", "レコーダーの文字起こし"],
    sources: [{ label: "Google ストア", url: "https://store.google.com/" }],
    checkedAt: "2026-10",
  },
  {
    id: "galaxy",
    name: "Samsung Galaxy (Galaxy AI)",
    aliases: ["Galaxy", "ギャラクシー", "Galaxy AI", "Samsung", "サムスン"],
    maker: "Samsung",
    category: "hardware",
    status: "builtin",
    summary: "対応機種でGalaxy AIの翻訳・要約・画像編集機能が使える。",
    features: ["リアルタイム通訳", "文字起こし・要約", "生成AIによる写真編集", "かこって検索"],
    sources: [{ label: "Samsung 公式", url: "https://www.samsung.com/galaxy-ai/" }],
    checkedAt: "2026-10",
  },
  {
    id: "photoshop",
    name: "Adobe Photoshop",
    aliases: ["Photoshop", "フォトショップ", "フォトショ", "Adobe Firefly", "Firefly", "Illustrator", "Lightroom"],
    maker: "Adobe",
    category: "software",
    status: "builtin",
    summary: "生成AI「Adobe Firefly」による生成塗りつぶしなどを搭載。被写体選択などにも機械学習が使われている。",
    features: ["生成塗りつぶし", "生成拡張", "被写体を選択", "ニューラルフィルター"],
    training: "Adobeは、Fireflyの学習にAdobe Stockなどの許諾済みコンテンツを使い、ユーザーのCreative Cloudのコンテンツは使わないと説明している",
    sources: [{ label: "Adobe Firefly 公式", url: "https://www.adobe.com/products/firefly.html" }],
    checkedAt: "2026-10",
  },
  {
    id: "canva",
    name: "Canva",
    aliases: ["キャンバ", "キャンバー"],
    maker: "Canva",
    category: "web",
    status: "builtin",
    summary: "AIデザイン機能群「Magic Studio」を搭載。",
    features: ["マジック生成", "マジック消しゴム", "マジック作文", "背景リムーバ"],
    sources: [{ label: "Canva 公式", url: "https://www.canva.com/magic/" }],
    checkedAt: "2026-10",
  },
  {
    id: "notion",
    name: "Notion",
    aliases: ["ノーション", "Notion AI"],
    maker: "Notion Labs",
    category: "software",
    status: "optional",
    summary: "AIアシスタント「Notion AI」で文章作成・要約・検索ができる。",
    features: ["文章作成・要約", "ワークスペース横断のQ&A", "議事録"],
    sources: [{ label: "Notion 公式", url: "https://www.notion.com/product/ai" }],
    checkedAt: "2026-10",
  },
  {
    id: "slack",
    name: "Slack",
    aliases: ["スラック", "Slack AI"],
    maker: "Salesforce",
    category: "software",
    status: "optional",
    summary: "チャンネルやスレッドの要約などができる「Slack AI」を提供。",
    features: ["スレッド・チャンネル要約", "AI検索", "ハドルミーティングのメモ"],
    sources: [{ label: "Slack 公式", url: "https://slack.com/features/ai" }],
    checkedAt: "2026-10",
  },
  {
    id: "zoom",
    name: "Zoom",
    aliases: ["ズーム", "Zoom AI Companion"],
    maker: "Zoom Communications",
    category: "software",
    status: "optional",
    summary: "会議の要約などができる「AI Companion」を提供。管理者・ユーザーがオン/オフできる。",
    features: ["会議の要約", "チャットの下書き", "会議中の質問応答"],
    training: "Zoomは、音声・映像・チャットなどの顧客コンテンツをAIモデルの学習に使わないと説明している",
    sources: [{ label: "Zoom 公式", url: "https://www.zoom.com/" }],
    checkedAt: "2026-10",
  },
  {
    id: "figma",
    name: "Figma",
    aliases: ["フィグマ", "Figma AI", "Figma Make"],
    maker: "Figma",
    category: "web",
    status: "builtin",
    summary: "デザイン生成やレイヤー名の自動変更などのAI機能を搭載。",
    features: ["デザイン・プロトタイプ生成", "画像生成・編集", "レイヤー名の自動変更"],
    sources: [{ label: "Figma 公式", url: "https://www.figma.com/ai/" }],
    checkedAt: "2026-10",
  },
  {
    id: "grammarly",
    name: "Grammarly",
    aliases: ["グラマリー"],
    maker: "Grammarly (Superhuman)",
    category: "software",
    status: "core",
    summary: "AIを使って英文の文法・文体を校正・書き換えするツール。",
    features: ["文法チェック", "書き換え・トーン調整", "生成AIによる文章作成"],
    sources: [{ label: "Grammarly 公式", url: "https://www.grammarly.com/ai" }],
    checkedAt: "2026-10",
  },
  {
    id: "deepl",
    name: "DeepL",
    aliases: ["ディープエル", "DeepL翻訳", "DeepL Write"],
    maker: "DeepL SE",
    category: "web",
    status: "core",
    summary: "ニューラルネットワークによる機械翻訳サービス。",
    features: ["テキスト翻訳", "ファイル翻訳", "文章校正（DeepL Write）"],
    sources: [{ label: "DeepL 公式", url: "https://www.deepl.com/" }],
    checkedAt: "2026-10",
  },
  {
    id: "google-translate",
    name: "Google 翻訳",
    aliases: ["Google Translate", "グーグル翻訳"],
    maker: "Google",
    category: "web",
    status: "core",
    summary: "ニューラル機械翻訳を使った翻訳サービス。",
    features: ["テキスト・音声・画像（カメラ）翻訳"],
    sources: [{ label: "Google 翻訳", url: "https://translate.google.com/" }],
    checkedAt: "2026-10",
  },
  {
    id: "google-search",
    name: "Google 検索",
    aliases: ["Google", "グーグル", "AI Overviews", "AIによる概要", "AIモード"],
    maker: "Google",
    category: "web",
    status: "builtin",
    summary: "検索結果に生成AIによる要約（AIによる概要）が表示される。検索順位の決定にも機械学習が使われている。",
    features: ["AIによる概要", "AIモード", "Googleレンズ"],
    sources: [{ label: "Google 検索について", url: "https://www.google.com/search/howsearchworks/" }],
    checkedAt: "2026-10",
  },
  {
    id: "duolingo",
    name: "Duolingo",
    aliases: ["デュオリンゴ", "Duolingo Max"],
    maker: "Duolingo",
    category: "app",
    status: "builtin",
    summary: "上位プラン「Duolingo Max」で生成AIを使った解説や会話練習ができる。レッスン作成にもAIが使われている。",
    features: ["回答の解説", "ロールプレイ", "ビデオ通話での会話練習"],
    sources: [{ label: "Duolingo ブログ", url: "https://blog.duolingo.com/duolingo-max/" }],
    checkedAt: "2026-10",
  },
  {
    id: "spotify",
    name: "Spotify",
    aliases: ["スポティファイ", "AI DJ"],
    maker: "Spotify",
    category: "app",
    status: "builtin",
    summary: "おすすめ機能に機械学習を使っているほか、生成AIの音声で曲を紹介する「AI DJ」を提供（地域による）。",
    features: ["AI DJ", "AIプレイリスト", "パーソナライズされたおすすめ"],
    sources: [{ label: "Spotify ニュースルーム", url: "https://newsroom.spotify.com/" }],
    checkedAt: "2026-10",
  },
  {
    id: "tesla",
    name: "Tesla (オートパイロット)",
    aliases: ["Tesla", "テスラ", "Autopilot", "FSD"],
    maker: "Tesla",
    category: "hardware",
    status: "builtin",
    summary: "カメラ映像をニューラルネットワークで処理する運転支援システムを搭載。",
    features: ["オートパイロット", "FSD（監視付き）"],
    sources: [{ label: "Tesla 公式", url: "https://www.tesla.com/autopilot" }],
    checkedAt: "2026-10",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    aliases: ["スナップチャット", "My AI"],
    maker: "Snap",
    category: "app",
    status: "builtin",
    summary: "AIチャットボット「My AI」やAIレンズを搭載。",
    features: ["My AI", "AIレンズ"],
    sources: [{ label: "Snapchat サポート", url: "https://help.snapchat.com/" }],
    checkedAt: "2026-10",
  },
  {
    id: "meta-ai",
    name: "Instagram / Facebook / WhatsApp (Meta AI)",
    aliases: ["Instagram", "インスタ", "インスタグラム", "Facebook", "フェイスブック", "WhatsApp", "Messenger", "Meta AI", "Threads"],
    maker: "Meta",
    category: "app",
    status: "builtin",
    summary: "AIアシスタント「Meta AI」を搭載（地域による）。フィードのおすすめにも機械学習が使われている。",
    features: ["Meta AI", "AIによる画像編集", "おすすめフィード"],
    sources: [{ label: "Meta AI", url: "https://www.meta.ai/" }],
    checkedAt: "2026-10",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    aliases: ["ミッドジャーニー"],
    maker: "Midjourney",
    category: "web",
    status: "core",
    summary: "テキストから画像・動画を生成するAIサービス。",
    features: ["画像生成", "動画生成"],
    sources: [{ label: "Midjourney 公式", url: "https://www.midjourney.com/" }],
    checkedAt: "2026-10",
  },
];

const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[\s・\-_()（）]/g, "");

/** 製品名・別名・メーカー名であいまい検索 */
export function searchProducts(query: string): Product[] {
  const q = norm(query);
  if (!q) return [];
  const scored = PRODUCTS.map((p) => {
    const names = [p.name, ...p.aliases].map(norm);
    let score = 0;
    if (names.some((n) => n === q)) score = 100;
    else if (names.some((n) => n.startsWith(q))) score = 60;
    else if (names.some((n) => n.includes(q) || (q.length >= 3 && q.includes(n)))) score = 40;
    else if (norm(p.maker).includes(q)) score = 20;
    return { p, score };
  }).filter((x) => x.score > 0);
  return scored.sort((a, b) => b.score - a.score).map((x) => x.p);
}
