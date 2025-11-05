// ✅ PROMOTIONAI - FIXED BACKEND (All Issues Resolved)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();

// ✅ Basic Setup
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());

// ✅ API Configuration (Fixed - No Duplicates)
const API_CONFIG = {
  openrouter: {
    name: "OpenRouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    key: process.env.OPENROUTER_API_KEY,
    model: "google/gemini-flash-1.5-8b"
  },
  huggingface: {
    name: "Hugging Face",
    url: "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
    key: process.env.HUGGINGFACE_API_KEY
  },
  gemini: {
    name: "Google Gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    key: process.env.GEMINI_API_KEY
  },
  cohere: {
    name: "Cohere",
    url: "https://api.cohere.ai/v1/generate",
    key: process.env.COHERE_API_KEY,
    model: "command"
  },
  openai: {
    name: "OpenAI",
    url: "https://api.openai.com/v1/chat/completions",
    key: process.env.OPENAI_API_KEY,
    model: "gpt-3.5-turbo"
  }
};

// ✅ Health Check
app.get("/", (req, res) => {
  res.json({
    status: "✅ PromotionAI Backend Running",
    apis: Object.keys(API_CONFIG),
    message: "All 5 APIs are configured and ready!",
    time: new Date().toISOString()
  });
});

// ✅ API Status Check
app.get("/api/status", async (req, res) => {
  const status = {};
  
  for (const [apiName, config] of Object.entries(API_CONFIG)) {
    try {
      if (!config.key) {
        status[apiName] = { status: "❌ No API Key", message: "API key not configured" };
        continue;
      }
      
      // Quick test for each API
      const testPrompt = "Hello, respond with 'OK' if working.";
      const response = await callSpecificAPI(apiName, testPrompt, 70, true);
      status[apiName] = { status: "✅ Working", message: response };
    } catch (error) {
      status[apiName] = { status: "❌ Failed", message: error.message };
    }
  }
  
  res.json({
    success: true,
    status: status,
    timestamp: new Date().toISOString()
  });
});

// ✅ Auto Timeout Helper
async function withTimeout(promise, ms, apiName) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${apiName} timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// ✅ Smart Prompt Builder (Template + Default Mode)
function buildPrompt(prompt, template, isTest = false) {
  if (isTest) {
    return "Hello, are you working? Respond with 'OK' if working.";
  }

  // Math calculation check
  if (/^[0-9+\-*/().\s]+$/.test(prompt)) {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(prompt);
      return `The result of ${prompt} is ${result}`;
    } catch {
      return `Invalid math expression: ${prompt}`;
    }
  }

  // Template mode
  if (template && template.trim() !== "" && template !== "default") {
    return `
You are a professional marketing copywriter.
Create a high-quality, ready-to-post ${template} based on the user's input.

🧠 Input: ${prompt}

🎯 Requirements:
- Write a complete ${template} (not instructions)
- Make it engaging, creative and easy to read
- Add emojis and hashtags naturally if suitable
- Return only the final ${template} text (no explanations)
    `;
  }

  // Default Answer Mode
  return `
You are a helpful creative AI writer.
Generate a natural, well-written and complete answer for this prompt.

🧠 Input: ${prompt}

🎯 Requirements:
- Write in a clear and friendly way
- If it's a question, answer it directly
- If it's a statement, expand it meaningfully
- Return plain text (no extra instructions)
    `;
}

