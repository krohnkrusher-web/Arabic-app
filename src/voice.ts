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
