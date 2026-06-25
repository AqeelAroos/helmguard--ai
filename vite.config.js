import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function groqLocalApi() {
  let groqKey;

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

  return {
    name: 'groq-local-api',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, '');
      groqKey = env.GROQ_API_KEY;
    },
    configureServer(server) {
      server.middlewares.use('/api/analyze', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!groqKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'GROQ_KEY_MISSING' }));
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;
        const { base64Data, mimeType = 'image/jpeg' } = JSON.parse(body);

        if (!base64Data) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'No image data provided' }));
          return;
        }

        const model = 'meta-llama/llama-4-scout-17b-16e-instruct';
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model,
                messages: [{
                  role: 'user',
                  content: [
                    { type: 'text', text: SCALP_PROMPT },
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
                  ],
                }],
                temperature: 0.3,
                max_tokens: 2048,
              }),
            });

            if (!groqRes.ok) {
              const status = groqRes.status;
              if (status === 429) {
                await new Promise(r => setTimeout(r, (attempt + 1) * 15000));
                continue;
              }
              if (status === 401) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Groq API key is invalid.' }));
                return;
              }
              let errBody = {};
              try { errBody = await groqRes.json(); } catch {}
              throw new Error(errBody?.error?.message || `HTTP ${status}`);
            }

            const data = await groqRes.json();
            const text = data?.choices?.[0]?.message?.content?.trim();
            if (!text) throw new Error('Empty response from Groq AI');

            const result = JSON.parse(
              text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
            );

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
            return;
          } catch (err) {
            if (err instanceof SyntaxError && attempt < 2) continue;
            if (attempt === 2 || !(err instanceof SyntaxError)) break;
          }
        }

        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Groq AI analysis failed. Please try again.' }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), groqLocalApi()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ai: ['@google/generative-ai'],
          charts: ['recharts'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'react-hot-toast'],
        },
      },
    },
  },
})
