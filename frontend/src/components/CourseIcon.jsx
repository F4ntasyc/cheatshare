// Ubin ikon mata kuliah. Warna tetap (tidak berubah di mode gelap).
const GLYPHS = {
  algo: (
    <>
      <rect width="76" height="76" rx="18" fill="#d4e8fb" />
      <rect x="28" y="10" width="20" height="11" rx="3" fill="#2f7bd6" />
      <path
        d="M38 21V27M38 51V56"
        stroke="#2f7bd6"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M38 27L50 39L38 51L26 39Z" fill="#5aa3ec" />
      <rect x="28" y="56" width="20" height="10" rx="3" fill="#2f7bd6" />
      <path
        d="M50 39H60V61H50"
        stroke="#2f7bd6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  code: (
    <>
      <rect width="76" height="76" rx="18" fill="#d4e8fb" />
      <rect x="16" y="18" width="44" height="30" rx="4" fill="#2f7bd6" />
      <rect x="20" y="22" width="36" height="22" rx="2" fill="#eaf4fe" />
      <rect x="10" y="50" width="56" height="6" rx="3" fill="#2f7bd6" />
      <path
        d="M31 28L26 33L31 38M45 28L50 33L45 38M40 27L36 39"
        stroke="#2f7bd6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  web: (
    <>
      <rect width="76" height="76" rx="18" fill="#d2f0f7" />
      <rect x="12" y="16" width="52" height="44" rx="6" fill="#1f9bc4" />
      <rect x="16" y="27" width="44" height="29" rx="2.5" fill="#e6f7fc" />
      <circle cx="20" cy="21.5" r="2" fill="#fff" />
      <circle cx="27" cy="21.5" r="2" fill="#fff" />
      <circle cx="34" cy="21.5" r="2" fill="#fff" />
      <path
        d="M31 35L26 41L31 47M45 35L50 41L45 47M40 34L36 48"
        stroke="#1f9bc4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  db: (
    <>
      <rect width="76" height="76" rx="18" fill="#dedcf8" />
      <rect x="20" y="44" width="36" height="12" fill="#7b7ff0" />
      <ellipse cx="38" cy="56" rx="18" ry="6" fill="#7b7ff0" />
      <ellipse cx="38" cy="44" rx="18" ry="6" fill="#b4b7f8" />
      <rect x="20" y="32" width="36" height="12" fill="#7b7ff0" />
      <ellipse cx="38" cy="44" rx="18" ry="6" fill="#7b7ff0" />
      <ellipse cx="38" cy="32" rx="18" ry="6" fill="#b4b7f8" />
      <rect x="20" y="20" width="36" height="12" fill="#7b7ff0" />
      <ellipse cx="38" cy="32" rx="18" ry="6" fill="#7b7ff0" />
      <ellipse cx="38" cy="20" rx="18" ry="6" fill="#b4b7f8" />
    </>
  ),
  net: (
    <>
      <rect width="76" height="76" rx="18" fill="#f8dcf5" />
      <path
        d="M38 38L38 16M38 38L58 30M38 38L52 56M38 38L24 56M38 38L18 30"
        stroke="#c05fb5"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="38" cy="16" r="5" fill="#e58bd1" />
      <circle cx="58" cy="30" r="5" fill="#e58bd1" />
      <circle cx="52" cy="56" r="5" fill="#e58bd1" />
      <circle cx="24" cy="56" r="5" fill="#e58bd1" />
      <circle cx="18" cy="30" r="5" fill="#e58bd1" />
      <circle cx="38" cy="38" r="8" fill="#d04fb0" />
      <circle cx="38" cy="38" r="2.5" fill="#fff" />
    </>
  ),
  os: (
    <>
      <rect width="76" height="76" rx="18" fill="#d6f5e6" />
      <rect x="14" y="16" width="48" height="34" rx="5" fill="#2fb58a" />
      <rect x="18" y="20" width="40" height="26" rx="2" fill="#8ee0c3" />
      <rect x="34" y="50" width="8" height="7" fill="#2fb58a" />
      <rect x="26" y="56" width="24" height="4" rx="2" fill="#2fb58a" />
    </>
  ),
  security: (
    <>
      <rect width="76" height="76" rx="18" fill="#e2e0f8" />
      <path
        d="M38 12L58 20V36C58 48 49 56 38 62C27 56 18 48 18 36V20Z"
        fill="#7a73e0"
      />
      <rect x="31" y="34" width="14" height="12" rx="2" fill="#fff" />
      <path
        d="M34 34V30a4 4 0 0 1 8 0V34"
        stroke="#fff"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="38" cy="40" r="1.8" fill="#7a73e0" />
    </>
  ),
  chart: (
    <>
      <rect width="76" height="76" rx="18" fill="#e4f6d3" />
      <rect x="16" y="44" width="11" height="14" rx="2" fill="#7cc542" />
      <rect x="32" y="36" width="11" height="22" rx="2" fill="#5fb02e" />
      <rect x="48" y="28" width="11" height="30" rx="2" fill="#7cc542" />
      <path
        d="M17 34L33 26L43 29L58 15M52 14L58 15L57 21"
        stroke="#3f8f1f"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  book: (
    <>
      <rect width="76" height="76" rx="18" fill="#fdebc8" />
      <path d="M38 24C32 20 22 20 16 23V54C22 51 32 51 38 55Z" fill="#f6b93b" />
      <path d="M38 24C44 20 54 20 60 23V54C54 51 44 51 38 55Z" fill="#fbd27a" />
      <path
        d="M38 24V55"
        stroke="#c98a14"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
};

export default function CourseIcon({ icon, size = 72, className }) {
  const key = GLYPHS[icon] ? icon : 'book';
  return (
    <svg
      className={className}
      viewBox="0 0 76 76"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      data-icon={key}
    >
      {GLYPHS[key]}
    </svg>
  );
}
