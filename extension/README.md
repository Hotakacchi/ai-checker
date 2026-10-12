# AIチェッカー ブラウザ拡張

開いているサイトに AI が使われているかを、ツールバーのボタンから調べる Chrome / Edge 用の拡張機能。

- アイコンを押して「このサイトを調べる」を押したときだけ、そのページの URL を AIチェッカーの API に送る。**自動では調べない**（閲覧履歴をサーバーに送らないため）
- 権限は `activeTab`（押したタブの URL を読む）と、AIチェッカーの API への接続だけ

## インストール（開発版）

1. Chrome で `chrome://extensions` を開く（Edge は `edge://extensions`）
2. 右上の「デベロッパー モード」をオンにする
3. 「パッケージ化されていない拡張機能を読み込む」でこの `extension` フォルダを選ぶ

## アイコンの再生成

```bash
node extension/scripts/make-icons.mjs
```
