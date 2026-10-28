import { useCallback, useEffect, useMemo, useState } from 'react'
import { Board } from './components/Board'
import { Help } from './components/Help'
import { Keyboard } from './components/Keyboard'
import { Reveal } from './components/Reveal'
import { days, normalizeLetter } from './content'
import {
  LAUNCH_DATE,
  MAX_GUESSES,
  ROOT_LENGTH,
  contentIndexFor,
  dayNumberFor,
  keyboardMarks,
} from './game'
import {
  type DayProgress,
  currentStreak,
  loadProgress,
  loadSettings,
  loadStats,
  recordFinish,
  saveProgress,
  saveSettings,
} from './storage'

// Test mode (?test, or ?test&day=12) plays any day without touching saved progress or stats.
// The public link only ever plays today's root.
const params = new URLSearchParams(location.search)
const testMode = params.has('test')

function testDayNumber(): number {
  const asked = Number(params.get('day'))
  return Number.isInteger(asked) && asked >= 1 && asked <= days.length ? asked : 1
}

function TestBar({ dayNumber }: { dayNumber: number }) {
  const go = (n: number) => {
    location.search = `?test&day=${n}`
  }
  return (
    <nav className="test-bar">
      <span>מצב בדיקה</span>
      <button className="chip" onClick={() => go(dayNumber - 1)} disabled={dayNumber <= 1}>
        הקודם
      </button>
      <select value={dayNumber} onChange={(e) => go(Number(e.target.value))} aria-label="יום">
        {days.map((d) => (
          <option key={d.day} value={d.day}>
            יום {d.day}
          </option>
        ))}
      </select>
      <button className="chip" onClick={() => go(dayNumber + 1)} disabled={dayNumber >= days.length}>
        הבא
      </button>
      <button className="chip" onClick={() => go(dayNumber)}>
        מההתחלה
      </button>
    </nav>
  )
}

export default function App() {
  const dayNumber = useMemo(() => (testMode ? testDayNumber() : dayNumberFor(new Date())), [])
  const day = days[contentIndexFor(dayNumber, days.length)]

  const [progress, setProgress] = useState<DayProgress>(() =>
    testMode ? { dayNumber, guesses: [], status: 'playing' } : loadProgress(dayNumber),
  )
  const [stats, setStats] = useState(loadStats)
  const [settings, setSettings] = useState(loadSettings)
  const [current, setCurrent] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [helpOpen, setHelpOpen] = useState(() => !testMode && !loadSettings().seenHelp)

  const { guesses, status } = progress
  const finished = status !== 'playing'
  const marks = useMemo(() => keyboardMarks(guesses, day.root), [guesses, day.root])

  useEffect(() => {
    if (!testMode) saveProgress(progress)
  }, [progress])
  useEffect(() => saveSettings(settings), [settings])

  // A new day starts at local midnight, even if the app stayed open.
  useEffect(() => {
    if (testMode) return
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
      if (!testMode) setStats((s) => recordFinish(s, dayNumber, won))
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

      {testMode && <TestBar dayNumber={dayNumber} />}

      <main>
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
            showCountdown={!testMode && LAUNCH_DATE !== null}
            saveNewsProgress={!testMode}
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
