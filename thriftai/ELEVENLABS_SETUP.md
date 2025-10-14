# ElevenLabs TTS Setup Guide

## Overview
ThriftAI now uses ElevenLabs for ultra-realistic American voice synthesis for Gus, the AI shopkeeper chatbot.

**Voice Quality**: 90%+ human-like | Natural American accent | Warm and friendly

## Quick Setup (3 steps)

### 1. Get Your Free ElevenLabs API Key

1. Go to **https://elevenlabs.io/**
2. Click **Sign Up** (free tier includes 10,000 characters/month)
3. After signing up, go to **https://elevenlabs.io/app/settings/api-keys**
4. Click **Create API Key**
5. Copy your API key (starts with `sk_...` or similar format)

### 2. Add API Key to Environment

Open `/thriftai/.env.local` and replace the placeholder:

```bash
# Find this line:
ELEVENLABS_API_KEY="your-elevenlabs-api-key"

# Replace with your actual key:
ELEVENLABS_API_KEY="sk_YOUR_ACTUAL_KEY_HERE"
```

### 3. Restart Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Testing Voice Quality

1. Open **http://localhost:3000**
2. Click the **chat icon** on the right to open Gus chatbot
3. Enable audio by clicking the **speaker icon** (should be green)
4. Type a message or click a conversation starter
5. Gus will respond with ultra-realistic American voice

**Test queries:**
- "Tell me about yourself"
- "I need a laptop under $700"
- "Show me some vintage designer items"

## Voice Configuration

**Current voice**: Adam (pNInz6obpgDQGcFmaJgB)
- **Character**: Wise older American man
- **Tone**: Warm, friendly, experienced
- **Perfect for**: Gus the shopkeeper (40 years experience)

**Settings** (in `/src/app/api/tts/route.ts`):
```typescript
{
  stability: 0.5,        // Natural variation
  similarity_boost: 0.75, // Voice consistency
  style: 0.5,            // Expressive but not over-the-top
  use_speaker_boost: true // Enhanced clarity
}
```

## Free Tier Limits

- **10,000 characters/month** FREE
- Average message: ~100 characters
- **~100 voice messages per month**

**Fallback**: If quota exceeded, system automatically falls back to:
1. Google Cloud TTS (1M chars/month)
2. Browser Web Speech API (unlimited but robotic)

## Troubleshooting

### Voice not working?

1. **Check console logs** (F12 → Console tab)
   - Look for: `🎤 Using ELEVENLABS TTS API`
   - If you see `⚠️ ELEVENLABS_API_KEY not configured`, check step 2

2. **Check API key is valid**
   - Go to https://elevenlabs.io/app/settings/api-keys
   - Verify key is active

3. **Check audio is enabled**
   - Click speaker icon in chat header (should be green/highlighted)

4. **Check quota**
   - Go to https://elevenlabs.io/app/usage
   - If over 10K chars, wait for monthly reset or upgrade plan

### Still using robotic voice?

If you hear a mechanical browser voice instead of Adam:
- The system is using Web Speech API fallback
- Check console for error messages
- Verify `.env.local` has correct API key
- Restart dev server

## Advanced: Changing Voice

Want a different voice for Gus?

1. Browse voices at **https://elevenlabs.io/voice-library**
2. Click a voice → Copy Voice ID
3. Edit `/src/app/api/tts/route.ts` line 154:

```typescript
// Before:
const voiceId = 'pNInz6obpgDQGcFmaJgB' // Adam voice

// After:
const voiceId = 'YOUR_NEW_VOICE_ID' // New voice
```

**Recommended American male voices:**
- **Adam** (current): Wise older man - PERFECT for Gus
- **Josh**: Young energetic American
- **Antoni**: Warm well-rounded American
- **Sam**: Dynamic raspy American

## Files Modified

- ✅ `/src/components/ChatSidebar.tsx` - Changed provider to 'elevenlabs'
- ✅ `/src/lib/services/ttsService.ts` - Set ElevenLabs as default
- ✅ `/src/app/api/tts/route.ts` - Already configured with Adam voice
- ✅ `/.env.local` - Added ELEVENLABS_API_KEY placeholder

## Support

- **ElevenLabs Docs**: https://elevenlabs.io/docs
- **ElevenLabs Discord**: https://discord.gg/elevenlabs
- **ThriftAI Issues**: Create issue with logs from console

---

**Status**: ✅ READY TO USE (just add API key)
**Voice Quality**: 🎤 90%+ human-like
**Cost**: 💰 FREE (10K chars/month)
