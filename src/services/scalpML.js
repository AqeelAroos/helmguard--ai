/**
 * HelmGuard AI — Browser-Side Scalp Disease ML Inference
 * Runs MobileNetV3 ONNX model directly in the browser via ONNX Runtime Web.
 * Zero API calls, zero rate limits, works offline.
 *
 * If the ONNX model isn't available, falls back to Gemini API (premium).
 */

let onnxSession = null;
let modelConfig = null;
let modelLoadPromise = null;

// ── Load model config ──
async function loadConfig() {
  if (modelConfig) return modelConfig;
  try {
    const res = await fetch("/models/model_config.json");
    modelConfig = await res.json();
    return modelConfig;
  } catch {
    return null;
  }
}

// ── Load ONNX model ──
async function loadModel() {
  if (onnxSession) return onnxSession;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    try {
      const config = await loadConfig();
      if (!config) throw new Error("Config not found");

      const ort = await import("onnxruntime-web");

      // Configure WASM paths
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/";

      const modelUrl = `/models/${config.modelFile}`;

      // Check if model file exists
      const check = await fetch(modelUrl, { method: "HEAD" });
      if (!check.ok) throw new Error("ONNX model file not found");

      console.log("[ScalpML] Loading ONNX model...");
      onnxSession = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });

      console.log("[ScalpML] Model loaded successfully");
      return onnxSession;
    } catch (e) {
      console.warn("[ScalpML] Model load failed:", e.message);
      modelLoadPromise = null;
      throw e;
    }
  })();

  return modelLoadPromise;
}

// ── Check if local model is available ──
export async function isModelAvailable() {
  try {
    const res = await fetch("/models/model_config.json", { method: "HEAD" });
    if (!res.ok) return false;
    const modelRes = await fetch("/models/helmguard_scalp_model.onnx", { method: "HEAD" });
    return modelRes.ok;
  } catch {
    return false;
  }
}

// ── Image preprocessing for the model ──
function preprocessImage(imageElement, size = 224) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Center crop to square
  const srcW = imageElement.naturalWidth || imageElement.videoWidth || imageElement.width;
  const srcH = imageElement.naturalHeight || imageElement.videoHeight || imageElement.height;
  const cropSize = Math.min(srcW, srcH);
  const sx = (srcW - cropSize) / 2;
  const sy = (srcH - cropSize) / 2;

  ctx.drawImage(imageElement, sx, sy, cropSize, cropSize, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const { data } = imageData;

  // ImageNet normalization: (pixel/255 - mean) / std
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  // NCHW format: [1, 3, 224, 224]
  const floatData = new Float32Array(1 * 3 * size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcIdx = (y * size + x) * 4;
      const dstIdx = y * size + x;
      floatData[0 * size * size + dstIdx] = (data[srcIdx] / 255 - mean[0]) / std[0];     // R
      floatData[1 * size * size + dstIdx] = (data[srcIdx + 1] / 255 - mean[1]) / std[1]; // G
      floatData[2 * size * size + dstIdx] = (data[srcIdx + 2] / 255 - mean[2]) / std[2]; // B
    }
  }

  return floatData;
}

