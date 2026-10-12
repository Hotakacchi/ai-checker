import type { Strength } from "./types";

/**
 * Webページに埋め込まれたスクリプト・iframe・インラインコードから検出する技術シグネチャ。
 * pattern は script src / iframe src / インラインスクリプト / カスタム要素名に対して照合する。
 */
export type TechSignature = {
  id: string;
  label: string;
  strength: Strength;
  pattern: RegExp;
  note?: string;
};

export const TECH_SIGNATURES: TechSignature[] = [
  // --- LLM API を直接呼んでいる ---
  { id: "openai-api", label: "OpenAI API", strength: "strong", pattern: /api\.openai\.com|cdn\.platform\.openai\.com/i },
  { id: "anthropic-api", label: "Anthropic (Claude) API", strength: "strong", pattern: /api\.anthropic\.com/i },
  { id: "gemini-api", label: "Google Gemini API", strength: "strong", pattern: /generativelanguage\.googleapis\.com/i },
  { id: "hf-inference", label: "Hugging Face", strength: "strong", pattern: /api-inference\.huggingface\.co|router\.huggingface\.co|\.hf\.space/i },

  // --- ブラウザ内で動く機械学習ランタイム ---
  { id: "tfjs", label: "TensorFlow.js", strength: "strong", pattern: /@tensorflow\/tfjs|tfjs(?:-core)?(?:\.min)?\.js|tf\.min\.js/i },
  { id: "onnx-web", label: "ONNX Runtime Web", strength: "strong", pattern: /onnxruntime-web|ort(?:\.webgpu|\.wasm)?\.min\.js/i },
  { id: "transformers-js", label: "Transformers.js", strength: "strong", pattern: /@(?:huggingface|xenova)\/transformers/i },
  { id: "mediapipe", label: "MediaPipe", strength: "strong", pattern: /@mediapipe\/|mediapipe.*\.js/i },
  { id: "webllm", label: "WebLLM", strength: "strong", pattern: /@mlc-ai\/web-llm/i },

  // --- AIチャットボット専業サービス ---
  { id: "dialogflow", label: "Google Dialogflow", strength: "strong", pattern: /dialogflow-console\/fast\/messenger|<df-messenger/i },
  { id: "botframework", label: "Microsoft Bot Framework / Copilot Studio", strength: "strong", pattern: /cdn\.botframework\.com|botframework-webchat|copilotstudio/i },
  { id: "watson", label: "IBM watsonx Assistant", strength: "strong", pattern: /assistant\.watson\.appdomain\.cloud|watsonplatform\.net/i },
  { id: "chatbase", label: "Chatbase", strength: "strong", pattern: /chatbase\.co\/embed/i },
  { id: "voiceflow", label: "Voiceflow", strength: "strong", pattern: /cdn\.voiceflow\.com|general-runtime\.voiceflow\.com/i },
  { id: "botpress", label: "Botpress", strength: "strong", pattern: /cdn\.botpress\.cloud|botpress\.cloud\/webchat/i },
  { id: "ada", label: "Ada", strength: "strong", pattern: /static\.ada\.support/i },

  // --- AI機能を持つが、AIを使っているとは限らないサービス ---
  { id: "intercom", label: "Intercom", strength: "medium", pattern: /widget\.intercom\.io|js\.intercomcdn\.com/i, note: "AIエージェント「Fin」を提供するチャット。有人対応のみの場合もある" },
  { id: "zendesk", label: "Zendesk", strength: "medium", pattern: /static\.zdassets\.com\/ekr\/snippet/i, note: "AIエージェント機能あり。有人対応のみの場合もある" },
  { id: "tidio", label: "Tidio", strength: "medium", pattern: /code\.tidio\.co/i, note: "AIチャットボット「Lyro」を提供。有人対応のみの場合もある" },
  { id: "drift", label: "Drift", strength: "medium", pattern: /js\.driftt\.com/i, note: "AIチャット機能を持つ会話型マーケティングツール" },
  { id: "google-translate", label: "Google翻訳ウィジェット", strength: "medium", pattern: /translate\.google\.com\/translate_a\/element/i, note: "ニューラル機械翻訳を利用" },
  { id: "crisp", label: "Crisp", strength: "weak", pattern: /client\.crisp\.chat/i, note: "AI返信機能を持つチャット。有人対応のみの場合が多い" },
];

/**
 * 文章（製品説明・利用規約・プライバシーポリシー・ページ本文）から検出するキーワード。
 */
export type TextKeyword = {
  id: string;
  label: string;
  strength: Strength;
  pattern: RegExp;
  note?: string;
};

// 英字の語境界。日本語の文中でも機能するよう、前後が英数字でないことだけを見る
const w = (s: string) => new RegExp(`(?<![A-Za-z0-9])(?:${s})(?![A-Za-z0-9])`, "gi");

