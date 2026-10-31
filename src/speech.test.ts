import { describe, expect, it } from 'vitest'
import { matchReply, normalizeArabic } from './speech'

const r = (ar: string, id?: string) => ({ ar, translit: '', he: '', id })

describe('normalizeArabic', () => {
  it('ignores vowel marks, stars, hamza seats and punctuation', () => {
    expect(normalizeArabic('*بَشْرَب* قَهْوة!')).toBe('بشرب قهوه')
    expect(normalizeArabic('آه، لَو سَمَحْت')).toBe('اه لو سمحت')
  })
})

describe('matchReply', () => {
  const drinks = [r('بَشْرَب قَهْوة', 'coffee'), r('بَشْرَب شاي', 'tea'), r('بَشْرَب لَيْمون', 'lemon')]

  it('finds the reply that was said, with extra words around it', () => {
    expect(matchReply(drinks, ['انا بشرب شاي لو سمحت'])?.reply.id).toBe('tea')
  })

  it('forgives one letter in longer words', () => {
    expect(matchReply(drinks, ['اشرب قهوة'])?.reply.id).toBe('coffee')
  })

  it('checks every alternative the recognizer heard', () => {
    expect(matchReply(drinks, ['بشرب شيء', 'بشرب ليمون'])?.reply.id).toBe('lemon')
  })

  it('rejects an answer that misses a word', () => {
    expect(matchReply(drinks, ['قهوة'])).toBeNull()
  })

  it('prefers the longest reply that fits', () => {
    const tasty = [r('زاكي'), r('كْتير زاكي')]
    expect(matchReply(tasty, ['كتير زاكي'])?.reply.ar).toBe('كْتير زاكي')
  })
})

describe('matchReply with keyword lists', () => {
  const taste = [
    { ...r('كْتير زاكي', 'good'), any: ['زاكي', 'طيب', 'منيح'].map((ar) => ({ ar, he: '' })) },
    { ...r('مِش زاكي', 'bad'), any: ['مش طيب', 'مش منيح', 'مر'].map((ar) => ({ ar, he: '' })) },
  ]

  it('accepts any listed way to say it', () => {
    expect(matchReply(taste, ['والله طيب كتير'])?.reply.id).toBe('good')
  })

  it('lets a negation beat the plain word', () => {
    expect(matchReply(taste, ['لا مش منيح'])?.reply.id).toBe('bad')
  })

  it('reads through prefixes like and/with/the', () => {
    const drinks = [{ ...r('بشرب قهوة', 'coffee'), any: [{ ar: 'قهوة', he: 'קפה' }] }]
    expect(matchReply(drinks, ['والقهوة لو سمحت'])?.reply.id).toBe('coffee')
    expect(matchReply(drinks, ['بالقهوه'])?.reply.id).toBe('coffee')
  })
})
