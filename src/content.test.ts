import { describe, expect, it } from 'vitest'
import { LETTERS, days, knownRoots, lookupRoot, normalizeLetter, stripVowels } from './content'

const letters = new Set(LETTERS.map((l) => l.ar))

describe('content', () => {
  it('numbers the days 1, 2, 3 in order', () => {
    expect(days.map((d) => d.day)).toEqual(days.map((_, i) => i + 1))
  })

  it.each(days.map((d) => [d.day, d] as const))('day %i is complete', (_, day) => {
    expect(day.root).toHaveLength(3)
    day.root.forEach((l) => expect(letters.has(l)).toBe(true))
    expect(day.words.length).toBeGreaterThanOrEqual(8)
    expect(day.words.length).toBeLessThanOrEqual(12)
    expect(day.hebrewCousin || day.hint).toBeTruthy()
    for (const w of day.words) {
      expect(w.ar && w.he && w.translit).toBeTruthy()
      expect(['msa', 'pal', 'both']).toContain(w.register)
    }
  })

  it('knows every day root, so a correct guess is a real root', () => {
    days.forEach((d) => expect(lookupRoot(d.root)).toBeDefined())
  })

  it('builds known roots from keyboard letters only', () => {
    knownRoots.forEach((r) => r.root.forEach((l) => expect(letters.has(l), r.root.join(' ')).toBe(true)))
  })
})

describe('normalizeLetter', () => {
  it('folds every hamza seat into one key', () => {
    expect(['أ', 'إ', 'آ', 'ؤ', 'ئ'].map(normalizeLetter)).toEqual(['ء', 'ء', 'ء', 'ء', 'ء'])
    expect(normalizeLetter('x')).toBeNull()
  })
})

it('strips vowel marks', () => {
  expect(stripVowels('كِتاب')).toBe('كتاب')
})
