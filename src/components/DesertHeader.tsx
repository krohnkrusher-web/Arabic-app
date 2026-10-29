// Header art: dunes, a Bedouin goat-hair tent (beit a-sha'ar) with a campfire and dallah, and camels.
// All colors come from CSS variables, so the same drawing turns into a desert night in dark mode.

const STARS = [
  [30, 50],
  [60, 90],
  [120, 40],
  [150, 96],
  [200, 30],
  [250, 70],
  [300, 44],
  [330, 100],
  [96, 64],
  [270, 24],
  [180, 80],
];

function Camel({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      className="d-camel"
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 0c2-6 8-8 12-4c3-5 9-5 11 0c2 2 3 4 6 3c3-3 4-9 7-10c2 0 3 1 2 3c-2 2-2 6-4 9c-1 3-4 4-6 4l0 8h-1.5l-.5-7c-2 1-4 1-6 1l-.5 6h-1.5l-.5-6c-3 0-6 0-8-1l-1 7h-1.5l0-7c-2-1-4-2-4-5z"
    />
  );
}

export function DesertArt() {
  return (
    <svg
      className="desert"
      viewBox="0 0 354 214"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="d-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sky-top)" }} />
          <stop offset="1" style={{ stopColor: "var(--sky-bottom)" }} />
        </linearGradient>
        <radialGradient id="d-fire">
          <stop
            offset="0"
            stopColor="#ffcf7a"
            style={{ stopOpacity: "var(--fire-glow)" }}
          />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect y="-200" width="354" height="414" fill="url(#d-sky)" />
      <g className="d-stars">
        {STARS.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 3 ? 0.9 : 1.4}
            opacity={i % 2 ? 0.6 : 0.9}
          />
        ))}
      </g>
      <circle className="d-sun" cx="84" cy="100" r="30" />
      <path
        className="d-moon"
        d="M96 70a22 22 0 1 0 18 34a18 18 0 1 1-18-34z"
      />
      <path
        className="d-dune1"
        d="M0 122C70 100 120 142 200 120S310 94 354 110V214H0z"
      />
      <Camel x={66} y={138} s={0.75} />
      <Camel x={96} y={142} s={0.6} />
      <path
        className="d-dune2"
        d="M0 154C60 132 150 164 230 144S320 134 354 144V214H0z"
      />
      <path
        className="d-dune3"
        d="M0 184C90 168 170 190 260 176S330 170 354 174V214H0z"
      />
      {/* Tent and fire sit low on the near dune, so a short header can crop the sky without hiding them. */}
      <g transform="translate(26 26)">
        <g className="d-tent">
          <path
            className="d-rope"
            d="M190 148l-14 12M352 148l14 12M206 126l-26 32M326 126l26 32"
          />
          <path d="M196 160L204 130Q222 120 238 128Q256 118 272 128Q290 118 306 128Q318 122 330 130L338 160z" />
          <path className="d-door" d="M244 160V136H296V160z" />
          <path d="M244 136h52v5h-52z" fill="#a3262a" />
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`M${244 + i * 6.5} 141l3.25 4 3.25-4z`}
              fill="#f6ead9"
            />
          ))}
          <path className="d-rope" d="M270 136V160" strokeWidth="1.6" />
          <circle
            className="d-tent-glow"
            cx="270"
            cy="152"
            r="40"
            fill="url(#d-fire)"
          />
        </g>
        <g transform="translate(214 160)">
          <circle r="18" fill="url(#d-fire)" />
          <path
            d="M-6 4l12-3M-6 1l12 3"
            stroke="#3a2418"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M0 2c-5-3-4-8 0-13c1 4 5 6 3 10c-1 2-2 3-3 3z"
            fill="#ff8a3d"
          />
          <path d="M0 2c-2-2-2-4 0-7c1 2 2 4 0 7z" fill="#ffd27a" />
          <g className="d-dallah" transform="translate(12 -10)">
            <path d="M0 14h10l-1-4c0-3 1-5 0-7l-2-1v-2h-3v2l-2 1c-1 2 0 4 0 7z" />
            <path d="M0 6c-3-1-5-3-6-6c3 1 5 2 6 4z" />
            <path d="M10 5c3 0 4 3 2 6" fill="none" strokeWidth="1.2" />
          </g>
        </g>
      </g>
    </svg>
  );
}

// A strip of sadu weaving: red ground, cream teeth, black diamonds. The motif repeats at its own size.
export function Sadu({
  className,
  id,
  scale = 1,
}: {
  className: string;
  id: string;
  scale?: number;
}) {
  return (
    <svg className={className} aria-hidden="true">
      <defs>
        <pattern
          id={id}
          width="12"
          height="22"
          patternUnits="userSpaceOnUse"
          patternTransform={`scale(${scale})`}
        >
          <rect width="12" height="22" fill="#7d1e22" />
          <rect width="12" height="3" fill="#221616" />
          <rect y="19" width="12" height="3" fill="#221616" />
          <path d="M0 3l6 6l6-6zM0 19l6-6l6 6z" fill="#f6ead9" />
          <path d="M6 8l3 3l-3 3l-3-3z" fill="#221616" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
