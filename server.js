// ✅ PromotionAI - Backend Server
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "gpt-4o-mini";

// 🧠 Generate Content (Main)
app.post("/api/prompt", async (req, res) => {
  const { prompt, tone, length, businessType, template, creativity } = req.body;
  if (!prompt) return res.status(400).send("No prompt provided.");

  const finalPrompt = `
  🎯 Template: ${template}
  🏢 Business: ${businessType}
  💬 Tone: ${tone}
  📏 Length: ${length}
  🌈 Creativity: ${creativity}%
  🧠 User Request: ${prompt}
  ➡️ Generate a powerful, creative, and engaging marketing content.
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: finalPrompt }],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const output = data?.choices?.[0]?.message?.content || "No output generated.";
    res.json({ output });
  } catch (error) {
    res.status(500).send("AI Error: " + error.message);
  }
});

// 🎨 Generate Image (Mock or Custom)
app.post("/api/image", async (req, res) => {
  const { prompt, style } = req.body;
  if (!prompt) return res.status(400).send("No image prompt provided.");
  const fakeUrl = `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(
    prompt.slice(0, 30)
  )}`;
  res.json({ images: [fakeUrl] });
});

// 🚀 Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
