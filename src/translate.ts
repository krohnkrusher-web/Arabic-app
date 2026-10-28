import type { News, NewsSentence } from './content'
import type { NewsProgress } from './storage'

// Scores a Hebrew translation on the phone, without a server: each sentence lists the meaning parts
// it must carry, and a part counts when any of its accepted spellings shows up in the answer.

const FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }

// Spelling differences that don't change the meaning: vowel points, final letters, doubled ו/י, punctuation.
export function normalizeHebrew(text: string): string {
  return text
    .replace(/[֑-ׇ]/g, '')
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/וו/g, 'ו')
    .replace(/יי/g, 'י')
    .replace(/[^א-ת0-9]+/g, ' ')
    .trim()
}

// Hebrew glues small words to the front: ו, ה, ב, ל, כ, ש, מ. Allow up to three of them.
const PREFIX = /^[ושהבלכמ]{0,3}$/

function tokens(text: string): string[] {
  const n = normalizeHebrew(text)
  return n ? n.split(' ') : []
}

function hasWord(token: string, word: string): boolean {
  return token.endsWith(word) && PREFIX.test(token.slice(0, token.length - word.length))
}

function containsVariant(answer: string[], variant: string): boolean {
  const want = tokens(variant)
  if (!want.length) return false
  for (let i = 0; i + want.length <= answer.length; i++) {
    if (want.every((w, j) => hasWord(answer[i + j], w))) return true
  }
  return false
}

export interface SentenceResult {
  found: boolean[]
  score: number
}

export function scoreSentence(sentence: NewsSentence, answer: string): SentenceResult {
  const words = tokens(answer)
  const found = sentence.keys.map((variants) => variants.some((v) => containsVariant(words, v)))
  const score = found.length ? found.filter(Boolean).length / found.length : 0
  return { found, score }
}

// The day's score out of 100: the average over sentences.
export function totalScore(results: SentenceResult[]): number {
  if (!results.length) return 0
  return Math.round((results.reduce((sum, r) => sum + r.score, 0) / results.length) * 100)
}

// The finished day's score, or null while sentences are still left to translate.
export function newsScore(news: News, progress: NewsProgress): number | null {
  if (progress.checked < news.sentences.length) return null
  return totalScore(news.sentences.map((s, i) => scoreSentence(s, progress.answers[i] ?? '')))
}
