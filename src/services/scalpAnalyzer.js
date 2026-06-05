/**
 * HelmGuard AI — Hybrid Scalp Analyzer
 * Tries local ONNX model first (free, instant, offline).
 * Falls back to Gemini API if local model unavailable (premium).
 */

import { isModelAvailable, analyzeFromBase64, analyzeFromVideo, validateImageQuality } from "./scalpML";
import { analyzeScalpImage as geminiAnalyze } from "./gemini";

export { validateImageQuality } from "./scalpML";
export { compressImageToBase64, captureFrameAsBase64 } from "./gemini";

/**
 * Analyze a scalp image using the best available method.
 * @param {string} base64Data - Base64 encoded image data (without data URL prefix)
 * @param {string} mimeType - Image MIME type
 * @returns {object} Analysis result compatible with existing UI
 */
export async function analyzeScalp(base64Data, mimeType = "image/jpeg") {
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  // ── Strategy 1: Local ONNX Model (free, instant, offline) ──
  const localAvailable = await isModelAvailable();
  if (localAvailable) {
    try {
      console.log("[Analyzer] Using local ONNX model");
      const result = await analyzeFromBase64(dataUrl);
      result._method = "local_ml";
      return result;
    } catch (e) {
      console.warn("[Analyzer] Local model failed, trying Gemini:", e.message);
    }
  }

  // ── Strategy 2: Gemini API (premium, cloud-based) ──
  try {
    console.log("[Analyzer] Using Gemini API");
    const result = await geminiAnalyze(base64Data, mimeType);
    result._method = "gemini_api";
    return result;
  } catch (e) {
    // If Gemini also fails, provide a helpful error
    if (e.message === "GEMINI_KEY_MISSING" && !localAvailable) {
      throw new Error(
        "No AI model available.\n\n" +
        "Option 1: Train and deploy the local ML model (see ml/README.md)\n" +
        "Option 2: Add a Gemini API key to .env.local"
      );
    }
    throw e;
  }
}

/**
 * Analyze directly from a video element (camera capture).
 */
export async function analyzeFromCamera(videoElement) {
  const localAvailable = await isModelAvailable();
  if (localAvailable) {
    try {
      const result = await analyzeFromVideo(videoElement);
      result._method = "local_ml";
      return result;
    } catch (e) {
      console.warn("[Analyzer] Local model camera analysis failed:", e.message);
      throw e;
    }
  }
  throw new Error("Local model not available for camera analysis. Upload a photo instead.");
}

/**
 * Get the current analysis method available.
 */
export async function getAnalysisMethod() {
  const local = await isModelAvailable();
  const hasGemini = !!import.meta.env.VITE_GEMINI_API_KEY;

  if (local && hasGemini) return { method: "hybrid", label: "Local AI + Gemini Cloud", icon: "🧬" };
  if (local) return { method: "local", label: "On-Device AI (MobileNetV3)", icon: "📱" };
  if (hasGemini) return { method: "gemini", label: "Gemini Cloud AI", icon: "☁️" };
  return { method: "none", label: "No AI configured", icon: "⚠️" };
}
