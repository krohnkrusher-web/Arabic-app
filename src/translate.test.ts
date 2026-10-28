import { describe, expect, it } from 'vitest'
import { normalizeHebrew, scoreSentence, totalScore } from './translate'

const sentence = {
  ar: '',
  he: 'הרשתות מאבדות כ־23 אחוז ממי השתייה בגלל דליפות.',
  keys: [['מאבדות', 'אובדים'], ['23'], ['מי שתייה', 'שתייה'], ['דליפות', 'נזילות']],
}

describe('normalizeHebrew', () => {
  it('ignores vowel points, final letters and doubled letters', () => {
    expect(normalizeHebrew('שָׁלוֹם, עולם!')).toBe(normalizeHebrew('שלומ עולמ'))
    expect(normalizeHebrew('שתייה')).toBe(normalizeHebrew('שתיה'))
  })
})

describe('scoreSentence', () => {
  it('gives full marks for every meaning part, with prefixes and synonyms', () => {
    expect(scoreSentence(sentence, 'כ-23% ממי השתיה אובדים בגלל נזילות').score).toBe(1)
  })

  it('gives part marks for what is there', () => {
    const r = scoreSentence(sentence, 'הם מאבדים מים')
    expect(r.found).toEqual([false, false, false, false])
    expect(scoreSentence(sentence, 'מאבדות 23').score).toBe(0.5)
  })

  it('allows Hebrew prefixes but no other letters before a word', () => {
    expect(scoreSentence({ ...sentence, keys: [['לב']] }, 'כלב').score).toBe(1)
    expect(scoreSentence({ ...sentence, keys: [['לב']] }, 'חלב').score).toBe(0)
  })
})

it('averages sentences out of 100', () => {
  expect(totalScore([{ found: [], score: 1 }, { found: [], score: 0.5 }])).toBe(75)
})
