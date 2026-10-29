// Placeholder illustrations for the spoken path, drawn in SVG until the design pass.
// The character's mouth moves while a line plays.

export function Kiosk() {
  return (
    <svg className="scene-bg" viewBox="0 0 360 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c97a" />
          <stop offset="1" stopColor="#f9e3b5" />
        </linearGradient>
      </defs>
      <rect width="360" height="240" fill="url(#sky)" />
      <circle cx="300" cy="40" r="22" fill="#fff4d6" opacity="0.9" />
      <rect x="20" y="70" width="320" height="170" fill="#e8d2b0" />
      <rect x="20" y="70" width="320" height="10" fill="#d7bd96" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M${20 + i * 40} 52 h40 v26 q-20 12 -40 0 z`} fill={i % 2 ? '#fdf6ea' : '#b5522e'} />
      ))}
      <rect x="40" y="96" width="280" height="6" fill="#9c7a52" />
      {[60, 92, 124, 230, 262, 294].map((x, i) => (
        <g key={x}>
          <rect x={x} y={70 + (i % 2) * 6} width="16" height={26 - (i % 2) * 6} rx="3" fill={['#e9a23b', '#7fb069', '#f2d16b'][i % 3]} />
          <rect x={x + 5} y={64 + (i % 2) * 6} width="6" height="7" fill="#6b5640" />
        </g>
      ))}
      <rect x="0" y="196" width="360" height="44" fill="#8a5a35" />
      <rect x="0" y="192" width="360" height="8" fill="#a8744a" />
      <g transform="translate(70 170)">
        <path d="M0 0 h18 l-3 24 h-12 z" fill="#fff" opacity="0.85" />
        <rect x="2" y="6" width="14" height="14" fill="#f2d16b" opacity="0.8" />
      </g>
      <g transform="translate(270 176)">
        <rect width="22" height="18" rx="4" fill="#fdf6ea" />
        <path d="M22 4 q8 5 0 10" stroke="#fdf6ea" strokeWidth="3" fill="none" />
        <path d="M6 -4 q3 -6 0 -10 M14 -4 q3 -6 0 -10" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.7" />
      </g>
    </svg>
  )
}

export function AbuSami({ talking }: { talking: boolean }) {
  return (
    <svg className={`character${talking ? ' talking' : ''}`} viewBox="0 0 160 200" aria-hidden="true">
      <path d="M20 200 q0 -70 60 -72 q60 2 60 72 z" fill="#f4f1ea" />
      <path d="M50 200 v-56 q30 14 60 0 v56 z" fill="#3f6e8c" />
      <rect x="68" y="112" width="24" height="22" fill="#c98b5e" />
      <ellipse cx="80" cy="76" rx="40" ry="46" fill="#d89c6c" />
      <path d="M40 70 q-2 -26 14 -36 q-12 20 -8 40 z M120 70 q2 -26 -14 -36 q12 20 8 40 z" fill="#9a958d" />
      <ellipse cx="40" cy="80" rx="6" ry="9" fill="#c98b5e" />
      <ellipse cx="120" cy="80" rx="6" ry="9" fill="#c98b5e" />
      <path d="M56 60 q8 -6 16 -1 M88 59 q8 -5 16 1" stroke="#6e675e" strokeWidth="4" strokeLinecap="round" fill="none" />
      <g className="eyes">
        <ellipse cx="64" cy="72" rx="4" ry="5" fill="#2a2622" />
        <ellipse cx="96" cy="72" rx="4" ry="5" fill="#2a2622" />
      </g>
      <path d="M80 74 q-6 14 0 18 q6 -4 0 -18" fill="#c4875a" />
      <ellipse className="mouth" cx="80" cy="106" rx="9" ry="5" fill="#7a2f22" />
      <path d="M50 98 q14 -10 30 -4 q16 -6 30 4 q-6 8 -16 6 q-8 -2 -14 -2 q-6 0 -14 2 q-10 2 -16 -6 z" fill="#4a443d" />
      <path d="M70 120 q10 4 20 0" stroke="#b07a50" strokeWidth="2" fill="none" />
    </svg>
  )
}
