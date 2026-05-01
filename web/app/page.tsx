import Link from "next/link";

export default function GalleryPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-6 py-5">
        <span className="font-mono text-sm text-neutral-400">LOGO</span>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-10">
        <p className="mx-auto max-w-lg text-center text-sm text-neutral-500">
          Three design directions — scroll, click to preview each.
        </p>

        <Link
          href="/v1"
          className="group relative flex min-h-[40vh] flex-col justify-end overflow-hidden rounded-2xl p-8 transition-transform hover:scale-[0.995]"
          style={{ backgroundColor: "#f4ede0" }}
        >
          <div className="absolute right-8 top-8 text-[5rem] leading-none text-[#1a1a1a]/10" style={{ fontFamily: "var(--font-serif)" }}>
            *
          </div>
          <h2 className="text-3xl text-[#1a1a1a]" style={{ fontFamily: "var(--font-serif)" }}>
            V1 — Letterpress
          </h2>
          <p className="mt-2 text-sm text-[#1a1a1a]/60" style={{ fontFamily: "var(--font-serif)" }}>
            Serious. Crafted. Penguin Classics.
          </p>
          <span className="mt-4 text-sm font-medium text-[#1a1a1a] underline underline-offset-4 group-hover:no-underline">
            View →
          </span>
        </Link>

        <Link
          href="/v2"
          className="group relative flex min-h-[40vh] flex-col justify-end overflow-hidden rounded-2xl p-8 transition-transform hover:scale-[0.995]"
          style={{ backgroundColor: "#0a0a0a" }}
        >
          <div className="absolute right-8 top-8 text-xs text-[#f5f0e4]/30" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            ~/LOGO$
          </div>
          <h2 className="text-3xl text-[#f5f0e4]" style={{ fontFamily: "var(--font-mono)" }}>
            V2 — Terminal
          </h2>
          <p className="mt-2 text-sm text-[#f5f0e4]/60" style={{ fontFamily: "var(--font-mono)" }}>
            Dev-tool energy. Monospaced. Confident.
          </p>
          <span className="mt-4 text-sm font-medium text-[#f0d96e] underline underline-offset-4 group-hover:no-underline" style={{ fontFamily: "var(--font-mono)" }}>
            View →
          </span>
        </Link>

        <Link
          href="/v3"
          className="group relative flex min-h-[40vh] flex-col justify-end overflow-hidden rounded-2xl p-8 transition-transform hover:scale-[0.995]"
          style={{
            backgroundColor: "#faf8f1",
            backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(180,170,150,0.15) 31px, rgba(180,170,150,0.15) 32px)",
          }}
        >
          <h2 className="text-3xl text-[#1a1a1a]" style={{ fontFamily: "var(--font-handwriting)" }}>
            V3 — Notepad
          </h2>
          <p className="mt-2 text-sm text-[#1a1a1a]/60" style={{ fontFamily: "var(--font-handwriting)" }}>
            Handwritten. Warm. Unfussy.
          </p>
          <span className="mt-4 text-sm font-medium text-[#8b2c2c] underline underline-offset-4 group-hover:no-underline">
            View →
          </span>
        </Link>
      </main>
    </div>
  );
}
