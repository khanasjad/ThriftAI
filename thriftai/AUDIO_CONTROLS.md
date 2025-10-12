# 🎧 Audio Controls & Voice Selection Guide

## 🔊 Basic Audio Controls (Available Now)

### Toggle Audio On/Off
1. **In Chat Sidebar** (right side of screen):
   - Look for the **speaker icon** (🔊) in the top-right corner
   - Click to toggle audio on/off
   - Green icon = audio enabled
   - Gray icon = audio disabled

2. **In Chat Widget** (floating chat button):
   - Open the chat by clicking the floating button
   - Look for the **speaker icon** in the header
   - Click to toggle audio on/off

### Audio Toggle Behavior
- **When Enabled**: Gus will speak all responses automatically
- **When Disabled**: Silent mode (no voice output)
- **Toggle During Speech**: Immediately stops current audio

## 🎤 Changing TTS Provider

### Quick Change (For Developers)

Edit these files to change the provider:

**File 1**: `/src/components/ChatSidebar.tsx` (line ~42)
**File 2**: `/src/components/ChatWidget.tsx` (line ~44)

```typescript
// Change this line:
provider: 'google',  // Options: 'google', 'elevenlabs', 'webspeech'
```

Available options:
- `'google'` - Google Cloud TTS (most natural, 1M free chars/month)
- `'elevenlabs'` - ElevenLabs (premium quality, 10K free chars/month)
- `'webspeech'` - Browser built-in (unlimited, but less natural)

After changing, save the file and the browser will auto-reload.

## 🎨 Customizing Voice Parameters

### Current Voice Settings (Gus - Old Shopkeeper)

```typescript
{
  provider: 'google',
  rate: 0.9,     // Speed: 0.1 (very slow) to 10.0 (very fast)
  pitch: 0.8,    // Pitch: 0.0 (low) to 2.0 (high)
  volume: 0.8    // Volume: 0.0 (silent) to 1.0 (max)
}
```

### How to Adjust

Edit `/src/components/ChatSidebar.tsx` around line 42:

```typescript
await ttsService.speak(text, {
  provider: 'google',
  rate: 1.2,     // Make Gus talk faster
  pitch: 1.0,    // Make voice higher
  volume: 1.0    // Max volume
})
```

### Voice Personality Presets

**Wise Old Shopkeeper (Current)**
```typescript
rate: 0.9, pitch: 0.8, volume: 0.8
```

**Energetic Salesperson**
```typescript
rate: 1.2, pitch: 1.1, volume: 1.0
```

**Calm Assistant**
```typescript
rate: 0.8, pitch: 1.0, volume: 0.7
```

**Professional Advisor**
```typescript
rate: 1.0, pitch: 0.9, volume: 0.9
```

## 🔧 Advanced: Selecting Specific Voices

### Google Cloud TTS Voices

Edit `/src/app/api/tts/route.ts` around line 55:

**Available Male Voices (en-US):**
```typescript
name: 'en-US-Neural2-J'  // Current - Wise older man (DEFAULT)
name: 'en-US-Neural2-A'  // Young male
name: 'en-US-Neural2-D'  // Professional male
name: 'en-US-Neural2-I'  // Energetic male
```

**Available Female Voices (en-US):**
```typescript
name: 'en-US-Neural2-C'  // Professional female
name: 'en-US-Neural2-E'  // Friendly female
name: 'en-US-Neural2-F'  // Young female
name: 'en-US-Neural2-G'  // Warm female
name: 'en-US-Neural2-H'  // Energetic female
```

Full voice list: https://cloud.google.com/text-to-speech/docs/voices

### ElevenLabs Voices

Edit `/src/app/api/tts/route.ts` around line 145:

**Available Voices:**
```typescript
voiceId = 'pNInz6obpgDQGcFmaJgB'  // Adam (Current - Wise man)
voiceId = '21m00Tcm4TlvDq8ikWAM'  // Rachel (Professional female)
voiceId = 'AZnzlk1XvdvUeBnXmlld'  // Domi (Confident female)
voiceId = 'EXAVITQu4vr4xnSDxMaL'  // Bella (Soft female)
voiceId = 'ErXwobaYiN019PkySvjV'  // Antoni (Well-rounded male)
voiceId = 'MF3mGyEYCl7XYWbV9V6O'  // Elli (Emotional female)
voiceId = 'TxGEqnHWrfWFTfGW9XjX'  // Josh (Deep male)
voiceId = 'VR6AewLTigWG4xSOukaG'  // Arnold (Crisp male)
voiceId = 'pqHfZKP75CvOlQylNhV4'  // Bill (Strong male)
```

Full voice library: https://elevenlabs.io/voice-library

### Web Speech API Voices

The system automatically selects the best available voice from your browser. To see all available voices:

1. Open browser console (F12)
2. Type: `speechSynthesis.getVoices()`
3. Look for voices with "Google" or "Microsoft" in the name

