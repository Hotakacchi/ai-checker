// ポップアップを開いたときだけ、今のタブの URL を AIチェッカーの API に送って調べる。
// 自動では調べない（閲覧履歴をサーバーに送らないため）。

const SITE = "https://ai-checker-hotakacchi.vercel.app";

const VERDICTS = {
  likely: "AIが使われている可能性が高い",
  possible: "AIが使われている可能性あり",
  faint: "わずかな兆候あり",
  none: "AIの兆候は見つかりませんでした",
};

const TRAINING = {
  used: "学習に使われる可能性あり",
  "not-used": "使わないと明記",
  unknown: "記述なし",
};

const STRENGTH = { strong: "強い", medium: "中", weak: "弱い" };

const $ = (id) => document.getElementById(id);

function show(section) {
  for (const id of ["start", "loading", "error", "result"]) $(id).hidden = id !== section;
}

function showError(message) {
  $("error-message").textContent = message;
  show("error");
}

async function currentTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url ?? "";
}

function render(result) {
  const verdict = $("verdict");
  verdict.className = `verdict v-${result.verdict}`;
  $("verdict-title").textContent = VERDICTS[result.verdict];
  $("score").textContent = result.score;

  if (result.platform) {
    $("platform").textContent = `${result.platform.name}上のページ（内容だけを調べました）`;
    $("platform").hidden = false;
  }

  let training = TRAINING[result.training.status];
  if (result.training.optOut) training += "・オプトアウトあり";
  $("training").textContent = training;

  const list = $("findings");
  list.replaceChildren();
  for (const f of result.findings.filter((f) => f.strength !== "info").slice(0, 5)) {
    const li = document.createElement("li");
    const tag = document.createElement("span");
    tag.className = `tag tag-${f.strength}`;
    tag.textContent = STRENGTH[f.strength];
    const label = document.createElement("span");
    label.textContent = f.label;
    const src = document.createElement("span");
    src.className = "src";
    src.textContent = f.source;
    li.append(tag, label, src);
    list.append(li);
  }

  const details = $("details");
  details.href = result.shareId ? `${SITE}/r/${result.shareId}` : `${SITE}/?url=${encodeURIComponent(result.url)}`;
  details.hidden = false;
  show("result");
}

async function check() {
  const url = await currentTabUrl();
  show("loading");
  try {
    const res = await fetch(`${SITE}/api/scan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) return showError(data.error ?? "エラーが発生しました");
    render(data);
  } catch {
    showError("AIチェッカーに接続できませんでした。");
  }
}

$("details").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: e.currentTarget.href });
});

(async () => {
  const url = await currentTabUrl();
  let host = "";
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") host = u.hostname;
  } catch {
    // chrome:// などは URL として扱わない
  }
  if (!host) {
    showError("このページは調べられません。Webサイトを開いてから使ってください。");
    return;
  }
  $("host").textContent = host;
  $("check").addEventListener("click", check);
})();
