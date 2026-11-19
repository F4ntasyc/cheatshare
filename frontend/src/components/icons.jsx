// Ikon SVG inline (tanpa library). Semua dekoratif: aria-hidden="true".
// Ukuran lewat prop `size`, warna mengikuti `currentColor`.

function Svg({ size = 20, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function MailIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </Svg>
  );
}

export function LockIcon(props) {
  return (
    <Svg {...props}>
      <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" />
      <path
        fill="currentColor"
        stroke="none"
        fillRule="evenodd"
        d="M6.5 10h11A1.5 1.5 0 0 1 19 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10Zm5.5 3.5a1.5 1.5 0 0 0-.75 2.8V18a.75.75 0 0 0 1.5 0v-1.7a1.5 1.5 0 0 0-.75-2.8Z"
      />
    </Svg>
  );
}

export function UserIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Svg>
  );
}

export function EyeIcon(props) {
  return (
    <Svg {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function EyeOffIcon(props) {
  return (
    <Svg {...props}>
      <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4" />
      <path d="M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4.9-1.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </Svg>
  );
}

export function GraduationCapIcon(props) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        fillOpacity="0.18"
        d="M12 4 1.5 9 12 14l10.5-5L12 4Z"
      />
      <path d="M6 11.4V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.6" />
      <path d="M22.5 9v5.5" />
    </Svg>
  );
}
