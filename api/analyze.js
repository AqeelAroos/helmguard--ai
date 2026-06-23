const GROQ_API_KEY = process.env.GROQ_API_KEY;

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

const MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_KEY_MISSING" });
  }

  const { base64Data, mimeType = "image/jpeg" } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: "No image data provided" });
  }

  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: SCALP_PROMPT },
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
                ],
              },
            ],
            temperature: 0.3,
            max_tokens: 2048,
          }),
        });

        if (!groqRes.ok) {
          const status = groqRes.status;
          let errorBody = {};
          try { errorBody = await groqRes.json(); } catch {}

          if (status === 429) {
            const waitTime = (attempt + 1) * 15000;
            await new Promise(r => setTimeout(r, waitTime));
            continue;
          }
          if (status === 404 || status === 400) break;
          if (status === 401) {
            return res.status(401).json({ error: "Groq API key is invalid." });
          }
          throw new Error(errorBody?.error?.message || `HTTP ${status}`);
        }

        const data = await groqRes.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error("Empty response from Groq AI");

        const result = JSON.parse(
          text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim()
        );

        return res.status(200).json(result);
      } catch (err) {
        if (err instanceof SyntaxError && attempt < 2) continue;
        if (attempt === 2 || !(err instanceof SyntaxError)) break;
      }
    }
  }

  return res.status(502).json({
    error: "Groq AI analysis failed. Please try again in a moment.",
  });
}