// ── Softmax ──
function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// ── Image quality validation ──
export function validateImageQuality(imageElement) {
  const canvas = document.createElement("canvas");
  const size = 100; // downscale for fast analysis
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageElement, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  // Check 1: Blur detection (Laplacian variance approximation)
  let laplacianSum = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = (y * size + x) * 4;
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const grayUp = data[((y - 1) * size + x) * 4] * 0.299 + data[((y - 1) * size + x) * 4 + 1] * 0.587 + data[((y - 1) * size + x) * 4 + 2] * 0.114;
      const grayDown = data[((y + 1) * size + x) * 4] * 0.299 + data[((y + 1) * size + x) * 4 + 1] * 0.587 + data[((y + 1) * size + x) * 4 + 2] * 0.114;
      const grayLeft = data[(y * size + x - 1) * 4] * 0.299 + data[(y * size + x - 1) * 4 + 1] * 0.587 + data[(y * size + x - 1) * 4 + 2] * 0.114;
      const grayRight = data[(y * size + x + 1) * 4] * 0.299 + data[(y * size + x + 1) * 4 + 1] * 0.587 + data[(y * size + x + 1) * 4 + 2] * 0.114;
      const laplacian = grayUp + grayDown + grayLeft + grayRight - 4 * gray;
      laplacianSum += laplacian * laplacian;
    }
  }
  const blurScore = laplacianSum / ((size - 2) * (size - 2));
  const isBlurry = blurScore < 50;

  // Check 2: Brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  const avgBrightness = totalBrightness / (size * size);
  const isTooDark = avgBrightness < 40;
  const isTooLight = avgBrightness > 240;

  // Check 3: Color variance (reject solid colors / blank images)
  let rSum = 0, gSum = 0, bSum = 0;
  let rSumSq = 0, gSumSq = 0, bSumSq = 0;
  const n = size * size;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2];
    rSumSq += data[i] ** 2; gSumSq += data[i + 1] ** 2; bSumSq += data[i + 2] ** 2;
  }
  const variance = ((rSumSq / n - (rSum / n) ** 2) + (gSumSq / n - (gSum / n) ** 2) + (bSumSq / n - (bSum / n) ** 2)) / 3;
  const isLowVariance = variance < 100;

  const issues = [];
  if (isBlurry) issues.push("Image appears blurry — hold camera steady");
  if (isTooDark) issues.push("Image is too dark — improve lighting");
  if (isTooLight) issues.push("Image is overexposed — reduce lighting");
  if (isLowVariance) issues.push("Image lacks detail — ensure scalp is visible");

  return {
    isValid: issues.length === 0,
    issues,
    metrics: { blurScore: Math.round(blurScore), avgBrightness: Math.round(avgBrightness), variance: Math.round(variance) },
  };
}

// ── Main inference function ──
export async function runScalpInference(imageElement) {
  const config = await loadConfig();
  if (!config) throw new Error("Model configuration not found");

  const session = await loadModel();
  const ort = await import("onnxruntime-web");

  const startTime = performance.now();

  // Preprocess
  const inputData = preprocessImage(imageElement, config.inputSize);
  const tensor = new ort.Tensor("float32", inputData, [1, 3, config.inputSize, config.inputSize]);

  // Run inference
  const results = await session.run({ input: tensor });
  const logits = Array.from(results.output.data);
  const probabilities = softmax(logits);

  const inferenceTime = Math.round(performance.now() - startTime);

  // Build results
  const predictions = config.classNames.map((name, i) => ({
    className: name,
    displayName: config.classDisplayNames[name] || name,
    probability: probabilities[i],
    percentage: Math.round(probabilities[i] * 1000) / 10,
    metadata: config.classMetadata[name] || {},
  }));

  // Sort by probability (highest first)
  predictions.sort((a, b) => b.probability - a.probability);

  const topPrediction = predictions[0];
  const confidence = topPrediction.probability;
  const meta = topPrediction.metadata;

  return {
    // Top diagnosis
    condition: topPrediction.displayName,
    conditionKey: topPrediction.className,
    confidence: Math.round(confidence * 100),
    severity: meta.severity || "unknown",
    description: meta.description || "",
    recommendations: meta.recommendations || [],
    riskScore: meta.riskScore || 5.0,

    // All predictions (for probability chart)
    predictions,

    // Performance
    inferenceTimeMs: inferenceTime,
    modelVersion: config.version,
    architecture: config.architecture,

    // Derived scores (for compatibility with existing UI)
    overall_risk_score: meta.riskScore || 5.0,
    confidence_percent: Math.round(confidence * 100),
    thinning_risk: meta.riskScore > 6 ? "high" : meta.riskScore > 3 ? "moderate" : "low",
    scalp_condition_summary: `${topPrediction.displayName} detected with ${Math.round(confidence * 100)}% confidence. ${meta.description || ""}`,
    observations: predictions.slice(0, 3).map(p => `${p.displayName}: ${p.percentage}% probability`),
    urgent_attention_needed: meta.severity === "high",
    affected_areas: ["scalp"],

    // Disclaimer
    disclaimer: "This is an AI-assisted screening tool, not a medical diagnosis. Consult a dermatologist for professional evaluation.",
  };
}

// ── Convenience: analyze from base64 image ──
export async function analyzeFromBase64(base64DataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const quality = validateImageQuality(img);
        if (!quality.isValid) {
          reject(new Error(`Image quality issue: ${quality.issues.join(". ")}`));
          return;
        }
        const result = await runScalpInference(img);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = base64DataUrl;
  });
}

// ── Convenience: analyze from video element (camera capture) ──
export async function analyzeFromVideo(videoElement) {
  const quality = validateImageQuality(videoElement);
  if (!quality.isValid) {
    throw new Error(`Image quality issue: ${quality.issues.join(". ")}`);
  }
  return runScalpInference(videoElement);
}
