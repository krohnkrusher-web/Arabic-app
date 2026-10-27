import { LETTERS } from '../content'
import type { Mark } from '../game'

interface Props {
  marks: Map<string, Mark>
  onLetter: (letter: string) => void
  onEnter: () => void
  onDelete: () => void
  disabled: boolean
}

const PER_ROW = 7

export function Keyboard({ marks, onLetter, onEnter, onDelete, disabled }: Props) {
  const rows = []
  for (let i = 0; i < LETTERS.length; i += PER_ROW) rows.push(LETTERS.slice(i, i + PER_ROW))
  return (
    <div className="keyboard" aria-disabled={disabled}>
      {rows.map((row, r) => (
        <div className="key-row" key={r}>
          {row.map((l) => (
            <button
              key={l.ar}
              className={`key ${marks.get(l.ar) ?? ''}`}
              onClick={() => onLetter(l.ar)}
              disabled={disabled}
              aria-label={`${l.ar} (${l.he})`}
            >
              <span className="key-ar">{l.ar}</span>
              <span className="key-he">{l.he}</span>
            </button>
          ))}
        </div>
      ))}
      <div className="key-row">
        <button className="key wide enter" onClick={onEnter} disabled={disabled}>
          בדיקה
        </button>
        <button className="key wide" onClick={onDelete} disabled={disabled} aria-label="מחיקה">
          מחיקה ⌫
        </button>
      </div>
    </div>
  )
}
