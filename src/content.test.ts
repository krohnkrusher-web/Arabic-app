import { describe, expect, it } from 'vitest'
import { LETTERS, days, knownRoots, lookupRoot, normalizeLetter, stripVowels } from './content'
import { scoreSentence } from './translate'

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
    for (const w of day.words) {
      expect(w.ar && w.he && w.translit).toBeTruthy()
      expect(['msa', 'pal', 'both']).toContain(w.register)
    }
  })

  it.each(days.filter((d) => d.news).map((d) => [d.day, d.news!] as const))('day %i news is usable', (_, news) => {
    expect(news.source.url).toMatch(/^https:\/\//)
    expect(news.sentences.length).toBeGreaterThanOrEqual(2)
    const text = [news.title, ...news.sentences.map((s) => s.ar), ...(news.glossary ?? []).map((g) => g.ar)]
    // Printed like a newspaper: no vowel marks.
    text.forEach((t) => expect(stripVowels(t)).toBe(t))
    // At least one word from the day's root is highlighted.
    expect(news.sentences.some((s) => /\*[^*]+\*/.test(s.ar))).toBe(true)
    for (const s of news.sentences) {
      expect(s.keys.length).toBeGreaterThanOrEqual(3)
      // The model translation must pass its own check, or the keys are wrong.
      expect(scoreSentence(s, s.he).found).not.toContain(false)
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

describe('spoken scenes', () => {
  for (const d of days.filter((d) => d.scene)) {
    it(`day ${d.day} scene is complete`, () => {
      const turns = d.scene!.turns
      expect(turns.length).toBeGreaterThan(0)
      turns.forEach((t, i) => {
        expect(t.intent.trim()).not.toBe('')
        expect(t.replies.length).toBeGreaterThan(0)
        // Every reaction line answers a reply id from the turn before.
        const prevIds = new Set(i > 0 ? turns[i - 1].replies.map((r) => r.id) : [])
        for (const id of Object.keys(t.sayAfter ?? {})) expect(prevIds.has(id)).toBe(true)
      })
    })
  }
})
