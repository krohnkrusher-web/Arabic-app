// Content lives in /content/<language pair>/ as plain JSON so adding a day means adding a file.
// This edition: Hebrew speakers learning Arabic (he-ar).

export type Register = 'msa' | 'pal' | 'both'

export interface FamilyWord {
  ar: string
  he: string
  translit: string
  register: Register
  note?: string
  audio?: string
}

// One sentence of the day's news paragraph. Words built from the day's root are wrapped in *stars*.
// keys are the meaning parts a Hebrew translation must contain; each lists the accepted spellings.
export interface NewsSentence {
  ar: string
  he: string
  keys: string[][]
}

// The written path: a short news paragraph rewritten in simple MSA from a real article, which it links to.
export interface News {
  source: { name: string; url: string; date: string }
  // The newspaper section the story runs in, in Arabic, e.g. ثقافة.
  section?: string
  title: string
  sentences: NewsSentence[]
  glossary?: { ar: string; he: string }[]
}

// The spoken path: a short scene where a character talks and the learner answers out loud.
// Words built from the day's root are wrapped in *stars*, as in the news.
export interface SceneLine {
  ar: string
  translit: string
  he: string
  audio?: string
}

// One accepted spoken answer. id lets the next line react to what was chosen.
// One way to say an answer, with its own Hebrew meaning and, optionally, the character's
// next line reacting to exactly that ("عصير تفاح" gets a line about apple juice).
export interface SceneKeyword {
  ar: string
  he: string
  next?: SceneLine
}

// any lists more ways to say it: each counts when all its words were heard, with anything around them.
export interface SceneReply extends SceneLine {
  id?: string
  any?: SceneKeyword[]
  next?: SceneLine
}

export interface SceneTurn {
  say: SceneLine
  // The character's line when it reacts to the previous answer, keyed by that answer's id.
  sayAfter?: Record<string, SceneLine>
  // What to say, in Hebrew, as a short goal. The Arabic answers are never shown up front.
  intent: string
  // Accepted answers, one per kind of answer (a drink, yes, no...), each with many ways to say it.
  // The first is the model answer shown after two misses.
  replies: SceneReply[]
}

export interface Scene {
  place: string
  character: { name: string; ar: string; look: 'abu-sami' }
  setting: 'kiosk'
  turns: SceneTurn[]
  // What the character says when the answer doesn't fit.
  confused: SceneLine
  closing: SceneLine
  // The closing line when it reacts to the last answer, keyed by that answer's id.
  closingAfter?: Record<string, SceneLine>
}

export interface Day {
  day: number
  root: string[]
  meaning: string
  hebrewCousin: string | null
  funFact?: string
  words: FamilyWord[]
  news?: News
  scene?: Scene
}

export interface KnownRoot {
  root: string[]
  ar: string
  he: string
}

const dayFiles = import.meta.glob<Day>('../content/he-ar/days/*.json', { eager: true, import: 'default' })
import knownRootList from '../content/he-ar/roots.json'

export const days: Day[] = Object.keys(dayFiles)
  .sort()
  .map((path) => dayFiles[path])

export const knownRoots: KnownRoot[] = knownRootList

const knownByKey = new Map<string, KnownRoot>(knownRoots.map((r) => [r.root.join(''), r]))

export function lookupRoot(letters: string[]): KnownRoot | undefined {
  return knownByKey.get(letters.join(''))
}

// The 28 letters a root can be built from, in alphabetical order, with the
// letter Israeli schools use for each one. Hamza is a single key (ء) whatever its seat.
export const LETTERS: { ar: string; he: string }[] = [
  { ar: 'ء', he: 'א' },
  { ar: 'ب', he: 'בּ' },
  { ar: 'ت', he: 'ת' },
  { ar: 'ث', he: 'ת׳' },
  { ar: 'ج', he: 'ג׳' },
  { ar: 'ح', he: 'ח' },
  { ar: 'خ', he: 'ח׳' },
  { ar: 'د', he: 'ד' },
  { ar: 'ذ', he: 'ד׳' },
  { ar: 'ر', he: 'ר' },
  { ar: 'ز', he: 'ז' },
  { ar: 'س', he: 'ס' },
  { ar: 'ش', he: 'ש' },
  { ar: 'ص', he: 'צ' },
  { ar: 'ض', he: 'צ׳' },
  { ar: 'ط', he: 'ט' },
  { ar: 'ظ', he: 'ט׳' },
  { ar: 'ع', he: 'ע' },
  { ar: 'غ', he: 'ע׳' },
  { ar: 'ف', he: 'פ' },
  { ar: 'ق', he: 'ק' },
  { ar: 'ك', he: 'כ' },
  { ar: 'ل', he: 'ל' },
  { ar: 'م', he: 'מ' },
  { ar: 'ن', he: 'נ' },
  { ar: 'ه', he: 'ה' },
  { ar: 'و', he: 'ו' },
  { ar: 'ي', he: 'י' },
]

const LETTER_SET = new Set(LETTERS.map((l) => l.ar))

// Maps a typed character (from a physical Arabic keyboard) to a root letter, or null.
export function normalizeLetter(ch: string): string | null {
  const mapped = ({ 'أ': 'ء', 'إ': 'ء', 'آ': 'ء', 'ا': 'ء', 'ؤ': 'ء', 'ئ': 'ء', 'ى': 'ي' } as Record<string, string>)[ch] ?? ch
  return LETTER_SET.has(mapped) ? mapped : null
}

const HARAKAT = /[ً-ْٰ]/g

export function stripVowels(text: string): string {
  return text.replace(HARAKAT, '')
}
