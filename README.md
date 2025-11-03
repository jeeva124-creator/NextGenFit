# 💪 AI Fitness Coach App

An **AI-powered fitness assistant** built using **Next.js**, **Gemini API**, and **Replicate API** that generates **personalized workout and diet plans** for users.  
It also provides **AI-generated images** of exercises or meals and supports **voice narration (TTS)** for a more immersive fitness experience.

---

## 🚀 Features

### 🧍 Personalized Input
Users can provide:
- Name, Age, Gender  
- Height & Weight  
- Fitness Goal (Weight Loss / Muscle Gain / Endurance)  
- Fitness Level (Beginner / Intermediate / Advanced)  
- Workout Location (Home / Gym / Outdoor)  
- Dietary Preference (Veg / Non-Veg / Vegan / Keto)  
- Optional: Medical history, stress level, sleep quality, etc.

### 🧠 AI-Powered Plan Generation
Powered by **Gemini API**, the app dynamically generates:
- 🏋️ **Workout Plan** — exercises, sets, reps, rest time  
- 🥗 **Diet Plan** — daily meal breakdown  
- 💬 **AI Tips** — posture, motivation & wellness advice  

All responses are **fully dynamic and personalized** — no hardcoded plans.

### 🖼️ AI Image Generation
Using **Replicate API**, users can view AI-generated images for:
- “Barbell Squat” → realistic gym pose  
- “Grilled Chicken Salad” → healthy meal visualization  

### 🔊 Voice Features (Optional)
- Text-to-speech (TTS) using **ElevenLabs API**  
- Reads out your workout or diet plan aloud  

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js 14 (App Router) |
| **LLM (Text)** | Gemini API |
| **Image Generation** | Replicate API |
| **Voice (Optional)** | ElevenLabs API |
| **Styling** | Tailwind CSS + Framer Motion |
| **Auth / DB (Optional)** | NextAuth.js + MongoDB / PostgreSQL |

---

## ⚙️ Environment Variables

Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_APP_NAME="AI Fitness Coach"

# Gemini API (Text Generation)
GEMINI_API_KEY=your_gemini_api_key

# Replicate API (Image Generation)
REPLICATE_API_TOKEN=your_replicate_token