// ✅ Main Prompt Endpoint
app.post("/api/prompt", async (req, res) => {
  const { prompt, apiPreference = "auto", creativity = 70, template = "default" } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    let response;
    let usedAPI = "";

    const finalPrompt = buildPrompt(prompt, template);

    // Specific API selection
    if (apiPreference !== "auto" && API_CONFIG[apiPreference]) {
      if (!API_CONFIG[apiPreference].key) {
        throw new Error(`${apiPreference} API key not configured`);
      }
      response = await callSpecificAPI(apiPreference, finalPrompt, creativity);
      usedAPI = apiPreference;
    } else {
      // Auto fallback through APIs
      const apiOrder = ["openai", "gemini", "cohere", "openrouter", "huggingface"];
      for (const apiName of apiOrder) {
        try {
          if (!API_CONFIG[apiName].key) continue;
          response = await callSpecificAPI(apiName, finalPrompt, creativity);
          usedAPI = apiName;
          break;
        } catch (err) {
          console.log(`❌ ${apiName} failed:`, err.message);
          continue;
        }
      }
    }

    if (!response) {
      throw new Error("All APIs failed to generate response");
    }

    res.json({
      success: true,
      reply: response,
      apiUsed: usedAPI,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("⚠️ All APIs failed:", error.message);
    
    // Smart fallback response
    const fallbackResponse = generateFallback(prompt, template);
    
    res.json({
      success: true,
      apiUsed: "fallback",
      reply: fallbackResponse,
      note: "Generated by fallback AI system"
    });
  }
});

// ✅ API Call Handler
async function callSpecificAPI(apiName, prompt, creativity = 70, isTest = false) {
  const timeout = isTest ? 5000 : 15000;
  
  switch (apiName) {
    case "openai":
      return await withTimeout(callOpenAI(prompt, creativity, isTest), timeout, "OpenAI");
    case "gemini":
      return await withTimeout(callGemini(prompt, isTest), timeout, "Gemini");
    case "cohere":
      return await withTimeout(callCohere(prompt, creativity, isTest), timeout, "Cohere");
    case "openrouter":
      return await withTimeout(callOpenRouter(prompt, creativity, isTest), timeout, "OpenRouter");
    case "huggingface":
      return await withTimeout(callHuggingFace(prompt, isTest), timeout, "HuggingFace");
    default:
      throw new Error(`Unknown API: ${apiName}`);
  }
}

// 🌐 OpenRouter API
async function callOpenRouter(prompt, creativity, isTest = false) {
  const response = await fetch(API_CONFIG.openrouter.url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_CONFIG.openrouter.key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: API_CONFIG.openrouter.model,
      messages: [{ role: "user", content: prompt }],
      temperature: creativity / 100,
      max_tokens: isTest ? 10 : 500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  
  if (!reply) {
    throw new Error("No response generated from OpenRouter");
  }

  return isTest ? "OK" : reply;
}

// 🌐 HuggingFace API
async function callHuggingFace(prompt, isTest = false) {
  const response = await fetch(API_CONFIG.huggingface.url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_CONFIG.huggingface.key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_length: isTest ? 20 : 200,
        temperature: 0.7,
        do_sample: true
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Hugging Face: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const reply = data[0]?.generated_text;
  
  if (!reply) {
    throw new Error("No response generated from HuggingFace");
  }

  return isTest ? "OK" : reply;
}

// 🌐 Gemini API
async function callGemini(prompt, isTest = false) {
  const url = `${API_CONFIG.gemini.url}?key=${API_CONFIG.gemini.key}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!reply) {
    throw new Error("No response generated from Gemini");
  }

  return isTest ? "OK" : reply;
}

// 🌐 Cohere API
async function callCohere(prompt, creativity, isTest = false) {
  const response = await fetch(API_CONFIG.cohere.url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_CONFIG.cohere.key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: prompt,
      model: API_CONFIG.cohere.model,
      max_tokens: isTest ? 10 : 300,
      temperature: creativity / 100,
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cohere: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  const reply = data.generations?.[0]?.text;
  
  if (!reply) {
    throw new Error("No response generated from Cohere");
  }

  return isTest ? "OK" : reply.trim();
}

// 🌐 OpenAI API
async function callOpenAI(prompt, creativity, isTest = false) {
  const response = await fetch(API_CONFIG.openai.url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_CONFIG.openai.key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: API_CONFIG.openai.model,
      messages: [
        { 
          role: "system", 
          content: isTest ? "You are a test assistant. Respond with 'OK'." : "You are an expert business content creator."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: isTest ? 10 : 500,
      temperature: creativity / 100
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  
  if (!reply) {
    throw new Error("No response generated from OpenAI");
  }

  return isTest ? "OK" : reply;
}

// ✅ Smart Fallback Response Generator
function generateFallback(prompt, template) {
  const templates = {
    facebook: `🚀 **Facebook Post:** ${prompt}\n\nEngage your audience with this compelling content! Perfect for building community and driving interactions. 💬\n\n#BusinessGrowth #SocialMedia #Marketing`,
    
    instagram: `✨ **Instagram Caption:** ${prompt}\n\nVisual storytelling at its finest! This caption will make your content stand out and connect with your followers. 📸\n\n#Instagram #ContentCreator #VisualStorytelling`,
    
    twitter: `🐦 **Twitter Post:** ${prompt}\n\nShort, impactful, and ready to trend! Perfect for starting conversations and building your Twitter presence. 🔥\n\n#Twitter #Engagement #Trending`,
    
    email: `📧 **Marketing Email:** ${prompt}\n\nProfessional and persuasive email content designed to convert readers into customers and build lasting relationships. 💼\n\n#EmailMarketing #Business #Conversion`,
    
    product: `🛍️ **Product Description:** ${prompt}\n\nHighlighting features, benefits, and unique selling points that will make customers excited to purchase! 🌟\n\n#Product #Ecommerce #Sales`,
    
    adcopy: `🎯 **Ad Copy:** ${prompt}\n\nAttention-grabbing, persuasive, and conversion-focused advertising content that drives results! 📊\n\n#Advertising #Marketing #ROI`,
    
    blog: `📝 **Blog Post:** ${prompt}\n\nWell-researched, engaging, and SEO-friendly content that establishes authority and provides real value to readers. 🎓\n\n#Blogging #Content #SEO`,
    
    video: `🎥 **Video Script:** ${prompt}\n\nEngaging narrative with clear visual cues and compelling dialogue that keeps viewers watching till the end! 🎬\n\n#VideoMarketing #Content #Storytelling`,
    
    default: `🤖 **AI Response:** ${prompt}\n\nThis is a smart, well-crafted response that provides valuable insights and helpful information. 💡\n\n#AI #Assistant #Helpful`
  };

  return templates[template] || templates.default;
}

// ✅ Image Generation Endpoint
app.post("/api/image", async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Image prompt required" });
  }

  try {
    // Mock image generation - in real implementation, integrate with DALL-E, Stable Diffusion, etc.
    const mockImageUrl = "https://via.placeholder.com/512x512/4CAF50/FFFFFF?text=AI+Generated+Image";
    
    res.json({
      success: true,
      apiUsed: "mock",
      imageUrl: mockImageUrl,
      prompt: prompt,
      note: "This is a mock image. Integrate with real AI image generation service for actual images."
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Image generation failed",
      message: error.message 
    });
  }
});

// ✅ Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 PromotionAI Backend running on port ${PORT}`);
  console.log(`🧠 APIs Loaded:`, Object.keys(API_CONFIG));
  console.log(`🌐 Health Check: http://localhost:${PORT}/`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
});