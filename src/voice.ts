import { useEffect, useState } from 'react'

// Recorded audio comes later. Until then, the phone's own Arabic voice reads the text if it has one.
export function useArabicVoice() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const pick = () => setVoice(speechSynthesis.getVoices().find((v) => v.lang.startsWith('ar')) ?? null)
    pick()
    speechSynthesis.addEventListener('voiceschanged', pick)
    return () => speechSynthesis.removeEventListener('voiceschanged', pick)
  }, [])
  return voice
}

export function speak(voice: SpeechSynthesisVoice | null, text: string, rate = 0.85) {
  if (!voice) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice
  u.lang = voice.lang
  u.rate = rate
  speechSynthesis.speak(u)
}

// Plays one scene line and calls onEnd when it is over. Recorded audio wins over the phone's voice.
// With neither, the line just stays on screen for about as long as it would take to say.
export function playLine(voice: SpeechSynthesisVoice | null, text: string, audio: string | undefined, onEnd: () => void) {
  let ended = false
  const end = () => {
    if (ended) return
    ended = true
    onEnd()
  }
  if (audio) {
    const a = new Audio(audio)
    a.onended = end
    a.onerror = end
    a.play().catch(end)
    return () => {
      a.pause()
      ended = true
    }
  }
  if (voice) {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    u.lang = voice.lang
    u.rate = 0.85
    u.onend = end
    u.onerror = end
    speechSynthesis.speak(u)
    // Some phones never fire onend; don't leave the scene stuck.
    const safety = setTimeout(end, 1500 + text.length * 150)
    return () => {
      clearTimeout(safety)
      ended = true
      speechSynthesis.cancel()
    }
  }
  const t = setTimeout(end, 800 + text.length * 60)
  return () => clearTimeout(t)
}
