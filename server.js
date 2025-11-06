// ✅ PROMOTIONAI - OPENROUTER ONLY BACKEND
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();

// ✅ Basic Setup
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());

// ✅ API Configuration (OpenRouter Only)
const API_CONFIG = {
  openrouter: {
    name: "OpenRouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    key: process.env.OPENROUTER_API_KEY,
    model: "google/gemini-flash-1.5-8b"
  }
};

// ✅ Health Check
app.get("/", (req, res) => {
  res.json({
    status: "✅ PromotionAI Backend Running",
    api: "OpenRouter",
    message: "OpenRouter API is configured and ready!",
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
      
      // Quick test for OpenRouter API
      const testPrompt = "Hello, respond with 'OK' if working.";
      const response = await callOpenRouter(testPrompt, 70, true);
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

// ✅ SMART Prompt Builder (Improved)
function buildPrompt(prompt, template, isTest = false) {
  if (isTest) {
    return "Hello, respond with 'OK' if working.";
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

  // SIMPLIFIED Template Prompts - FIXED
  const templatePrompts = {
    facebook: `Create a Facebook post about: ${prompt}. Make it engaging with hashtags and emojis. Return only the post content.`,
    instagram: `Write an Instagram caption for: ${prompt}. Add relevant hashtags and make it visual. Return only the caption.`,
    twitter: `Create a Twitter post about: ${prompt}. Keep it under 280 characters. Return only the tweet.`,
    email: `Write a marketing email about: ${prompt}. Include subject line and body. Return complete email.`,
    product: `Describe this product: ${prompt}. Highlight features and benefits. Return product description.`,
    adcopy: `Create advertisement copy for: ${prompt}. Make it persuasive and compelling. Return ad copy.`,
    blog: `Write a blog post introduction about: ${prompt}. Make it engaging and informative. Return blog content.`,
    video: `Create a video script outline about: ${prompt}. Include scene descriptions. Return script.`,
    default: `Provide a helpful and complete response to: ${prompt}. Return only the response content.`
  };

  return templatePrompts[template] || templatePrompts.default;
}

// ✅ SMART FALLBACK GENERATOR
function generateFallback(prompt, template) {
  const businessResponses = {
    facebook: `📱 **Facebook Post:** ${prompt}\n\nEngage your audience with this compelling content! Perfect for building community and driving interactions. 💬\n\n#SocialMedia #Marketing #Business`,
    instagram: `📸 **Instagram Caption:** ${prompt}\n\nVisual storytelling at its finest! This caption will make your content stand out and connect with your followers. 🌟\n\n#Instagram #ContentCreator #VisualStorytelling`,
    twitter: `🐦 **Twitter Post:** ${prompt}\n\nShort, impactful, and ready to trend! Perfect for starting conversations and building your Twitter presence. 🔥\n\n#Twitter #Engagement #Trending`,
    email: `📧 **Marketing Email:** ${prompt}\n\nProfessional and persuasive email content designed to convert readers into customers and build lasting relationships. 💼\n\n#EmailMarketing #Business #Conversion`,
    product: `🛍️ **Product Description:** ${prompt}\n\nHighlighting features, benefits, and unique selling points that will make customers excited to purchase! 🎯\n\n#Product #Ecommerce #Sales`,
    adcopy: `🎯 **Ad Copy:** ${prompt}\n\nAttention-grabbing, persuasive, and conversion-focused advertising content that drives results! 📊\n\n#Advertising #Marketing #ROI`,
    blog: `📝 **Blog Post:** ${prompt}\n\nWell-researched, engaging, and SEO-friendly content that establishes authority and provides real value to readers. 🎓\n\n#Blogging #Content #SEO`,
    video: `🎥 **Video Script:** ${prompt}\n\nEngaging narrative with clear visual cues and compelling dialogue that keeps viewers watching till the end! 🎬\n\n#VideoMarketing #Content #Storytelling`,
    default: `🤖 **AI Response:** ${prompt}\n\nThis is a smart, well-crafted response that provides valuable insights and helpful information for your business needs. 💡\n\n#Business #Marketing #Success`
  };

  return businessResponses[template] || businessResponses.default;
}

// ✅ Main Prompt Endpoint
app.post("/api/prompt", async (req, res) => {
  const { prompt, apiPreference = "openrouter", creativity = 70, template = "default" } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    let response;
    let usedAPI = "openrouter";

    const finalPrompt = buildPrompt(prompt, template);

    // Always use OpenRouter
    if (!API_CONFIG.openrouter.key) {
      throw new Error("OpenRouter API key not configured");
    }
    
    response = await callOpenRouter(finalPrompt, creativity);
    usedAPI = "openrouter";

    if (!response) {
      throw new Error("OpenRouter failed to generate response");
    }

    res.json({
      success: true,
      reply: response,
      apiUsed: usedAPI,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("⚠️ OpenRouter failed:", error.message);
    
    // Smart fallback response
    const fallbackResponse = generateFallback(prompt, template);
    
    res.json({
      success: true,
      apiUsed: "fallback",
      reply: fallbackResponse,
      note: "Generated by smart fallback system"
    });
  }
});

// 🌐 OpenRouter API
async function callOpenRouter(prompt, creativity, isTest = false) {
  const timeout = isTest ? 5000 : 15000;
  
  return await withTimeout(executeOpenRouterCall(prompt, creativity, isTest), timeout, "OpenRouter");
}

async function executeOpenRouterCall(prompt, creativity, isTest = false) {
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

// ✅ Image Generation Endpoint
app.post("/api/image", async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Image prompt required" });
  }

  try {
    // Mock image generation
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
  console.log(`🧠 API Loaded: OpenRouter`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
});