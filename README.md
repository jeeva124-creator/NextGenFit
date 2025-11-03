# 💪 AI Fitness Coach App

An AI-powered fitness assistant built using Next.js that generates personalized workout and diet plans using Google Gemini AI.

## 🚀 Features

- Personalized workout and diet plan generation using **Google Gemini AI** (FREE!)
- AI-powered tips and motivation
- Voice features with **Web Speech API** (Browser native, no API key needed!)
- Image generation for exercises and meals using Replicate
- PDF export
- Dark/Light mode
- Local storage for saving plans

## 🛠️ Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with:
```env
GEMINI_API_KEY=your_gemini_api_key
REPLICATE_API_TOKEN=your_replicate_api_token
```

### Getting FREE API Keys:

#### Google Gemini API Key (FREE - 60 requests/minute):
1. **IMPORTANT**: Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"** button
4. **Copy the entire API key** (starts with `AIza...` and is very long)
5. Add it to `.env.local` file in your project root:
   ```env
   GEMINI_API_KEY=AIza...your_full_key_here
   ```
6. **Restart your dev server** after adding the key
7. **Verify it works**: Visit http://localhost:3000/api/test-gemini in your browser

**Troubleshooting:**
- Make sure there are no spaces or quotes around the key
- The key should be on one line
- Make sure `.env.local` is in the project root (same folder as `package.json`)
- Restart the dev server after adding the key

#### Replicate API Token (Optional - for image generation):
1. Go to: https://replicate.com/account/api-tokens
2. Sign up (free tier available)
3. Create an API token
4. Add it to `.env.local` as `REPLICATE_API_TOKEN`

**Note:** Image generation will be disabled if Replicate token is not provided. The rest of the app works without it!

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎉 Benefits of Using Gemini

- ✅ **100% FREE** - No credit card required
- ✅ **60 requests per minute** - More than enough for personal use
- ✅ **Fast responses** - Uses Gemini 1.5 Flash (optimized for speed)
- ✅ **High quality** - Excellent fitness and nutrition advice
- ✅ **No billing setup** - Just get an API key and start using!

## 📝 Notes

- Text-to-speech uses your browser's native Web Speech API (no API key needed!)
- If Replicate token is missing, image generation features will be disabled
- All plans are saved locally in your browser
