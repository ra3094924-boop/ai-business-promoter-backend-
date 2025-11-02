// ✅ DeepSeek AI Backend
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("✅ DeepSeek AI Backend is running fine!");
});

// ✅ Chat Route
app.post("/api/prompt", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt missing" });
  }

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // ✅ Main model for DeepSeek
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ DeepSeek API Error:", data.error);
      return res.json({ reply: `⚠️ AI Error: ${data.error.message}` });
    }

    const reply =
      data?.choices?.[0]?.message?.content || "⚠️ No reply received from DeepSeek.";
    res.json({ reply });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ reply: "⚠️ Server error, please try again." });
  }
});

// ✅ Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ DeepSeek Server running on port ${PORT}`));
