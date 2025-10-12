# 🇺🇸 American Voice Options for Gus

## ✅ FIXED: Natural American Old Man Voice

**Problem**: Voice sounded Russian/foreign (pitch was too low at 0.8)
**Solution**: Changed to natural American settings

### Current Settings (American Old Man)
```typescript
Voice: 'en-US-Wavenet-D'
Rate: 0.95  (slightly slower, wise)
Pitch: 1.0  (natural American tone)
Volume: 0.85
```

This will sound like a **genuine American shopkeeper** - mature, authoritative, and friendly!

---

## 🎤 Top 5 American Male Voices

If you want to try different American voices, edit `/src/app/api/tts/route.ts` line 88:

### 1. **en-US-Wavenet-D** (CURRENT - RECOMMENDED)
```typescript
name: 'en-US-Wavenet-D'  // Deep, mature American male
```
✅ **Best for**: Old shopkeeper, authoritative, trustworthy
- Natural American accent
- Mature, deep voice
- Clear and professional

### 2. **en-US-Journey-D** (Alternative #1)
```typescript
name: 'en-US-Journey-D'  // Conversational American male
```
✅ **Best for**: Friendly conversation, natural speech
- Most natural-sounding
- Conversational style
- Warm and approachable

### 3. **en-US-Wavenet-J** (Alternative #2)
```typescript
name: 'en-US-Wavenet-J'  // Standard American male
```
✅ **Best for**: Professional, clear, neutral
- Standard American accent
- Professional tone
- Easy to understand

### 4. **en-US-Wavenet-A** (Alternative #3)
```typescript
name: 'en-US-Wavenet-A'  // Young American male
```
✅ **Best for**: Energetic, youthful brand
- Younger sounding
- Energetic and upbeat
- Modern American accent

### 5. **en-US-Wavenet-B** (Alternative #4)
```typescript
name: 'en-US-Wavenet-B'  // Mature American male
```
✅ **Best for**: Wise advisor, experienced voice
- Mature and experienced
- Trustworthy tone
- Classic American voice

---

## 🎨 Voice Settings for Different Personalities

### Wise Old Shopkeeper (CURRENT)
```typescript
{
  voice: 'en-US-Wavenet-D',
  rate: 0.95,
  pitch: 1.0,
  volume: 0.85
}
```
**Sounds like**: A 60-year-old American shopkeeper who's seen it all

### Friendly American Guy
```typescript
{
  voice: 'en-US-Journey-D',
  rate: 1.05,
  pitch: 1.0,
  volume: 0.9
}
```
**Sounds like**: Your friendly American neighbor helping out

### Professional American Advisor
```typescript
{
  voice: 'en-US-Wavenet-J',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.85
}
```
**Sounds like**: A professional American consultant

### Texas Shopkeeper (Southern)
```typescript
{
  voice: 'en-US-Wavenet-D',
  rate: 0.9,
  pitch: 0.95,
  volume: 0.85
}
```
**Sounds like**: A Southern American with a Texas drawl

---

## ❌ What NOT to Do (Sounds Russian/Foreign)

**DON'T use these settings:**
```typescript
{
  pitch: 0.8,  // ❌ TOO LOW - sounds Russian
  rate: 0.7,   // ❌ TOO SLOW - sounds robotic
  pitch: 0.6   // ❌ WAY TOO LOW - sounds like villain
}
```

**Why it sounded Russian before:**
- Pitch at 0.8 is too low for American English
- Made the voice sound Eastern European/Russian
- American voices work best at pitch 0.95-1.1

---

## 🧪 Test the New Voice

### Option 1: Test in Voice Tester
1. Open http://localhost:3000/test-voice.html
2. Select "Google Cloud TTS"
3. Settings are already set to American voice
4. Click "Test Voice"

### Option 2: Test in Chat
1. Open http://localhost:3000
2. Open chat sidebar (right side)
3. Enable audio (speaker icon)
4. Type a message or wait for auto-analysis
5. Listen to Gus's new American voice!

---

## 🔧 Quick Change Guide

### To Change Voice:
1. Open `/src/app/api/tts/route.ts`
2. Go to line 88
3. Change `name: 'en-US-Wavenet-D'` to another voice from the list above
4. Save file (auto-reloads)
5. Test!

### To Adjust Settings:
1. Open `/src/components/ChatSidebar.tsx`
2. Go to line 44-46
3. Adjust `rate`, `pitch`, `volume`
4. Save file (auto-reloads)
5. Test!

---

## 💡 Pro Tips for American Voice

1. **Keep pitch at 0.95-1.1** for natural American sound
2. **Rate at 0.9-1.0** for comfortable listening
3. **Use Wavenet voices** (better quality than Standard)
4. **Use Journey voices** for most natural conversation
5. **Test with real American phrases** like "Howdy!" or "Y'all come back now"

---

## 🎯 Recommended: Current Setup

The current setup is **perfect for an American old shopkeeper**:

```typescript
// In route.ts line 88:
name: 'en-US-Wavenet-D'

// In ChatSidebar.tsx line 44:
rate: 0.95,
pitch: 1.0,
volume: 0.85
```

This sounds like a **mature American man** with experience and authority - perfect for Gus!

---

## 🚀 Try It Now!

The voice is already fixed and ready to test:
1. Refresh your browser at http://localhost:3000
2. Open the chat
3. Enable audio
4. Listen to Gus's new **authentic American voice**!

No more Russian accent - it's 100% American now! 🇺🇸
