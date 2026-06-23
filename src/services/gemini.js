// Direct fetch to Gemini REST API — no SDK dependency issues
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SCALP_PROMPT = `You are a clinical dermatology AI specialized in scalp health analysis for daily helmet users.

Analyze this scalp/head image and return ONLY a valid JSON object — no markdown, no code fences, just raw JSON:

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

// Try newest models first — each model has its OWN separate quota
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// Direct REST call — bypasses SDK entirely so we can inspect HTTP status codes
async function callGeminiREST(modelName, base64Data, mimeType) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{
      parts: [
        { text: SCALP_PROMPT },
        { inline_data: { mime_type: mimeType, data: base64Data } }
      ]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const status = res.status;
    let errorBody = {};
    try { errorBody = await res.json(); } catch {}
    const detail = errorBody?.error?.message || "";

    // Extract Google's recommended retry delay
    let retrySeconds = 0;
    try {
      const retryInfo = errorBody?.error?.details?.find(d => d["@type"]?.includes("RetryInfo"));
      if (retryInfo?.retryDelay) {
        retrySeconds = Math.ceil(parseFloat(retryInfo.retryDelay));
      }
    } catch {}

    const err = new Error(`HTTP ${status}: ${detail}`);
    err.status = status;
    err.retrySeconds = retrySeconds || 45; // default 45s if not specified
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty response from AI");
  return text;
}

function parseJSON(raw) {
  return JSON.parse(
    raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim()
  );
}

export async function analyzeScalpImage(base64Data, mimeType = "image/jpeg") {
  if (!API_KEY) throw new Error("GEMINI_KEY_MISSING");

  // Try each model with up to 3 retries, waiting for Google's recommended delay
  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[HelmGuard] → ${modelName} (attempt ${attempt + 1}/3)`);
        const rawText = await callGeminiREST(modelName, base64Data, mimeType);
        const result = parseJSON(rawText);
        console.log(`[HelmGuard] ✓ Success with ${modelName}`);
        return result;
      } catch (err) {
        const status = err.status || 0;
        const msg = (err.message || "").toLowerCase();
        console.warn(`[HelmGuard] ✗ ${modelName}:`, status);

        // 429 Rate limit — wait for Google's recommended delay, then retry
        if (status === 429) {
          const waitTime = (err.retrySeconds || 45) * 1000;
          console.log(`[HelmGuard] Rate limited. Waiting ${Math.round(waitTime/1000)}s...`);
          await wait(waitTime);
          continue; // retry same model
        }

        // 404 Model not found or 403 model not available on free tier — skip to next model
        if (status === 404 || status === 403) {
          console.log(`[HelmGuard] ${modelName} not available (${status}), trying next...`);
          break;
        }

        // 400/401 Bad key — stop everything
        if (status === 400 || status === 401) {
          throw new Error(`API key error (${status}). Check your .env.local key is valid.`);
        }

        // Parse error — retry once
        if (err instanceof SyntaxError && attempt < 2) continue;

        break; // unknown error, next model
      }
    }
  }

  throw new Error(
    "Analysis timed out — free tier quota is very limited.\n\n" +
    "Please wait 2 minutes and try again.\n" +
    "Tip: Only scan once, then wait. Repeated attempts drain quota faster."
  );
}

// Compress image AGGRESSIVELY — 512px max, 60% quality = ~4x fewer tokens
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

// Capture video frame — compressed for minimal token usage
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
