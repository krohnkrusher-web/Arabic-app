import type { SceneReply } from './content'

// Speech recognition is not in TypeScript's DOM types yet; this is the part we use.
interface Recognition {
  lang: string
  maxAlternatives: number
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}

type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const canListen = () => recognitionCtor() !== null

// Palestinian Arabic first; some phones only know other Arabic dialects, so fall back to Jordanian.
const LANGS = ['ar-PS', 'ar-JO']

export type ListenResult = { ok: true; heard: string[] } | { ok: false; reason: 'no-speech' | 'denied' | 'error' }

// Listens for one utterance and resolves with everything the recognizer thought it heard.
export function listenOnce(): { result: Promise<ListenResult>; stop: () => void } {
  const Ctor = recognitionCtor()
  let current: Recognition | null = null
  const result = new Promise<ListenResult>((resolve) => {
    if (!Ctor) return resolve({ ok: false, reason: 'error' })
    const attempt = (langIndex: number) => {
      const r = new Ctor()
      current = r
      r.lang = LANGS[langIndex]
      r.maxAlternatives = 5
      r.interimResults = false
      r.continuous = false
      let settled = false
      const done = (res: ListenResult) => {
        if (settled) return
        settled = true
        resolve(res)
      }
      r.onresult = (e) => {
        const heard: string[] = []
        for (let i = 0; i < e.results.length; i++) {
          const alts = e.results[i]
          for (let j = 0; j < alts.length; j++) heard.push(alts[j].transcript)
        }
        done({ ok: true, heard })
      }
      r.onerror = (e) => {
        if (e.error === 'language-not-supported' && langIndex + 1 < LANGS.length) {
          settled = true
          attempt(langIndex + 1)
        } else if (e.error === 'not-allowed' || e.error === 'service-not-allowed') done({ ok: false, reason: 'denied' })
        else if (e.error === 'no-speech' || e.error === 'aborted') done({ ok: false, reason: 'no-speech' })
        else done({ ok: false, reason: 'error' })
      }
      r.onend = () => done({ ok: false, reason: 'no-speech' })
      r.start()
    }
    attempt(0)
  })
  return { result, stop: () => current?.abort() }
}

const HARAKAT = /[ً-ْٰـ]/g

// Spoken answers are compared without vowel marks, hamza seats or punctuation,
// since the recognizer spells the same sound in different ways.
export function normalizeArabic(text: string): string {
  return text
    .replace(/\*/g, '')
    .replace(HARAKAT, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[b.length]
}

// A word counts as said if it is in the transcript, or one letter off for words of four letters or more.
function wordHeard(word: string, heard: string[]): boolean {
  return heard.some((h) => h === word || (word.length >= 4 && distance(h, word) <= 1))
}

// The reply is matched when every word of it was heard, in any order, with anything else around it.
export function matchReply(replies: SceneReply[], transcripts: string[]): SceneReply | null {
  for (const t of transcripts) {
    const heard = normalizeArabic(t).split(' ')
    // Prefer the longest reply that fits, so "كتير زاكي" wins over "زاكي".
    const fits = replies
      .filter((r) => normalizeArabic(r.ar).split(' ').every((w) => wordHeard(w, heard)))
      .sort((a, b) => normalizeArabic(b.ar).length - normalizeArabic(a.ar).length)
    if (fits.length) return fits[0]
  }
  return null
}
