# 🎤 Natural Text-to-Speech Setup Guide

The app now uses **natural-sounding AI voices** instead of the mechanical browser TTS!

## 🎯 What Changed?

**Before**: Mechanical, robotic voice using `window.speechSynthesis`
**After**: Natural, human-like voice using Google Cloud TTS or ElevenLabs

## 🔧 Setup Options

### Option 1: Google Cloud Text-to-Speech (RECOMMENDED)

**FREE TIER**: 1 million WaveNet characters per month
**Voice Quality**: ⭐⭐⭐⭐⭐ Excellent

#### Setup Steps:

1. **Get API Key**:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create a new project (or select existing)
   - Enable "Cloud Text-to-Speech API"
   - Create credentials → API Key
   - Copy your API key

2. **Add to Environment**:
   ```bash
   # Add to .env.local or .env.development
   GOOGLE_CLOUD_TTS_API_KEY=your_api_key_here
   ```

3. **Restart Dev Server**:
   ```bash
   npm run dev
   ```

4. **Test**: Open the chat and listen to Gus's voice - much more natural!

---

### Option 2: ElevenLabs (PREMIUM QUALITY)

**FREE TIER**: 10,000 characters per month
**Voice Quality**: ⭐⭐⭐⭐⭐ Best quality (most human-like)

#### Setup Steps:

1. **Get API Key**:
   - Go to https://elevenlabs.io/
   - Sign up for free account
   - Go to Profile → API Keys
   - Copy your API key

2. **Add to Environment**:
   ```bash
   # Add to .env.local or .env.development
   ELEVENLABS_API_KEY=your_api_key_here
   ```

3. **Restart Dev Server**:
   ```bash
   npm run dev
   ```

---

### Option 3: No Setup Required (Fallback)

If no API keys are configured, the app will automatically fall back to:
- **Enhanced Web Speech API** with better voice selection
- Still works, but less natural than Google/ElevenLabs

## 🎨 Voice Characteristics

The TTS service is configured for **Gus - The Old Shopkeeper**:
- **Rate**: 0.9 (slightly slower for wisdom effect)
- **Pitch**: 0.8 (lower pitch for older voice)
- **Volume**: 0.8 (comfortable listening level)

## 🧪 Testing

1. Open http://localhost:3000
2. Click the chat button or open the sidebar
3. Enable audio using the volume icon
4. Type a message or wait for Gus's welcome message
5. Listen to the natural voice!

## 📊 API Usage Tracking

### Google Cloud TTS
- Check usage at: https://console.cloud.google.com/apis/api/texttospeech.googleapis.com/quotas
- Monitor: 1M free WaveNet chars/month

### ElevenLabs
- Check usage at: https://elevenlabs.io/usage
- Monitor: 10K free chars/month

## 🔄 Switching Providers

To switch between providers, edit:
- `/src/components/ChatSidebar.tsx` line 43
- `/src/components/ChatWidget.tsx` line 44

Change `provider: 'google'` to `provider: 'elevenlabs'`

## 🐛 Troubleshooting

### "Google Cloud TTS not configured" error
- Make sure `GOOGLE_CLOUD_TTS_API_KEY` is in your `.env` file
- Restart the dev server after adding the key
- Check the API key is correct (starts with valid characters)

### Audio doesn't play
- Check browser console for errors
- Make sure audio is enabled (volume icon should be highlighted)
- Try clicking the audio toggle to test
- Check browser permissions for audio playback

### Voice sounds mechanical
- This means the fallback Web Speech API is being used
- Configure Google Cloud or ElevenLabs API keys for natural voices
- Check the console for API errors

## 💰 Cost Comparison

| Provider | Free Tier | Paid (if needed) | Quality |
|----------|-----------|------------------|---------|
| Google Cloud TTS | 1M chars/month | $16/1M chars | ⭐⭐⭐⭐⭐ |
| ElevenLabs | 10K chars/month | $5/30K chars | ⭐⭐⭐⭐⭐ |
| Web Speech API | Unlimited FREE | N/A | ⭐⭐⭐ |

## 🎯 Recommendation

For development: **Use Google Cloud TTS** (generous free tier)
For production: **Use Google Cloud TTS** (best price/performance)
For premium quality: **Use ElevenLabs** (highest quality voices)

## 📝 Notes

- The TTS service automatically handles errors and falls back gracefully
- Audio is cached for better performance
- The service can be extended to support more providers
- Voice settings can be customized per message if needed

## 🚀 Next Steps

1. Configure your preferred API key
2. Test the natural voice
3. Enjoy chatting with Gus in a much more natural way!

---

**Implemented by**: Claude Code Assistant
**Date**: October 2025
**Status**: ✅ Production Ready
