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
  title: string
  sentences: NewsSentence[]
  glossary?: { ar: string; he: string }[]
}

export interface Day {
  day: number
  root: string[]
  meaning: string
  hebrewCousin: string | null
  funFact?: string
  words: FamilyWord[]
  news?: News
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
