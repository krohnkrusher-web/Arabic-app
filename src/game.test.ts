import { describe, expect, it } from 'vitest'
import { contentIndexFor, dayNumberFor, keyboardMarks, scoreGuess, shareText } from './game'

describe('scoreGuess', () => {
  it('marks exact, misplaced and missing letters', () => {
    expect(scoreGuess(['ك', 'ب', 'ر'], ['ك', 'ت', 'ب'])).toEqual(['correct', 'present', 'absent'])
  })

  it('does not count a repeated guess letter twice', () => {
    expect(scoreGuess(['ب', 'ب', 'ت'], ['ك', 'ت', 'ب'])).toEqual(['present', 'absent', 'present'])
  })

  it('handles roots with a doubled letter', () => {
    expect(scoreGuess(['ب', 'ح', 'ب'], ['ح', 'ب', 'ب'])).toEqual(['present', 'present', 'correct'])
  })
})

describe('dayNumberFor', () => {
  it('starts at 1 and counts local calendar days', () => {
    expect(dayNumberFor(new Date(2026, 9, 28, 0, 1))).toBe(1)
    expect(dayNumberFor(new Date(2026, 9, 28, 23, 59))).toBe(1)
    expect(dayNumberFor(new Date(2026, 9, 29, 0, 0))).toBe(2)
    expect(dayNumberFor(new Date(2026, 11, 1, 12))).toBe(35)
  })

  it('never goes below day 1', () => {
    expect(dayNumberFor(new Date(2026, 0, 1))).toBe(1)
  })

  it('wraps around the content', () => {
    expect(contentIndexFor(1, 7)).toBe(0)
    expect(contentIndexFor(8, 7)).toBe(0)
  })
})

describe('keyboardMarks', () => {
  it('keeps the best mark seen for each letter', () => {
    const marks = keyboardMarks(
      [
        ['ب', 'ك', 'ر'],
        ['ك', 'ت', 'ر'],
      ],
      ['ك', 'ت', 'ب'],
    )
    expect(marks.get('ك')).toBe('correct')
    expect(marks.get('ب')).toBe('present')
    expect(marks.get('ر')).toBe('absent')
  })
})

describe('shareText', () => {
  it('shows colours only, never letters', () => {
    const text = shareText(3, [['ك', 'ب', 'ر'], ['ك', 'ت', 'ب']], ['ك', 'ت', 'ب'], true)
    expect(text).toBe('שורש היום 3 · 2/6\n🟩🟨⬜\n🟩🟩🟩')
  })
})
