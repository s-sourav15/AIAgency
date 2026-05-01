import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

// ─── LOGO COMPONENTS ───────────────────────────────────────────────────────────

function LogoA({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 260 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-auto"
      aria-label="utsuk logo"
    >
      {/* u */}
      <path
        d="M10 18v22c0 8 5 12 12 12s12-4 12-12V18"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* t — exaggerated crossbar extending past the s */}
      <path
        d="M52 10v40"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M42 22h28"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* s */}
      <path
        d="M82 24c0-4 4-7 10-7s10 2 10 6c0 8-20 6-20 16 0 4 4 7 10 7s10-3 10-7"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* u */}
      <path
        d="M120 18v22c0 8 5 12 12 12s12-4 12-12V18"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* k */}
      <path
        d="M162 10v42"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M162 34l16-16M162 34l16 18"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoB({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 320 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-auto"
      aria-label="utsuk logo"
    >
      {/* Unfinished circle mark — 75% arc, opening at top-right */}
      <circle
        cx="24"
        cy="30"
        r="18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="84.82"
        strokeDashoffset="28.27"
        transform="rotate(-45 24 30)"
      />
      {/* Wordmark shifted right to accommodate the mark */}
      {/* u */}
      <path
        d="M62 18v22c0 8 5 12 12 12s12-4 12-12V18"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* t */}
      <path
        d="M104 10v40"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M96 22h16"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* s */}
      <path
        d="M130 24c0-4 4-7 10-7s10 2 10 6c0 8-20 6-20 16 0 4 4 7 10 7s10-3 10-7"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* u */}
      <path
        d="M168 18v22c0 8 5 12 12 12s12-4 12-12V18"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* k */}
      <path
        d="M210 10v42"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M210 34l16-16M210 34l16 18"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoC({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 260 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-auto"
      aria-label="utsuk logo"
    >
      {/* u — first u, with a tail */}
      <path
        d="M10 18v22c0 8 5 12 12 12s12-4 12-12V18"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 52c2 4 4 6 7 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* t */}
      <path
        d="M52 10v40"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M44 22h16"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* s */}
      <path
        d="M78 24c0-4 4-7 10-7s10 2 10 6c0 8-20 6-20 16 0 4 4 7 10 7s10-3 10-7"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* u — second u, no tail */}
      <path
        d="M116 18v22c0 8 5 12 12 12s12-4 12-12V18"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* k */}
      <path
        d="M158 10v42"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M158 34l16-16M158 34l16 18"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Connecting flourish under u-k */}
      <path
        d="M10 58c40 8 120 8 164 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}

// ─── PALETTE DEFINITIONS ───────────────────────────────────────────────────────

const palettes = [
  {
    name: "Palette 1",
    label: "Warm amber + deep teal",
    base: "#fdfaf4",
    primary: "#b8651c",
    secondary: "#1a5f5a",
    cta: "#e8715a",
    ctaText: "#ffffff",
  },
  {
    name: "Palette 2",
    label: "Terracotta + sage + gold",
    base: "#f7f3ec",
    primary: "#c56745",
    secondary: "#7a8a6a",
    cta: "#d4a04a",
    ctaText: "#ffffff",
  },
  {
    name: "Palette 3",
    label: "Deep ink + cream + electric pop",
    base: "#0f0e0b",
    primary: "#f5efe0",
    secondary: "#ffa94d",
    cta: "#ff5e3a",
    ctaText: "#ffffff",
  },
];

const logos = [
  { name: "Logo A", label: "Wordmark with character", component: LogoA },
  { name: "Logo B", label: "Mark + wordmark", component: LogoB },
  { name: "Logo C", label: "Playful serif with flourish", component: LogoC },
];

// ─── HERO VARIANT COMPONENT ───────────────────────────────────────────────────

function HeroVariant({
  logo,
  palette,
  variantNumber,
}: {
  logo: (typeof logos)[number];
  palette: (typeof palettes)[number];
  variantNumber: number;
}) {
  const LogoComponent = logo.component;

  return (
    <section
      className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 py-20"
      style={{ backgroundColor: palette.base }}
    >
      {/* Variant label */}
      <div
        className="absolute top-4 left-4 text-xs font-mono px-3 py-1 rounded-full border"
        style={{
          color: palette.secondary,
          borderColor: palette.secondary,
          opacity: 0.7,
        }}
      >
        Variant {variantNumber} — {logo.name} · {palette.name}
      </div>

      <div className="max-w-3xl mx-auto text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <LogoComponent color={palette.primary} />
        </div>

        {/* Headline */}
        <h1
          className={`${instrumentSerif.className} text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight`}
          style={{ color: palette.primary }}
        >
          Write like you. Post like you.
          <br />
          Except you didn&rsquo;t have to.
        </h1>

        {/* Subhead */}
        <p
          className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
          style={{ color: palette.secondary }}
        >
          Utsuk gives D2C brands 30 days of on-brand content — posts, captions,
          ads — that actually sound like the brand. Not like ChatGPT.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            className="px-8 py-3 rounded-lg font-medium text-base transition-transform hover:scale-105"
            style={{
              backgroundColor: palette.cta,
              color: palette.ctaText,
            }}
          >
            Start free sample
          </button>
          <button
            className="px-8 py-3 rounded-lg font-medium text-base border-2 transition-transform hover:scale-105"
            style={{
              borderColor: palette.primary,
              color: palette.primary,
              backgroundColor: "transparent",
            }}
          >
            See how it works
          </button>
        </div>
      </div>

      {/* Bottom caption */}
      <div
        className="absolute bottom-6 text-center text-sm font-mono"
        style={{ color: palette.secondary, opacity: 0.5 }}
      >
        {logo.label} · {palette.label}
      </div>
    </section>
  );
}

// ─── DIVIDER ───────────────────────────────────────────────────────────────────

function Divider({
  variantNumber,
  logo,
  palette,
}: {
  variantNumber: number;
  logo: string;
  palette: string;
}) {
  return (
    <div className="bg-neutral-900 text-neutral-400 text-center py-3 text-xs font-mono tracking-wide">
      Variant {variantNumber} — {logo}, {palette}
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  let variantNumber = 0;

  const variants: { logo: (typeof logos)[number]; palette: (typeof palettes)[number]; num: number }[] = [];
  for (const logo of logos) {
    for (const palette of palettes) {
      variantNumber++;
      variants.push({ logo, palette, num: variantNumber });
    }
  }

  return (
    <div className={instrumentSerif.variable}>
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-sm text-white px-6 py-4 flex items-center justify-between border-b border-neutral-700">
        <div>
          <p className="font-medium text-sm">
            Utsuk preview mocks — scroll to compare
          </p>
          <p className="text-neutral-400 text-xs mt-0.5">
            Pick by texting @AdClaw: logo letter + palette number (e.g. &ldquo;B2&rdquo;)
          </p>
        </div>
        <div className="text-xs text-neutral-500 font-mono">
          {variants.length} variants
        </div>
      </header>

      {/* Variant cards */}
      {variants.map((v, i) => (
        <div key={i}>
          <Divider
            variantNumber={v.num}
            logo={v.logo.name}
            palette={v.palette.name}
          />
          <HeroVariant
            logo={v.logo}
            palette={v.palette}
            variantNumber={v.num}
          />
        </div>
      ))}

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-500 text-center py-8 text-xs font-mono">
        End of preview — {variants.length} variants total
        <br />
        <span className="text-neutral-600 mt-2 block">
          Logo (A/B/C) x Palette (1/2/3) = 9 combinations
        </span>
      </footer>
    </div>
  );
}
