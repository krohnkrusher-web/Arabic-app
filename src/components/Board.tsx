import { lookupRoot } from '../content'
import { MAX_GUESSES, ROOT_LENGTH, scoreGuess } from '../game'

interface Props {
  guesses: string[][]
  current: string[]
  answer: string[]
  shake: boolean
}

export function Board({ guesses, current, answer, shake }: Props) {
  const rows = []
  for (let r = 0; r < MAX_GUESSES; r++) {
    const done = r < guesses.length
    const isCurrent = r === guesses.length
    const letters = done ? guesses[r] : isCurrent ? current : []
    const marks = done ? scoreGuess(guesses[r], answer) : null
    // Wrong guesses that are real roots still teach a word.
    const known = done && marks!.some((m) => m !== 'correct') ? lookupRoot(guesses[r]) : undefined
    rows.push(
      <div className="board-row" key={r}>
        <div />
        <div className={`tiles ${isCurrent && shake ? 'shake' : ''}`}>
          {Array.from({ length: ROOT_LENGTH }, (_, i) => (
            <div
              key={i}
              className={`tile ${marks ? marks[i] : letters[i] ? 'filled' : ''}`}
              style={marks ? { animationDelay: `${i * 120}ms` } : undefined}
            >
              {letters[i] ?? ''}
            </div>
          ))}
        </div>
        <div className="row-word">
          {known && (
            <>
              <span className="ar">{known.ar}</span>
              <span className="row-word-he">{known.he}</span>
            </>
          )}
        </div>
      </div>,
    )
  }
  return <div className="board">{rows}</div>
}
