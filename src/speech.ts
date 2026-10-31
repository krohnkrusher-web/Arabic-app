import type { SceneKeyword, SceneReply } from './content'

// Speech recognition is not in TypeScript's DOM types yet; this is the part we use.
interface RecognitionResult extends ArrayLike<{ transcript: string }> {
  isFinal: boolean
}

interface Recognition {
  lang: string
  maxAlternatives: number
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: ArrayLike<RecognitionResult> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onspeechstart: (() => void) | null
  onspeechend: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
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

// Stop on our own once the learner has said something and then gone quiet, or after a long time.
const QUIET_MS = 1600
const MAX_MS = 12000

export type ListenResult = { ok: true; heard: string[] } | { ok: false; reason: 'no-speech' | 'denied' | 'error' }

export interface ListenEvents {
  // What the recognizer thinks it hears so far, updated live.
  onHeard?: (text: string) => void
  // True while the phone detects a voice.
  onVoice?: (voice: boolean) => void
}

export interface Listening {
  result: Promise<ListenResult>
  // Stop listening and check what was heard (letting go of the button).
  finish: () => void
  // Stop and throw it away (closing the scene).
  abort: () => void
}

// Listens until finish(), or until the learner goes quiet after speaking.
// Resolves with everything the recognizer thought it heard: the whole utterance first, then each alternative.
export function startListening(events: ListenEvents = {}): Listening {
  const Ctor = recognitionCtor()
  let current: Recognition | null = null
  let finished = false
  let aborted = false
  const finish = () => {
    finished = true
    current?.stop()
  }
  const abort = () => {
    aborted = true
    current?.abort()
  }
  const result = new Promise<ListenResult>((resolve) => {
    if (!Ctor) return resolve({ ok: false, reason: 'error' })
    const attempt = (langIndex: number) => {
      const r = new Ctor()
      current = r
      r.lang = LANGS[langIndex]
      r.maxAlternatives = 5
      r.interimResults = true
      r.continuous = true
      let settled = false
      let best = ''
      const alternatives: string[] = []
      let quietTimer: ReturnType<typeof setTimeout> | undefined
      const maxTimer = setTimeout(() => r.stop(), MAX_MS)
      const done = (res: ListenResult) => {
        if (settled) return
        settled = true
        clearTimeout(quietTimer)
        clearTimeout(maxTimer)
        events.onVoice?.(false)
        resolve(res)
      }
      r.onresult = (e) => {
        const parts: string[] = []
        alternatives.length = 0
        for (let i = 0; i < e.results.length; i++) {
          const alts = e.results[i]
          if (alts.length) parts.push(alts[0].transcript)
          for (let j = 0; j < alts.length; j++) alternatives.push(alts[j].transcript)
        }
        best = parts.join(' ').trim()
        events.onHeard?.(best)
        clearTimeout(quietTimer)
        quietTimer = setTimeout(() => r.stop(), QUIET_MS)
      }
      r.onspeechstart = () => events.onVoice?.(true)
      r.onspeechend = () => events.onVoice?.(false)
      r.onerror = (e) => {
        if (e.error === 'language-not-supported' && langIndex + 1 < LANGS.length && !finished) {
          settled = true
          clearTimeout(maxTimer)
          attempt(langIndex + 1)
        } else if (e.error === 'not-allowed' || e.error === 'service-not-allowed') done({ ok: false, reason: 'denied' })
        else if (e.error === 'no-speech' || e.error === 'aborted') done({ ok: false, reason: 'no-speech' })
        else if (!best) done({ ok: false, reason: 'error' })
      }
      r.onend = () => {
        if (aborted || !best) done({ ok: false, reason: 'no-speech' })
        else done({ ok: true, heard: [best, ...alternatives] })
      }
      r.start()
      if (finished) r.stop()
    }
    attempt(0)
  })
  return { result, finish, abort }
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

// A heard word may carry "and", "with", "the" in front of it: والقهوة is still قهوة.
const PREFIXES = ['وال', 'بال', 'فال', 'لل', 'ال', 'و', 'ب', 'ف', 'ل']

function forms(word: string): string[] {
  const out = [word]
  for (const p of PREFIXES) if (word.startsWith(p) && word.length - p.length >= 2) out.push(word.slice(p.length))
  return out
}

// Short words must be exact; longer ones may be one letter off, and long ones two.
function close(heard: string, word: string): boolean {
  if (heard === word) return true
  if (word.length < 4) return false
  return distance(heard, word) <= (word.length >= 7 ? 2 : 1)
}

// 2 when the word was heard exactly (after prefixes), 1 when it was close, 0 when not at all.
function wordHeard(word: string, heard: string[]): number {
  let found = 0
  for (const h of heard)
    for (const f of forms(h)) {
      if (f === word) return 2
      if (close(f, word)) found = 1
    }
  return found
}

// A keyword counts when each of its words was heard, in any order, with anything else around it.
// Its score ranks it against the others that fit: more words first, then more exact words, then length.
function keywordScore(keyword: string, heard: string[]): number {
  const words = normalizeArabic(keyword).split(' ').filter(Boolean)
  let exact = 0
  for (const w of words) {
    const h = wordHeard(w, heard)
    if (!h) return 0
    if (h === 2) exact++
  }
  return words.length * 10000 + exact * 100 + words.join('').length
}

export const keywordsOf = (r: SceneReply): SceneKeyword[] => [{ ar: r.ar, he: r.he, next: r.next }, ...(r.any ?? [])]

export interface Match {
  reply: SceneReply
  // The exact way it was said, for its Hebrew meaning and the reaction to it.
  keyword: SceneKeyword
}

// Finds the reply the learner gave. When several fit, the most specific keyword wins:
// "مش زاكي" (not tasty) beats "زاكي" (tasty), and an exact word beats a near miss.
export function matchReply(replies: SceneReply[], transcripts: string[]): Match | null {
  for (const t of transcripts) {
    const heard = normalizeArabic(t).split(' ')
    let best: Match | null = null
    let bestScore = 0
    for (const reply of replies) {
      for (const keyword of keywordsOf(reply)) {
        const score = keywordScore(keyword.ar, heard)
        if (score > bestScore) {
          best = { reply, keyword }
          bestScore = score
        }
      }
    }
    if (best) return best
  }
  return null
}
