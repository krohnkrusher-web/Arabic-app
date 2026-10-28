import { Fragment, useEffect, useState } from 'react'
import { stripVowels, type News } from '../content'
import { loadNews, saveNews } from '../storage'
import { newsScore, scoreSentence, totalScore } from '../translate'
import { speak, useArabicVoice } from '../voice'

interface Props {
  news: News
  dayNumber: number
  save: boolean
  onClose: (score: number | null) => void
}

const plain = (text: string) => text.replace(/\*/g, '')

// News text is shown as a newspaper prints it, without vowel marks.
// Words from the day's root are wrapped in *stars* in the content; show them highlighted.
function Marked({ text }: { text: string }) {
  return (
    <>
      {stripVowels(text)
        .split('*')
        .map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>))}
    </>
  )
}

export function NewsPath({ news, dayNumber, save, onClose }: Props) {
  const voice = useArabicVoice()
  const [progress, setProgress] = useState(() => (save ? loadNews(dayNumber) : { dayNumber, answers: [], checked: 0 }))
  const total = news.sentences.length
  const done = progress.checked >= total
  const [stage, setStage] = useState<'read' | 'translate' | 'summary'>(() =>
    done ? 'summary' : progress.checked > 0 || progress.answers.length > 0 ? 'translate' : 'read',
  )
  const [index, setIndex] = useState(() => Math.min(progress.checked, total - 1))

  useEffect(() => {
    if (save) saveNews(progress)
  }, [progress, save])

  const sentence = news.sentences[index]
  const answer = progress.answers[index] ?? ''
  const checked = index < progress.checked
  const result = checked ? scoreSentence(sentence, answer) : null
  const results = news.sentences.map((s, i) => scoreSentence(s, progress.answers[i] ?? ''))

  const setAnswer = (text: string) =>
    setProgress((p) => {
      const answers = [...p.answers]
      answers[index] = text
      return { ...p, answers }
    })

  const check = () => setProgress((p) => ({ ...p, checked: Math.max(p.checked, index + 1) }))

  const next = () => {
    if (index + 1 < total) setIndex(index + 1)
    else setStage('summary')
  }

  const close = () => onClose(newsScore(news, progress))

  const source = (
    <p className="news-source">
      על פי{' '}
      <a href={news.source.url} target="_blank" rel="noreferrer">
        {news.source.name}
      </a>
      , {news.source.date}. בניסוח מחודש, בלי ניקוד, כמו בעיתון.
    </p>
  )

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="sheet news">
        <div className="news-top">
          <h2>מסלול כתוב</h2>
          <button className="icon-btn" onClick={close} aria-label="סגירה">
            ✕
          </button>
        </div>

        {stage === 'read' && (
          <>
            <h3 className="ar news-title">
              <Marked text={news.title} />
            </h3>
            <p className="ar news-text">
              {news.sentences.map((s, i) => (
                <Fragment key={i}>
                  <Marked text={s.ar}/>{' '}
                </Fragment>
              ))}
            </p>
            {voice && (
              <button className="chip" onClick={() => speak(voice, news.sentences.map((s) => plain(s.ar)).join(' '), 0.8)}>
                🔊 הקראה
              </button>
            )}
            {news.glossary && news.glossary.length > 0 && (
              <ul className="glossary">
                {news.glossary.map((g, i) => (
                  <li key={i}>
                    <span className="ar">{stripVowels(g.ar)}</span> <span>{g.he}</span>
                  </li>
                ))}
              </ul>
            )}
            {source}
            <button className="primary" onClick={() => setStage('translate')}>
              לתרגם לעברית
            </button>
          </>
        )}

        {stage === 'translate' && (
          <>
            <p className="muted">
              משפט {index + 1} מתוך {total}
            </p>
            <p className="ar news-sentence">
              <Marked text={sentence.ar}/>
            </p>
            <textarea
              className="translation"
              dir="rtl"
              rows={3}
              placeholder="התרגום שלך"
              value={answer}
              readOnly={checked}
              onChange={(e) => setAnswer(e.target.value)}
            />
            {result ? (
              <div className="check">
                <p className="check-score">
                  {Math.round(result.score * 100)}/100
                </p>
                <ul className="keys">
                  {sentence.keys.map((k, i) => (
                    <li key={i} className={result.found[i] ? 'hit' : 'miss'}>
                      {result.found[i] ? '✓' : '✗'} {k[0]}
                    </li>
                  ))}
                </ul>
                <p className="model">
                  <strong>תרגום לדוגמה:</strong> {sentence.he}
                </p>
                <button className="primary" onClick={next}>
                  {index + 1 < total ? 'למשפט הבא' : 'לציון'}
                </button>
              </div>
            ) : (
              <button className="primary" onClick={check} disabled={!answer.trim()}>
                בדיקה
              </button>
            )}
          </>
        )}

        {stage === 'summary' && (
          <>
            <p className="news-total">
              <strong>{totalScore(results)}</strong>/100
            </p>
            <ol className="summary">
              {news.sentences.map((s, i) => (
                <li key={i}>
                  <p className="ar">
                    <Marked text={s.ar}/>
                  </p>
                  <p>
                    <span className="muted">התרגום שלך:</span> {progress.answers[i]}
                  </p>
                  <p>
                    <span className="muted">לדוגמה:</span> {s.he}
                  </p>
                </li>
              ))}
            </ol>
            {source}
            <button className="primary" onClick={close}>
              סיום
            </button>
          </>
        )}
      </div>
    </div>
  )
}