## 🎭 Creating Voice Profiles

Want different voices for different scenarios? Create profiles:

**File**: `/src/lib/services/ttsService.ts`

Add this after line 12:

```typescript
export const VOICE_PROFILES = {
  gus: {
    provider: 'google' as TTSProvider,
    rate: 0.9,
    pitch: 0.8,
    volume: 0.8,
    voice: 'en-US-Neural2-J'
  },

  assistant: {
    provider: 'google' as TTSProvider,
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voice: 'en-US-Neural2-C'
  },

  energetic: {
    provider: 'elevenlabs' as TTSProvider,
    rate: 1.2,
    pitch: 1.1,
    volume: 1.0,
    voice: 'Josh'
  }
}
```

Then use:
```typescript
await ttsService.speak(text, VOICE_PROFILES.gus)
```

## 🧪 Testing Different Voices

### Quick Test Script

Create `/scripts/test-tts.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>TTS Voice Tester</title>
</head>
<body>
  <h1>Test Different Voices</h1>

  <label>Provider:
    <select id="provider">
      <option value="google">Google Cloud</option>
      <option value="elevenlabs">ElevenLabs</option>
      <option value="webspeech">Web Speech</option>
    </select>
  </label><br><br>

  <label>Rate (Speed):
    <input type="range" id="rate" min="0.5" max="2" step="0.1" value="0.9">
    <span id="rateValue">0.9</span>
  </label><br><br>

  <label>Pitch:
    <input type="range" id="pitch" min="0.5" max="2" step="0.1" value="0.8">
    <span id="pitchValue">0.8</span>
  </label><br><br>

  <label>Volume:
    <input type="range" id="volume" min="0" max="1" step="0.1" value="0.8">
    <span id="volumeValue">0.8</span>
  </label><br><br>

  <textarea id="text" rows="4" cols="50">Hey! I'm Gus. Been running this shop for 40 years.</textarea><br><br>

  <button onclick="testVoice()">Test Voice</button>

  <script>
    // Update value displays
    document.getElementById('rate').oninput = function() {
      document.getElementById('rateValue').textContent = this.value
    }
    document.getElementById('pitch').oninput = function() {
      document.getElementById('pitchValue').textContent = this.value
    }
    document.getElementById('volume').oninput = function() {
      document.getElementById('volumeValue').textContent = this.value
    }

    async function testVoice() {
      const provider = document.getElementById('provider').value
      const rate = parseFloat(document.getElementById('rate').value)
      const pitch = parseFloat(document.getElementById('pitch').value)
      const volume = parseFloat(document.getElementById('volume').value)
      const text = document.getElementById('text').value

      const response = await fetch('http://localhost:3000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, provider, rate, pitch })
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.volume = volume
        audio.play()
      } else {
        alert('Error: ' + response.statusText)
      }
    }
  </script>
</body>
</html>
```

Open in browser: `file:///path/to/test-tts.html`

## 🎯 Recommended Voice Settings

### For E-commerce (Gus)
- **Provider**: Google Cloud TTS
- **Voice**: en-US-Neural2-J (wise older man)
- **Rate**: 0.9
- **Pitch**: 0.8
- **Volume**: 0.8

### For Professional Support
- **Provider**: Google Cloud TTS
- **Voice**: en-US-Neural2-C (professional female)
- **Rate**: 1.0
- **Pitch**: 1.0
- **Volume**: 0.8

### For Young/Energetic Brand
- **Provider**: ElevenLabs
- **Voice**: Josh or Bella
- **Rate**: 1.2
- **Pitch**: 1.1
- **Volume**: 1.0

## 🔍 Finding the Perfect Voice

1. **Start with Google Cloud** - most natural, largest free tier
2. **Test 3-5 different voices** - use the test script above
3. **Adjust rate/pitch** - small changes make big differences
4. **Get feedback** - ask team/users which sounds best
5. **Optimize for brand** - match voice to your brand personality

## 💡 Pro Tips

- **Slower = More Trustworthy**: Rate 0.8-0.9 for important info
- **Lower Pitch = More Authority**: Pitch 0.7-0.9 for professional
- **Consistent Volume**: Keep at 0.8 for comfortable listening
- **Test on Mobile**: Voice quality varies by device
- **Monitor Usage**: Check API quotas regularly

## 🐛 Troubleshooting

**Voice sounds the same after changes?**
- Hard refresh browser (Cmd/Ctrl + Shift + R)
- Clear browser cache
- Check console for errors

**Can't hear audio?**
- Check audio toggle is enabled (green speaker icon)
- Check browser volume settings
- Look for audio permission prompts
- Test with test-tts.html script

**API errors?**
- Verify API keys are set correctly
- Check API quotas/limits
- Look at console logs for details

---

**Need Help?** Check the browser console (F12) for detailed TTS logs.
