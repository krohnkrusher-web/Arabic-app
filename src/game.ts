export const ROOT_LENGTH = 3
export const MAX_GUESSES = 6

export interface CalendarDate {
  year: number
  month: number
  day: number
}

// The one setting for launch: the date the public link shows day 1, e.g. { year: 2026, month: 11, day: 1 }.
// Every local calendar day after it is the next day. While it is null the public link stays on day 1.
export const LAUNCH_DATE: CalendarDate | null = null

export type Mark = 'correct' | 'present' | 'absent'

// Wordle scoring, including repeated letters (a root like ح ب ب).
export function scoreGuess(guess: string[], answer: string[]): Mark[] {
  const marks: Mark[] = guess.map(() => 'absent')
  const remaining = new Map<string, number>()
  guess.forEach((letter, i) => {
    if (letter === answer[i]) marks[i] = 'correct'
    else remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1)
  })
  guess.forEach((letter, i) => {
    if (marks[i] === 'correct') return
    const left = remaining.get(letter) ?? 0
    if (left > 0) {
      marks[i] = 'present'
      remaining.set(letter, left - 1)
    }
  })
  return marks
}

// 1 on the launch date, counted in the player's local calendar so the puzzle changes at their midnight.
export function dayNumberFor(date: Date, launch: CalendarDate | null = LAUNCH_DATE): number {
  if (!launch) return 1
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const start = Date.UTC(launch.year, launch.month - 1, launch.day)
  return Math.max(1, Math.floor((today - start) / 86_400_000) + 1)
}

export function contentIndexFor(dayNumber: number, contentLength: number): number {
  return (dayNumber - 1) % contentLength
}

const KEY_RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 }

export function keyboardMarks(guesses: string[][], answer: string[]): Map<string, Mark> {
  const result = new Map<string, Mark>()
  for (const guess of guesses) {
    scoreGuess(guess, answer).forEach((mark, i) => {
      const prev = result.get(guess[i])
      if (!prev || KEY_RANK[mark] > KEY_RANK[prev]) result.set(guess[i], mark)
    })
  }
  return result
}

const EMOJI: Record<Mark, string> = { correct: '🟩', present: '🟨', absent: '⬜' }

// Starts with Hebrew so chat apps lay the grid out right to left, matching the board.
export function shareText(dayNumber: number, guesses: string[][], answer: string[], won: boolean): string {
  const score = won ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`
  const grid = guesses.map((g) => scoreGuess(g, answer).map((m) => EMOJI[m]).join('')).join('\n')
  return `שורש היום ${dayNumber} · ${score}\n${grid}`
}
