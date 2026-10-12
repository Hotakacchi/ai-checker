import { Checker } from "@/components/Checker";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-sm font-medium text-accent">AIチェッカー</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">そのサービス、AI使ってる？</h1>
        <p className="mt-3 text-muted leading-relaxed">
          Webサイトの URL、製品名、または利用規約・プライバシーポリシーの文章から、AI が使われているかを調べます。
        </p>
      </header>

      <Checker />

      <section className="mt-16 border-t border-line pt-8 text-sm leading-relaxed text-muted">
        <h2 className="mb-3 font-semibold text-foreground">判定のしくみと限界</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <b className="text-foreground">URL</b>：ページに読み込まれている AI 関連のスクリプト（チャットボット、機械学習ライブラリ、AI
            API）と、本文・プライバシーポリシー・利用規約の記述を調べます。
          </li>
          <li>
            <b className="text-foreground">製品名</b>：公式情報をもとにまとめたデータベースから検索します。
          </li>
          <li>
            <b className="text-foreground">文章</b>：AI に関する記述をハイライトします。「AIは使用していません」のような否定文は分けて表示します。
          </li>
          <li>
            サーバー側だけで動く AI は外から見えないため、「兆候なし」は「AI を使っていない」ことの証明ではありません。
          </li>
        </ul>
      </section>
    </main>
  );
}
