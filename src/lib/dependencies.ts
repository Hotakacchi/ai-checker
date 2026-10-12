import "server-only";
import { safeFetch } from "./safeFetch";
import type { Finding } from "./types";

/**
 * GitHub リポジトリの依存関係ファイルから AI / 機械学習ライブラリを探す。
 * README の文章より確かな根拠になる。
 */

const AI_PACKAGES: { pattern: RegExp; label: string }[] = [
  { pattern: /^(?:openai|async-openai|github\.com\/(?:sashabaranov\/go-openai|openai\/openai-go))$/i, label: "OpenAI SDK" },
  { pattern: /^(?:@anthropic-ai\/.+|anthropic|github\.com\/anthropics\/.+)$/i, label: "Anthropic (Claude) SDK" },
  { pattern: /^(?:@google\/(?:genai|generative-ai)|google-genai|google-generativeai|google-cloud-aiplatform|@google-cloud\/vertexai)$/i, label: "Google Gemini / Vertex AI SDK" },
  { pattern: /^(?:ai|@ai-sdk\/.+)$/i, label: "Vercel AI SDK" },
  { pattern: /^(?:langchain.*|@langchain\/.+|langgraph.*|@langchain\/langgraph)$/i, label: "LangChain" },
  { pattern: /^(?:llama-?index.*|llamaindex|@llamaindex\/.+)$/i, label: "LlamaIndex" },
  { pattern: /^(?:ollama|cohere(?:-ai)?|mistralai|@mistralai\/.+|groq(?:-sdk)?|replicate|together|litellm|@modelcontextprotocol\/.+|mcp)$/i, label: "LLM API クライアント" },
  { pattern: /^(?:transformers|@huggingface\/.+|@xenova\/transformers|huggingface[-_]hub|sentence-transformers|diffusers|accelerate|peft)$/i, label: "Hugging Face" },
  { pattern: /^(?:torch|torchvision|torchaudio|pytorch-lightning|lightning|tch|candle-core)$/i, label: "PyTorch" },
  { pattern: /^(?:tensorflow(?:-.+)?|@tensorflow\/.+|keras|tf-keras)$/i, label: "TensorFlow / Keras" },
  { pattern: /^(?:onnxruntime.*|onnx|ort)$/i, label: "ONNX Runtime" },
  { pattern: /^(?:scikit-learn|sklearn|xgboost|lightgbm|catboost)$/i, label: "機械学習ライブラリ" },
  { pattern: /^(?:llama[-_]cpp(?:[-_]python)?|node-llama-cpp|@mlc-ai\/web-llm|vllm|ctransformers)$/i, label: "ローカルLLMランタイム" },
  { pattern: /^(?:mediapipe|@mediapipe\/.+|opencv-contrib-python|ultralytics|face[-_]recognition|openai-whisper|whisper|faster-whisper)$/i, label: "画像・音声認識" },
];

type DepFile = { path: string; parse: (body: string) => string[] };

const DEP_FILES: DepFile[] = [
  {
    path: "package.json",
    parse(body) {
      const json = JSON.parse(body) as Record<string, Record<string, string> | undefined>;
      return ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"].flatMap((k) => Object.keys(json[k] ?? {}));
    },
  },
  {
    path: "requirements.txt",
    parse: (body) => [...body.matchAll(/^\s*([A-Za-z0-9_.-]+)/gm)].map((m) => m[1]),
  },
  {
    path: "pyproject.toml",
    // PEP 621 の "name>=1.0" 形式と、Poetry の name = "^1.0" 形式の両方
    parse: (body) => [...body.matchAll(/["']([A-Za-z0-9_.-]+)\s*(?:\[[^\]]*\])?\s*(?:[<>=~!;]|["'])/g), ...body.matchAll(/^([A-Za-z0-9_.-]+)\s*=/gm)].map((m) => m[1]),
  },
  {
    path: "Cargo.toml",
    parse: (body) => [...body.matchAll(/^([A-Za-z0-9_-]+)\s*=/gm)].map((m) => m[1]),
  },
  {
    path: "go.mod",
    parse: (body) => [...body.matchAll(/^\s*(?:require\s+)?([\w.-]+\/[\w./-]+)\s+v/gm)].map((m) => m[1]),
  },
];

/** 依存関係ファイルの中身から AI / ML ライブラリを探す */
export function detectAiPackages(path: string, body: string): { label: string; name: string }[] {
  const file = DEP_FILES.find((f) => f.path === path);
  if (!file) return [];
  let names: string[];
  try {
    names = file.parse(body);
  } catch {
    return [];
  }
  const out: { label: string; name: string }[] = [];
  for (const name of new Set(names)) {
    const pkg = AI_PACKAGES.find((p) => p.pattern.test(name));
    if (pkg) out.push({ label: pkg.label, name });
  }
  return out;
}

export type DependencyCheck = { findings: Finding[]; filesFound: string[]; checked: { url: string; ok: boolean }[] };

/** github.com/{owner}/{repo} 形式の URL からリポジトリを特定する */
export function parseGitHubRepo(url: URL): { owner: string; repo: string } | null {
  const [owner, repo] = url.pathname.split("/").filter(Boolean);
  const reserved = /^(?:features|topics|collections|trending|marketplace|orgs|settings|login|signup|explore|sponsors|about|pricing|enterprise|security|customer-stories|readme|search|notifications|pulls|issues)$/i;
  if (!owner || !repo || reserved.test(owner)) return null;
  return { owner, repo: repo.replace(/\.git$/, "") };
}

export async function checkGitHubDependencies(owner: string, repo: string): Promise<DependencyCheck> {
  const base = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/HEAD/`;
  const results = await Promise.allSettled(DEP_FILES.map((f) => safeFetch(base + f.path)));

  const hits = new Map<string, Finding>();
  const filesFound: string[] = [];
  const checked: DependencyCheck["checked"] = [];

  results.forEach((r, i) => {
    const file = DEP_FILES[i];
    const ok = r.status === "fulfilled" && r.value.status === 200;
    if (!ok) return;
    checked.push({ url: base + file.path, ok });
    filesFound.push(file.path);
    for (const { label, name } of detectAiPackages(file.path, r.value.body)) {
      const existing = hits.get(label);
      const evidence = `${file.path}: ${name}`;
      if (existing) {
        if (existing.evidence.length < 5) existing.evidence.push(evidence);
      } else {
        hits.set(label, { id: `dep:${label}`, label, source: "依存関係", strength: "strong", evidence: [evidence] });
      }
    }
  });

  return { findings: [...hits.values()], filesFound, checked };
}
