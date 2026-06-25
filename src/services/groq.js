/**
 * HelmGuard AI — Groq Vision via serverless proxy
 * Calls /api/analyze so the API key stays server-side.
 */

export async function analyzeScalpImage(base64Data, mimeType = "image/jpeg") {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Data, mimeType }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("GROQ_KEY_MISSING");
  }

  if (!res.ok) {
    throw new Error(data.error || "Analysis failed");
  }

  return data;
}

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
