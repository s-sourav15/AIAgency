import Link from "next/link";

export default function GalleryPage() {
  return (
    <div className="flex min-h-dvh flex-col" style={{ backgroundColor: "#fafafa" }}>
      <header className="px-6 py-8">
        <span className="text-sm tracking-widest text-neutral-400" style={{ fontFamily: "var(--font-mono)" }}>LOGO</span>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-5 pb-12">
        <h1 className="mx-auto max-w-lg text-center text-3xl font-black tracking-tight text-neutral-900 md:text-4xl">
          Four directions. Pick one.
        </h1>
        <p className="mx-auto max-w-md text-center text-sm text-neutral-500">
          Same product, four moods. Scroll each to feel the full story.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          {/* A — Saturated */}
          <Link
            href="/a"
            className="group relative flex min-h-[44vh] flex-col justify-end overflow-hidden rounded-2xl p-8 transition-transform hover:scale-[0.997]"
            style={{ backgroundColor: "#fdf7ed" }}
          >
            <div className="absolute right-6 top-6 flex gap-2">
              <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: "#e85410" }} />
              <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: "#2d5a3e" }} />
              <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: "#f26e9a" }} />
            </div>
            <h2 className="text-4xl font-black text-[#1a1a1a] md:text-5xl">
              Your brand wrote it.
            </h2>
            <p className="mt-2 text-sm text-[#1a1a1a]/60">
              A — Saturated
            </p>
            <span className="mt-4 text-sm font-semibold tracking-wide underline underline-offset-4 group-hover:no-underline" style={{ color: "#e85410" }}>
              View full scroll →
            </span>
          </Link>

          {/* B — Serious Craft */}
          <Link
            href="/b"
            className="group relative flex min-h-[44vh] flex-col justify-end overflow-hidden rounded-2xl p-8 transition-transform hover:scale-[0.997]"
            style={{ backgroundColor: "#3a1f2e" }}
          >
            <div className="absolute right-6 top-6 flex gap-2">
              <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: "#d4a04a" }} />
              <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: "#c68a8a" }} />
              <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: "#faf0e0" }} />
            </div>
            <h2 className="text-4xl text-[#faf0e0] md:text-5xl" style={{ fontFamily: "var(--font-serif)" }}>
              We write in your voice.
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#c68a8a" }}>
              B — Serious Craft
            </p>
            <span className="mt-4 text-sm font-semibold tracking-wide underline underline-offset-4 group-hover:no-underline" style={{ color: "#d4a04a" }}>
              View full scroll →
            </span>
          </Link>

          {/* C — Sticker Pack */}
          <Link
            href="/c"
            className="group relative flex min-h-[44vh] flex-col justify-end overflow-hidden rounded-2xl p-8 transition-transform hover:scale-[0.997]"
            style={{ backgroundColor: "#fefbf3" }}
          >
            <div className="absolute left-12 top-10 h-16 w-16 rounded-full opacity-60" style={{ backgroundColor: "#8b5cf6" }} />
            <div className="absolute right-16 top-16 h-10 w-10 rounded-lg opacity-50 rotate-12" style={{ backgroundColor: "#ff6b6b" }} />
            <div className="absolute right-8 top-8 h-8 w-8 rounded-full opacity-50" style={{ backgroundColor: "#fde047" }} />
            <h2 className="relative text-4xl font-extrabold text-[#1a1a1a] md:text-5xl">
              Content that doesn&apos;t sound like ChatGPT.
            </h2>
            <span className="mt-1 text-lg" style={{ fontFamily: "var(--font-handwriting)", color: "#8b5cf6" }}>
              ← for real
            </span>
            <p className="mt-2 text-sm text-[#1a1a1a]/60">
              C — Sticker Pack
            </p>
            <span className="mt-4 text-sm font-semibold tracking-wide text-[#8b5cf6] underline underline-offset-4 group-hover:no-underline">
              View full scroll →
            </span>
          </Link>

          {/* D — Bold Monochrome */}
          <Link
            href="/d"
            className="group relative flex min-h-[44vh] flex-col justify-end overflow-hidden rounded-2xl p-8 transition-transform hover:scale-[0.997]"
            style={{ backgroundColor: "#0a0a0a" }}
          >
            <div className="absolute right-6 top-6" style={{ fontFamily: "var(--font-mono)", color: "#a8a29e", fontSize: "11px" }}>
              01 / HERO
            </div>
            <h2 className="text-4xl font-black text-white md:text-5xl">
              We just do the actual <span style={{ color: "#ff5b2c" }}>typing.</span>
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#a8a29e" }}>
              D — Bold Monochrome
            </p>
            <span className="mt-4 text-sm font-semibold tracking-wide underline underline-offset-4 group-hover:no-underline" style={{ color: "#ff5b2c" }}>
              View full scroll →
            </span>
          </Link>
        </div>
      </main>

      <footer className="border-t border-neutral-200 px-6 py-4">
        <span className="text-xs text-neutral-400">© LOGO 2026</span>
      </footer>
    </div>
  );
}