export const TEXT_KEYWORDS: TextKeyword[] = [
  // AIで作ったことの開示（記事・画像などで重要）
  { id: "disclosure", label: "AIで作成したことの開示", strength: "strong", pattern: /(?:記事|文章|本文|画像|イラスト|写真|コンテンツ|動画|音声|BGM|原稿|下書き|翻訳)[^。\n]{0,25}(?:AI|ＡＩ|ChatGPT|Claude|Gemini|Copilot)[^。\n]{0,12}(?:で|を使って|を使用して|を利用して|を活用して|により|によって|の力を借りて)[^。\n]{0,6}(?:生成|作成|執筆|書|作|翻訳|校正|構成)|(?:AI|ＡＩ)(?:が|で)(?:書いた|生成した|作成した)|(?:this|the) (?:post|article|content|image|text|story|piece)[^.\n]{0,40}(?:was|were|is|has been)? ?(?:generated|written|created|drafted|translated|edited)[^.\n]{0,15}(?:with|by|using) (?:the help of |assistance from )?(?:AI|ChatGPT|Claude|Gemini|Copilot)|AI-(?:generated|written|assisted) (?:content|image|article|post|text)/gi, note: "コンテンツをAIで作ったことを明かす記述" },

  // データ学習への利用（プライバシーポリシーで重要）
  { id: "training", label: "データをAIの学習に利用", strength: "strong", pattern: /(?:AI|モデル|人工知能)の(?:学習|訓練|トレーニング)|学習(?:データ)?に(?:利用|使用)|train(?:ing)? (?:our |of )?(?:AI |ML )?models?|model training|improve our models/gi, note: "入力したデータがAIの学習に使われる可能性" },

  // 明確なAI関連語
  { id: "genai", label: "生成AI", strength: "strong", pattern: /生成(?:AI|ＡＩ|型AI|型人工知能)|generative AI|gen ?AI/gi },
  { id: "ai-ja", label: "人工知能", strength: "strong", pattern: /人工知能/g },
  { id: "ml", label: "機械学習", strength: "strong", pattern: /機械学習|machine learning/gi },
  { id: "dl", label: "ディープラーニング", strength: "strong", pattern: /ディープラーニング|深層学習|deep learning|ニューラルネット(?:ワーク)?|neural network/gi },
  { id: "llm", label: "大規模言語モデル (LLM)", strength: "strong", pattern: /大規模言語モデル|large language models?|(?<![A-Za-z0-9])LLMs?(?![A-Za-z0-9])/gi },
  { id: "ai-en", label: "artificial intelligence", strength: "strong", pattern: /artificial intelligence/gi },
  { id: "ai-powered", label: "AI搭載・AI活用", strength: "strong", pattern: /AI(?:を)?(?:搭載|活用|利用|使用)|AIによる|AI-(?:powered|driven|based|enabled)|powered by AI|AI機能|AIアシスタント|AIチャット|AIエージェント|AI agents?|AI assistant|AI features?/gi },
  { id: "ai-product", label: "AI製品・AI生成", strength: "strong", pattern: /AI(?:が|で)?生成|AI-generated|generated (?:by|with) AI|AI (?:workspace|tools?|models?|writing|search|chatbot|companion|overviews?)|(?<![A-Za-z])(?:AI|ML) (?:model|pipeline)s?/gi },
  { id: "named-ai", label: "「〇〇 AI」という機能名", strength: "medium", pattern: /(?<![A-Za-z0-9])(?!(?:The|An?|Our|Your|With|And|For|Of|Using|Use|Generative|Responsible|Open|About|No|New)\s)[A-Z][A-Za-z]+ AI(?![A-Za-z0-9])/g, note: "例: Notion AI、Galaxy AI。製品名にAIを含む機能" },
  { id: "llm-products", label: "主要なAIモデル名", strength: "strong", pattern: w("ChatGPT|GPT-[3-9](?:\\.\\d)?o?|OpenAI|Anthropic|Llama ?[2-9]|Mistral AI|Stable Diffusion|Midjourney|DALL-?E") },
  { id: "ambiguous-models", label: "AIモデル・アシスタント名（同名の別物の可能性あり）", strength: "medium", pattern: w("Claude|Gemini|Copilot|Firefly|Bard") },

  // AI技術の応用分野
  { id: "nlp", label: "自然言語処理", strength: "medium", pattern: /自然言語処理|natural language processing|(?<![A-Za-z0-9])NLP(?![A-Za-z0-9])/gi },
  { id: "cv", label: "画像認識・コンピュータビジョン", strength: "medium", pattern: /画像認識|物体検出|顔認証|顔認識|computer vision|image recognition|object detection|facial recognition|face recognition/gi },
  { id: "speech", label: "音声認識・音声合成", strength: "medium", pattern: /音声認識|音声合成|speech recognition|speech synthesis|text-to-speech|speech-to-text/gi },
  { id: "predictive", label: "予測モデル・推論", strength: "medium", pattern: /予測モデル|推論エンジン|predictive (?:model|analytics)|AI inference|model inference/gi },
  { id: "ai-bare", label: "「AI」という語", strength: "weak", pattern: /(?<![A-Za-z0-9])(?:AI|ＡＩ)(?![A-Za-z0-9])/g, note: "単独の「AI」。文脈によってはAI使用を意味しない" },

  // 弱い兆候
  { id: "algo", label: "アルゴリズム・レコメンド", strength: "weak", pattern: /レコメンド|おすすめ(?:機能|アルゴリズム)|パーソナライズ|recommendation engine|personaliz(?:ed|ation)|algorithm/gi, note: "AIを使わない単純なルールの場合もある" },
  { id: "auto", label: "自動翻訳・自動生成", strength: "weak", pattern: /自動翻訳|自動生成|自動要約|machine translation|auto-?generated|automatically generated/gi },
];

/** 同じ文の中にこれがあれば「AIを使っていない」という否定文とみなす */
export const NEGATION_PATTERN =
  /(?:使用|利用|搭載|活用)(?:して|しており)?(?:い)?ません|使っていません|使わない|使わず|使用しない|利用しない|使用せず|利用せず|頼らず|不使用|AIフリー|(?<![A-Za-z])(?:do(?:es)? not|don't|doesn't|never|no longer) (?:use|rely|train|employ)|not (?:use|train)(?:d)? |AI-free|without (?:any )?AI|no AI/i;

export const STRENGTH_WEIGHT: Record<Strength, number> = {
  strong: 30,
  medium: 12,
  weak: 4,
  info: 0,
};
