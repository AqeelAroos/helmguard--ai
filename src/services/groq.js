/**
 * HelmGuard AI — Groq Vision API for Scalp Analysis
 * Uses Groq's free LLaMA Vision models for fast, reliable scalp analysis.
 * Much faster than Gemini with generous free tier limits.
 */

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SCALP_PROMPT = `You are a clinical dermatology AI specialized in scalp health analysis for daily helmet users.

Analyze this scalp/head image and return ONLY a valid JSON object — no markdown, no code fences, no explanation, just raw JSON:

{
  "redness_score": <0-100>,
  "dryness_score": <0-100>,
  "oiliness_score": <0-100>,
  "dandruff_score": <0-100>,
  "inflammation_score": <0-100>,
  "thinning_risk": "<low|moderate|high>",
  "hair_density": "<sparse|normal|dense>",
  "follicle_health": "<poor|fair|good>",
  "overall_risk_score": <1.0-10.0>,
  "confidence_percent": <50-99>,
  "scalp_condition_summary": "<2-3 sentence clinical-style summary>",
  "observations": ["<observation 1>","<observation 2>","<observation 3>"],
  "recommendations": ["<recommendation 1>","<recommendation 2>","<recommendation 3>"],
  "urgent_attention_needed": <true|false>,
  "estimated_hair_density_per_cm2": <80-180>,
  "sebum_level": "<low|normal|high|excessive>",
  "affected_areas": ["<crown|temples|nape|forehead|sides>"]
}

Be thorough. If image quality is poor, lower confidence but still give best clinical assessment. Always provide all fields.`;

// Groq vision models — llama-4-scout supports multimodal (text + image)
const MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
];

const wait = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Call Groq Chat Completions API with vision
 */
async function callGroqVision(modelName, base64Data, mimeType) {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const body = {
    model: modelName,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: SCALP_PROMPT },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Data}`,
            },
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 2048,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const status = res.status;
    let errorBody = {};
    try { errorBody = await res.json(); } catch {}
    const detail = errorBody?.error?.message || res.statusText;

    const err = new Error(`Groq HTTP ${status}: ${detail}`);
    err.status = status;
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from Groq AI");
  return text;
}

function parseJSON(raw) {
  return JSON.parse(
    raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim()
  );
}

/**
 * Analyze a scalp image using Groq Vision API
 */
export async function analyzeScalpImage(base64Data, mimeType = "image/jpeg") {
  if (!API_KEY) throw new Error("GROQ_KEY_MISSING");

  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[HelmGuard] → Groq ${modelName} (attempt ${attempt + 1}/3)`);
        const rawText = await callGroqVision(modelName, base64Data, mimeType);
        const result = parseJSON(rawText);
        console.log(`[HelmGuard] ✓ Success with Groq ${modelName}`);
        return result;
      } catch (err) {
        const status = err.status || 0;
        console.warn(`[HelmGuard] ✗ Groq ${modelName}:`, status, err.message);

        // 429 Rate limit — wait and retry
        if (status === 429) {
          const waitTime = (attempt + 1) * 15000; // 15s, 30s, 45s
          console.log(`[HelmGuard] Rate limited. Waiting ${waitTime / 1000}s...`);
          await wait(waitTime);
          continue;
        }

        // 404 Model not available — try next model
        if (status === 404) {
          console.log(`[HelmGuard] ${modelName} not available, trying next...`);
          break;
        }

        // 401 Bad key — stop immediately
        if (status === 401) {
          throw new Error("Groq API key is invalid. Check your .env.local VITE_GROQ_API_KEY.");
        }

        // 400 Bad request (e.g. model doesn't support images) — try next model
        if (status === 400) {
          console.log(`[HelmGuard] ${modelName} rejected request, trying next...`);
          break;
        }

        // Parse error — retry once
        if (err instanceof SyntaxError && attempt < 2) continue;

        break; // unknown error, next model
      }
    }
  }

  throw new Error(
    "Groq AI analysis failed.\n\n" +
    "Please check your Groq API key and try again.\n" +
    "Get a free key at: https://console.groq.com"
  );
}

// Compress image — 512px max, 60% quality
export function compressImageToBase64(file, maxDim = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      resolve(dataUrl.split(",")[1]);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

// Capture video frame — compressed
export function captureFrameAsBase64(videoEl, maxDim = 512) {
  const scale = Math.min(1, maxDim / Math.max(videoEl.videoWidth, videoEl.videoHeight));
  const w = Math.round(videoEl.videoWidth * scale);
  const h = Math.round(videoEl.videoHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(videoEl, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
  return { base64: dataUrl.split(",")[1], dataUrl };
}
