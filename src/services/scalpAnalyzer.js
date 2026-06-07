/**
 * HelmGuard AI — Hybrid Scalp Analyzer
 * Tries local ONNX model first (free, instant, offline).
 * Falls back to Groq Vision API if local model unavailable.
 */

import { isModelAvailable, analyzeFromBase64, analyzeFromVideo, validateImageQuality } from "./scalpML";
import { analyzeScalpImage as groqAnalyze } from "./groq";

export { validateImageQuality } from "./scalpML";
export { compressImageToBase64, captureFrameAsBase64 } from "./groq";

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
      console.warn("[Analyzer] Local model failed, trying Groq:", e.message);
    }
  }

  // ── Strategy 2: Groq Vision API (fast, free tier) ──
  try {
    console.log("[Analyzer] Using Groq Vision API");
    const result = await groqAnalyze(base64Data, mimeType);
    result._method = "groq_api";
    return result;
  } catch (e) {
    // If Groq also fails, provide a helpful error
    if (e.message === "GROQ_KEY_MISSING" && !localAvailable) {
      throw new Error(
        "No AI model available.\n\n" +
        "Option 1: Train and deploy the local ML model (see ml/README.md)\n" +
        "Option 2: Add a Groq API key to .env.local (free at https://console.groq.com)"
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
  const hasGroq = !!import.meta.env.VITE_GROQ_API_KEY;

  if (local && hasGroq) return { method: "hybrid", label: "Local AI + Groq Cloud", icon: "🧬" };
  if (local) return { method: "local", label: "On-Device AI (MobileNetV3)", icon: "📱" };
  if (hasGroq) return { method: "groq", label: "Groq Vision AI (LLaMA)", icon: "⚡" };
  return { method: "none", label: "No AI configured", icon: "⚠️" };
}
