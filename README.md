# AIチェッカー

ソフトウェア・ハードウェア・アプリ・Webサイトに AI が使われているかを調べる Web サイト。

公開中: https://ai-checker-hotakacchi.vercel.app

## 調べ方

| モード | しくみ | 処理場所 |
| --- | --- | --- |
| Webサイト | ページが読み込むスクリプト・iframe・同一オリジンの JS バンドルから AI サービス／ML ライブラリを検出し、本文・プライバシーポリシー・利用規約・AI ポリシーの記述を解析 | サーバー (`/api/scan`) |
| 製品・アプリ名 | 公式情報をもとにした製品データベースを検索 | ブラウザ |
| 文章を貼り付け | 製品説明や規約の文章から AI 関連の記述を抽出。「使用していません」などの否定文は分けて表示 | ブラウザ（送信しない） |

判定は「可能性が高い / 可能性あり / わずかな兆候 / 兆候なし」の 4 段階。サーバー側だけで動く AI は外から見えないため、「兆候なし」は AI 不使用の証明ではない。

## 構成

- `src/lib/signatures.ts` — 検出ルール（技術シグネチャとキーワード）。検出対象を増やすときはここに追加する
- `src/lib/analyzeText.ts` — 文章解析とスコア計算
- `src/lib/scanUrl.ts` — URL スキャン
- `src/lib/safeFetch.ts` — SSRF 対策付き fetch（プライベート IP 拒否、リダイレクト毎の再検査、タイムアウト、サイズ上限、Shift_JIS 対応）
- `src/data/products.ts` — 製品データベース。追加時は公式の出典を `sources` に必ず入れる

## 開発

```bash
npm install
npm run dev
```

## デプロイ (Vercel)

```bash
vercel          # プレビュー
vercel --prod   # 本番
```

## 今後のアイデア

- 製品情報の投稿フォーム（Vercel KV / Postgres に保存してレビュー）
- Claude API による判定理由の要約（`ANTHROPIC_API_KEY` を設定した場合のみ）
- アプリストアのページ（App Store / Google Play）の解析
- スキャン結果のキャッシュと共有リンク

## コントリビュート

Issue・Pull Request を歓迎します。特に次のような貢献が助かります。

- **製品データの追加・修正**（`src/data/products.ts`）— 公式の発表や製品ページを `sources` に入れてください
- **検出ルールの追加**（`src/lib/signatures.ts`）— 新しい AI チャットボットや ML ライブラリなど
- 誤検出・見逃しの報告 — 対象の URL と期待する結果を Issue に書いてください

## ライセンス

[MIT](LICENSE)
