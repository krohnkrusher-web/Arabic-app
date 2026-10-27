interface Props {
  onClose: () => void
}

export function Help({ onClose }: Props) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>איך משחקים</h2>
        <p>
          כל יום יש שורש ערבי אחד של שלוש אותיות. יש לך שישה ניסיונות לנחש אותו. ההגדרה בעברית מופיעה למעלה.
        </p>
        <ul className="help-list">
          <li>
            <span className="tile mini correct">ك</span> האות במקום הנכון.
          </li>
          <li>
            <span className="tile mini present">ت</span> האות בשורש, אבל במקום אחר.
          </li>
          <li>
            <span className="tile mini absent">ب</span> האות לא בשורש.
          </li>
        </ul>
        <p>אם ניחשת שורש אמיתי אחר, תראה מילה ממנו. גם ניחוש לא נכון מלמד משהו.</p>
        <p>מתחת לכל אות במקלדת מופיעה האות העברית שמקבילה לה.</p>
        <p className="muted">כדי להתקין: בתפריט השיתוף של הדפדפן, בחרו "הוספה למסך הבית".</p>
        <button className="primary" onClick={onClose}>
          יאללה, מתחילים
        </button>
      </div>
    </div>
  )
}
