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
    expect(matchReply(drinks, ['انا بشرب شاي لو سمحت'])?.id).toBe('tea')
  })

  it('forgives one letter in longer words', () => {
    expect(matchReply(drinks, ['اشرب قهوة'])?.id).toBe('coffee')
  })

  it('checks every alternative the recognizer heard', () => {
    expect(matchReply(drinks, ['بشرب شيء', 'بشرب ليمون'])?.id).toBe('lemon')
  })

  it('rejects an answer that misses a word', () => {
    expect(matchReply(drinks, ['قهوة'])).toBeNull()
  })

  it('prefers the longest reply that fits', () => {
    const tasty = [r('زاكي'), r('كْتير زاكي')]
    expect(matchReply(tasty, ['كتير زاكي'])?.ar).toBe('كْتير زاكي')
  })
})
