import { Fragment, useEffect, useRef, useState } from 'react'
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

// The made-up news site the written path is published on.
const OUTLET = { name: 'الضاد' }

// Words per minute for the "reading time" line.
const READING_SPEED = 120

const SECTIONS = ['الرئيسية', 'محليات', 'العالم', 'اقتصاد', 'علوم', 'صحة', 'ثقافة', 'رياضة', 'منوعات']
const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
// Month names as the Levantine press writes them.
const MONTHS = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول']

// "8.10.2026" -> "الخميس 8 تشرين الأول 2026"
export function arabicDate(date: string) {
  const [d, m, y] = date.split('.').map(Number)
  if (!d || !m || !y) return date
  return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]} ${d} ${MONTHS[m - 1]} ${y}`
}

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
  const [large, setLarge] = useState(false)
  const activeTab = useRef<HTMLSpanElement>(null)
  const [index, setIndex] = useState(() => Math.min(progress.checked, total - 1))

  // Bring today's section into view in the tab strip, like a site does on a section page.
  useEffect(() => {
    activeTab.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

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

  const sections = news.section && !SECTIONS.includes(news.section) ? [...SECTIONS, news.section] : SECTIONS
  const words = news.sentences.map((s) => s.ar).join(' ').split(/\s+/).length
  const minutes = Math.max(1, Math.round(words / READING_SPEED))

  const source = (
    <p className="news-source">
      הידיעה נכתבה מחדש על פי{' '}
      <a href={news.source.url} target="_blank" rel="noreferrer">
        {news.source.name}
      </a>
      , {news.source.date}, בלי ניקוד, כמו באתר חדשות.
    </p>
  )

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`מסלול כתוב: ${OUTLET.name}`}>
      <div className="sheet news">
        <header className="site-head">
          <div className="site-bar">
            <span className="ar site-logo">{OUTLET.name}</span>
            <button className="site-close" onClick={close} aria-label="סגירה">
              ✕
            </button>
          </div>
          <nav className="ar site-tabs" aria-hidden="true">
            {sections.map((s) => (
              <span key={s} ref={s === news.section ? activeTab : undefined} className={s === news.section ? 'on' : undefined}>
                {s}
              </span>
            ))}
          </nav>
        </header>

        {stage === 'read' && (
          <article className={large ? 'story large' : 'story'}>
            {news.section && (
              <p className="ar crumbs">
                الرئيسية <span aria-hidden="true">‹</span> <b>{news.section}</b>
              </p>
            )}
            <h1 className="ar headline">
              <Marked text={news.title} />
            </h1>
            <div className="ar meta">
              <span>
                <b>{OUTLET.name}</b> - {news.source.name}
              </span>
              <span>
                نُشر: {arabicDate(news.source.date)} · مدة القراءة: {minutes === 1 ? 'دقيقة واحدة' : `${minutes} دقائق`}
              </span>
            </div>
            <div className="tools">
              {voice && (
                <button
                  className="tool"
                  onClick={() => speak(voice, news.sentences.map((s) => plain(s.ar)).join(' '), 0.8)}
                  aria-label="הקראה"
                >
                  🔊
                </button>
              )}
              <button className="tool ar" onClick={() => setLarge(!large)} aria-label="גודל טקסט" aria-pressed={large}>
                <small>T</small>T
              </button>
            </div>
            <div className="ar story-body">
              {news.sentences.map((s, i) => (
                <p key={i} className={i === 0 ? 'lead' : undefined}>
                  <Marked text={s.ar} />
                </p>
              ))}
            </div>
            <p className="ar story-credit">
              المصدر:{' '}
              <a href={news.source.url} target="_blank" rel="noreferrer">
                {news.source.name}
              </a>
            </p>
            {news.glossary && news.glossary.length > 0 && (
              <aside className="glossary">
                <h2 className="ar">كلمات</h2>
                <ul>
                  {news.glossary.map((g, i) => (
                    <li key={i}>
                      <span className="ar">{stripVowels(g.ar)}</span>
                      <span>{g.he}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
            {source}
            <div className="news-action">
              <button className="primary" onClick={() => setStage('translate')}>
                לתרגם לעברית
              </button>
            </div>
          </article>
        )}

        {stage === 'translate' && (
          <section className="story">
            <p className="kicker">
              תרגום · משפט {index + 1} מתוך {total}
            </p>
            <div className="ar story-body context">
              {news.sentences.map((s, i) => (
                <p key={i} className={i === index ? 'current' : undefined}>
                  <Marked text={s.ar} />
                </p>
              ))}
            </div>
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
                <p className="check-score">{Math.round(result.score * 100)}/100</p>
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
                <div className="news-action">
                  <button className="primary" onClick={next}>
                    {index + 1 < total ? 'למשפט הבא' : 'לציון'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="news-action">
                <button className="primary" onClick={check} disabled={!answer.trim()}>
                  בדיקה
                </button>
              </div>
            )}
          </section>
        )}

        {stage === 'summary' && (
          <section className="story">
            <p className="kicker">הציון שלך</p>
            <p className="news-total">
              <strong>{totalScore(results)}</strong>/100
            </p>
            <ol className="summary">
              {news.sentences.map((s, i) => (
                <li key={i}>
                  <p className="ar">
                    <Marked text={s.ar} />
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
            <div className="news-action">
              <button className="primary" onClick={close}>
                סיום
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
