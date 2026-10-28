import { useEffect, useState } from 'react'
import { stripVowels, type Day, type Register } from '../content'
import { shareText } from '../game'
import type { Stats } from '../storage'

const REGISTER_LABEL: Record<Register, string> = {
  msa: 'ספרותית',
  pal: 'מדוברת',
  both: 'בשתיהן',
}

interface Props {
  day: Day
  dayNumber: number
  guesses: string[][]
  won: boolean
  streak: number
  stats: Stats
  showVowels: boolean
  onToggleVowels: () => void
  showCountdown: boolean
}

// Recorded audio comes later. Until then, the phone's own Arabic voice reads the word if it has one.
function useArabicVoice() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const pick = () => setVoice(speechSynthesis.getVoices().find((v) => v.lang.startsWith('ar')) ?? null)
    pick()
    speechSynthesis.addEventListener('voiceschanged', pick)
    return () => speechSynthesis.removeEventListener('voiceschanged', pick)
  }, [])
  return voice
}

function secondsToMidnight() {
  const now = new Date()
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000))
}

function Countdown() {
  const [left, setLeft] = useState(secondsToMidnight)
  useEffect(() => {
    const id = setInterval(() => setLeft(secondsToMidnight()), 1000)
    return () => clearInterval(id)
  }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="countdown" dir="ltr">
      {pad(Math.floor(left / 3600))}:{pad(Math.floor((left % 3600) / 60))}:{pad(left % 60)}
    </span>
  )
}

export function Reveal({ day, dayNumber, guesses, won, streak, stats, showVowels, onToggleVowels, showCountdown }: Props) {
  const voice = useArabicVoice()
  const [shared, setShared] = useState(false)
  const ar = (text: string) => (showVowels ? text : stripVowels(text))

  const play = (text: string, audio?: string) => {
    if (audio) {
      void new Audio(audio).play()
      return
    }
    if (!voice) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    u.lang = voice.lang
    u.rate = 0.85
    speechSynthesis.speak(u)
  }

  const share = async () => {
    const text = shareText(dayNumber, guesses, day.root, won)
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        setShared(true)
      }
    } catch {
      // The person closed the share sheet.
    }
  }

  return (
    <section className="reveal">
      <div className="reveal-head">
        <p className="reveal-result">{won ? 'כל הכבוד!' : 'השורש של היום:'}</p>
        <div className="reveal-root ar">{day.root.join(' ')}</div>
        <p className="reveal-meaning">{day.meaning}</p>
        {day.hebrewCousin && <p className="cousin">בעברית: {day.hebrewCousin}</p>}
      </div>

      <div className="stats-row">
        <div>
          <strong>{streak}</strong>
          <span>ימים ברצף</span>
        </div>
        <div>
          <strong>{stats.played}</strong>
          <span>שיחקת</span>
        </div>
        <div>
          <strong>{stats.won}</strong>
          <span>פתרת</span>
        </div>
      </div>

      <div className="family-head">
        <h2>המשפחה של השורש</h2>
        <button className="chip" onClick={onToggleVowels} aria-pressed={showVowels}>
          {showVowels ? 'ניקוד: מוצג' : 'ניקוד: מוסתר'}
        </button>
      </div>

      <ul className="family">
        {day.words.map((w, i) => (
          <li key={i} className="word">
            <span className="ar word-ar">{ar(w.ar)}</span>
            <div className="word-text">
              <div className="word-translit">{w.translit}</div>
              <div className="word-he">{w.he}</div>
            </div>
            {(w.audio || voice) && (
              <button className="speak" onClick={() => play(w.ar, w.audio)} aria-label="השמעה">
                🔊
              </button>
            )}
            <div className="word-meta">
              <span className={`tag ${w.register}`}>{REGISTER_LABEL[w.register]}</span>
              {w.note && <span className="note">{w.note}</span>}
            </div>
          </li>
        ))}
      </ul>

      {day.funFact && (
        <div className="fun-fact">
          <strong>הידעת?</strong> {day.funFact}
        </div>
      )}

      <button className="primary" onClick={share}>
        {shared ? 'הועתק ✓' : 'שיתוף התוצאה'}
      </button>

      <div className="paths">
        <div className="path soon">
          <strong>מסלול מדובר</strong>
          <span>סצנה עם דמות שמדברת איתך. בקרוב.</span>
        </div>
        <div className="path soon">
          <strong>מסלול כתוב</strong>
          <span>פסקת חדשות קצרה עם השורש. בקרוב.</span>
        </div>
      </div>

      {showCountdown && (
        <p className="next">
          השורש הבא בעוד <Countdown />
        </p>
      )}
    </section>
  )
}
