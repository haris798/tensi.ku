import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent and key
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API routes go here FIRST
app.post("/api/gemini/health-tips", async (req, res) => {
  try {
    const { latestBP, latestWeight } = req.body;

    if (!ai) {
      return res.status(500).json({ 
        error: "Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi pada server." 
      });
    }

    // Build context
    let context = "";
    if (latestBP) {
      context += `Tekanan Darah terakhir: ${latestBP.systolic}/${latestBP.diastolic} mmHg (Detak nadi: ${latestBP.pulse} bpm). `;
    } else {
      context += `Tekanan Darah terakhir: Belum ada rekaman tensi. `;
    }

    if (latestWeight) {
      context += `Berat badan terakhir: ${latestWeight.weight} kg. `;
    } else {
      context += `Berat badan terakhir: Belum ada rekaman berat badan. `;
    }

    // Prompt Gemini for one short personalized health tip
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Berikan satu tips kesehatan harian singkat, praktis, ramah, dan dipersonalisasi berdasarkan data medis pengguna berikut dalam bahasa Indonesia.
Tips harus fokus pada tensi darah atau berat badan yang tercatat, berikan anjuran diet ringan atau gaya hidup sehat dalam 1-2 kalimat pendek yang memotivasi. Jangan terlalu panjang atau teoritis.

Untuk Tensi Darah, klasifikasi WHO yang kami gunakan adalah:
- Optimal: <120 dan <80 mmHg
- Normal: 120-129 dan/atau 80-84 mmHg
- Normal tinggi: 130-139 dan/atau 85-89 mmHg
- Hipertensi 1: 140-159 dan/atau 90-99 mmHg
- Hipertensi 2: 160-179 dan/atau 100-109 mmHg
- Hipertensi 3: >=180 dan/atau >=110 mmHg
- Hipertensi sistolik terisolasi: >=140 dan <90 mmHg

Gunakan klasifikasi di atas untuk memberikan nasihat gizi atau aktivitas fisik yang sangat tepat sasaran.

Data Pasien:
${context}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tip: {
              type: Type.STRING,
              description: "Tips kesehatan harian singkat, praktis, ramah, dan dipersonalisasi, maksimal 2 kalimat.",
            },
            focus: {
              type: Type.STRING,
              description: "Kategori fokus tips ini, misal: Nutrisi, Aktivitas Fisik, Kelola Stres, Hidrasi, dll.",
            },
          },
          required: ["tip", "focus"],
        },
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Tidak ada respon dari model AI.");
    }

    const result = JSON.parse(text.trim());
    res.json(result);
  } catch (error: any) {
    console.warn("Gemini Health Tips Warning (Fallback triggered):", error?.message || error);
    res.status(503).json({ 
      error: "Gagal menghasilkan tips kesehatan AI, menggunakan fallback lokal." 
    });
  }
});

// Vite middleware setup and server listening wrapped in async function to avoid top-level await
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
