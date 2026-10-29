import { Fragment, useEffect, useRef, useState } from 'react'
import { stripVowels, type Scene, type SceneLine, type SceneReply } from '../content'
import { canListen, listenOnce, matchReply } from '../speech'
import { playLine, useArabicVoice } from '../voice'
import { AbuSami, Kiosk } from './SceneArt'

interface Props {
  scene: Scene
  onClose: () => void
  // Shown when the phone can't listen, so the day isn't a dead end.
  onWritten?: () => void
}

type Phase = 'intro' | 'talking' | 'your-turn' | 'listening' | 'right' | 'end'

// Words from the day's root are wrapped in *stars*; show them highlighted.
function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split('*').map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>))}
    </>
  )
}

const rootWords = (texts: string[]) => [
  ...new Set(texts.flatMap((t) => t.split('*').filter((_, i) => i % 2)).map((w) => w.trim())),
]

export function ScenePath({ scene, onClose, onWritten }: Props) {
  const voice = useArabicVoice()
  const listening = canListen()
  const [phase, setPhase] = useState<Phase>('intro')
  const [turnIndex, setTurnIndex] = useState(0)
  const [choice, setChoice] = useState<string | undefined>()
  const [misses, setMisses] = useState(0)
  const [firstTry, setFirstTry] = useState(0)
  const [said, setSaid] = useState<SceneReply[]>([])
  const [heardLines, setHeardLines] = useState<SceneLine[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [showMeaning, setShowMeaning] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)

  const closing = turnIndex >= scene.turns.length
  const turn = closing ? null : scene.turns[turnIndex]
  const line: SceneLine = turn ? ((choice ? turn.sayAfter?.[choice] : undefined) ?? turn.say) : scene.closing
  const model = turn?.replies[0]

  const play = (l: SceneLine, onEnd?: () => void) => {
    stopRef.current?.()
    setSpeaking(true)
    stopRef.current = playLine(voice, l.ar.replace(/\*/g, ''), l.audio, () => {
      setSpeaking(false)
      onEnd?.()
    })
  }

  // The character says the line, then it's the learner's turn (or the end card after the closing line).
  useEffect(() => {
    if (phase !== 'talking') return
    setShowMeaning(false)
    setHeardLines((h) => [...h, line])
    play(line, () => setPhase(closing ? 'end' : 'your-turn'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turnIndex])

  useEffect(() => () => stopRef.current?.(), [])

  const listen = async () => {
    if (!turn) return
    stopRef.current?.()
    setSpeaking(false)
    setFeedback(null)
    setPhase('listening')
    const { result, stop } = listenOnce()
    stopRef.current = stop
    const res = await result
    const reply = res.ok ? matchReply(turn.replies, res.heard) : null
    if (reply) {
      setSaid((s) => [...s, reply])
      if (misses === 0) setFirstTry((n) => n + 1)
      setFeedback(`✓ ${reply.he}`)
      setPhase('right')
      setTimeout(() => {
        setChoice(reply.id)
        setMisses(0)
        setFeedback(null)
        setTurnIndex((i) => i + 1)
        setPhase('talking')
      }, 1300)
      return
    }
    const nextMisses = misses + 1
    setMisses(nextMisses)
    setPhase('your-turn')
    if (!res.ok && res.reason === 'denied') {
      setFeedback('צריך לאשר למיקרופון גישה כדי לענות.')
      return
    }
    const heard = res.ok ? res.heard[0] : ''
    setFeedback(heard ? `שמעתי «${heard}». נסה שוב.` : 'לא שמעתי כלום. נסה שוב.')
    if (nextMisses >= 2 && model) {
      setFeedback((f) => `${f} הקשב ותגיד אחריו:`)
      play(model)
    }
  }

  const restart = () => {
    setTurnIndex(0)
    setChoice(undefined)
    setMisses(0)
    setFirstTry(0)
    setSaid([])
    setHeardLines([])
    setFeedback(null)
    setPhase('talking')
  }

  const close = () => {
    stopRef.current?.()
    onClose()
  }

  const showModel = misses >= 2 && model

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="sheet scene">
        <div className="news-top">
          <h2>מסלול מדובר</h2>
          <button className="icon-btn" onClick={close} aria-label="סגירה">
            ✕
          </button>
        </div>

        <div className="stage">
          <Kiosk />
          <AbuSami talking={speaking} />
          {phase !== 'intro' && phase !== 'end' && (
            <button
              className={`bubble${misses > 0 ? ' can-help' : ''}`}
              onClick={() => misses > 0 && setShowMeaning((m) => !m)}
              aria-label="מה הוא אמר?"
            >
              <span className="bubble-name">{scene.character.name}</span>
              <span className="ar bubble-ar">
                <Marked text={stripVowels(line.ar)} />
              </span>
              {misses > 0 && !showMeaning && <span className="bubble-hint">לחיצה לתרגום</span>}
              {showMeaning && (
                <span className="bubble-help">
                  <span>{line.translit}</span>
                  <span className="muted">{line.he}</span>
                </span>
              )}
            </button>
          )}
        </div>

        {phase === 'intro' && (
          <div className="scene-panel">
            <p className="scene-place">{scene.place}</p>
            {listening ? (
              <>
                <p className="muted">
                  {scene.character.name} ידבר איתך בערבית מדוברת. בכל תור כתוב בעברית מה להגיד, ואתה אומר את זה בערבית,
                  בקול. יש כמה דרכים נכונות להגיד כל דבר.
                </p>
                <button className="primary" onClick={() => setPhase('talking')}>
                  להתחיל
                </button>
              </>
            ) : (
              <>
                <p>
                  במסלול המדובר עונים בקול, והדפדפן הזה לא יודע להקשיב. אפשר לנסות ב־Chrome באנדרואיד או ב־Safari באייפון.
                </p>
                {onWritten && (
                  <button className="primary" onClick={onWritten}>
                    למסלול הכתוב
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {(phase === 'your-turn' || phase === 'listening' || phase === 'right' || phase === 'talking') && turn && (
          <div className="scene-panel">
            <p className="intent">{turn.intent}</p>
            {showModel && (
              <p className="model-answer">
                <span className="ar">
                  <Marked text={model.ar} />
                </span>
                <span>{model.translit}</span>
              </p>
            )}

            {feedback && <p className={`scene-feedback${phase === 'right' ? ' ok' : ''}`}>{feedback}</p>}

            <button
              className={`mic${phase === 'listening' ? ' on' : ''}`}
              onClick={listen}
              disabled={phase !== 'your-turn'}
              aria-label="לדבר"
            >
              🎤
              <span>{phase === 'listening' ? 'מקשיב...' : phase === 'talking' ? '' : 'לחץ ודבר'}</span>
            </button>
          </div>
        )}

        {phase === 'end' && (
          <div className="scene-panel">
            <p className="news-total">
              <strong>{firstTry}</strong>/{scene.turns.length}
            </p>
            <p className="muted center">תשובות שנקלטו כבר בפעם הראשונה</p>
            {rootWords(said.map((r) => r.ar)).length > 0 && (
              <p>
                <strong>מילים מהשורש שאמרת:</strong>{' '}
                <span className="ar root-words">{rootWords(said.map((r) => r.ar)).join('، ')}</span>
              </p>
            )}
            {rootWords(heardLines.map((l) => l.ar)).length > 0 && (
              <p>
                <strong>מילים מהשורש ששמעת:</strong>{' '}
                <span className="ar root-words">{rootWords(heardLines.map((l) => l.ar)).join('، ')}</span>
              </p>
            )}
            <button className="primary" onClick={close}>
              סיום
            </button>
            <button className="chip wide" onClick={restart}>
              עוד פעם מההתחלה
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
