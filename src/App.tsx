import { useCallback, useEffect, useMemo, useState } from 'react'
import { Board } from './components/Board'
import { Help } from './components/Help'
import { Keyboard } from './components/Keyboard'
import { Reveal } from './components/Reveal'
import { days, normalizeLetter } from './content'
import {
  HINT_AFTER_MISSES,
  MAX_GUESSES,
  ROOT_LENGTH,
  contentIndexFor,
  dayNumberFor,
  keyboardMarks,
} from './game'
import {
  currentStreak,
  loadProgress,
  loadSettings,
  loadStats,
  recordFinish,
  saveProgress,
  saveSettings,
} from './storage'

export default function App() {
  const dayNumber = useMemo(() => dayNumberFor(new Date()), [])
  const day = days[contentIndexFor(dayNumber, days.length)]

  const [progress, setProgress] = useState(() => loadProgress(dayNumber))
  const [stats, setStats] = useState(loadStats)
  const [settings, setSettings] = useState(loadSettings)
  const [current, setCurrent] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [helpOpen, setHelpOpen] = useState(() => !loadSettings().seenHelp)

  const { guesses, status } = progress
  const finished = status !== 'playing'
  const misses = guesses.length
  const marks = useMemo(() => keyboardMarks(guesses, day.root), [guesses, day.root])

  useEffect(() => saveProgress(progress), [progress])
  useEffect(() => saveSettings(settings), [settings])

  // A new day starts at local midnight, even if the app stayed open.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && dayNumberFor(new Date()) !== dayNumber) location.reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [dayNumber])

  const flash = (message: string) => {
    setToast(message)
    setShake(true)
    setTimeout(() => setShake(false), 500)
    setTimeout(() => setToast(null), 1800)
  }

  const addLetter = useCallback(
    (letter: string) => {
      if (finished) return
      setCurrent((c) => (c.length < ROOT_LENGTH ? [...c, letter] : c))
    },
    [finished],
  )

  const removeLetter = useCallback(() => setCurrent((c) => c.slice(0, -1)), [])

  const submit = useCallback(() => {
    if (finished) return
    if (current.length < ROOT_LENGTH) {
      flash('צריך שלוש אותיות')
      return
    }
    const nextGuesses = [...guesses, current]
    const won = current.join('') === day.root.join('')
    const lost = !won && nextGuesses.length >= MAX_GUESSES
    const nextStatus = won ? 'won' : lost ? 'lost' : 'playing'
    setProgress({ dayNumber, guesses: nextGuesses, status: nextStatus })
    setCurrent([])
    if (won || lost) {
      setStats((s) => recordFinish(s, dayNumber, won))
      setTimeout(() => document.querySelector('.reveal')?.scrollIntoView({ behavior: 'smooth' }), 600)
    }
  }, [current, guesses, day.root, dayNumber, finished])

  // Typing on a physical Arabic keyboard also works.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || helpOpen) return
      if (e.key === 'Enter') submit()
      else if (e.key === 'Backspace') removeLetter()
      else {
        const letter = normalizeLetter(e.key)
        if (letter) addLetter(letter)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submit, removeLetter, addLetter, helpOpen])

  const showHint = !finished && misses >= HINT_AFTER_MISSES && (day.hebrewCousin || day.hint)

  return (
    <div className="app">
      <header className="top">
        <button className="icon-btn" onClick={() => setHelpOpen(true)} aria-label="איך משחקים">
          ?
        </button>
        <h1>
          <span className="ar">جِذْر</span> <span className="title-he">ג׳ד׳ר · שורש היום</span>
        </h1>
        <div className="streak" title="ימים ברצף">
          🔥 {currentStreak(stats, dayNumber)}
        </div>
      </header>

      <main>
        <div className="clue">
          <div>
            <span className="clue-label">הגדרה</span>
            {day.clue}
          </div>
          {showHint && (
            <div className="hint">
              {day.hebrewCousin ? (
                <>
                  לשורש הזה יש בן דוד בעברית: <strong>{day.hebrewCousin}</strong>
                </>
              ) : (
                day.hint
              )}
            </div>
          )}
        </div>

        <Board guesses={guesses} current={current} answer={day.root} shake={shake} />

        {!finished && (
          <Keyboard marks={marks} onLetter={addLetter} onEnter={submit} onDelete={removeLetter} disabled={finished} />
        )}

        {finished && (
          <Reveal
            day={day}
            dayNumber={dayNumber}
            guesses={guesses}
            won={status === 'won'}
            streak={currentStreak(stats, dayNumber)}
            stats={stats}
            showVowels={settings.showVowels}
            onToggleVowels={() => setSettings((s) => ({ ...s, showVowels: !s.showVowels }))}
          />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}

      {helpOpen && (
        <Help
          onClose={() => {
            setHelpOpen(false)
            setSettings((s) => ({ ...s, seenHelp: true }))
          }}
        />
      )}
    </div>
  )
}
