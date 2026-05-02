"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* ─────────────── types matching the backend ─────────────── */

type JobStatus =
  | "pending"
  | "strategizing"
  | "creating"
  | "validating"
  | "generating_images"
  | "completed"
  | "failed";

type JobResponse = {
  id: string;
  brand_id: string;
  input_type: string;
  status: JobStatus;
  platforms: string[];
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

type JobStats = {
  job_id: string;
  status: JobStatus;
  total_pieces: number;
  validated_pieces: number;
  average_quality_score: number;
  total_regenerations: number;
};

type ContentPiece = {
  id: string;
  day_number: number;
  platform: string;
  format: string;
  copy_text: string;
  hashtags: string[];
  image_urls: string[];
  validation_score: number | null;
  status: string;
};

type CalendarDay = {
  day_number: number;
  theme?: string;
  pieces: ContentPiece[];
};

type CalendarResponse = {
  brand_id: string;
  days: CalendarDay[];
};

/* ─────────────── status pipeline ─────────────── */

const STAGES: { key: JobStatus; label: string }[] = [
  { key: "pending", label: "Queued" },
  { key: "strategizing", label: "Planning calendar" },
  { key: "creating", label: "Writing copy" },
  { key: "validating", label: "Anti-slop check" },
  { key: "generating_images", label: "Generating images" },
  { key: "completed", label: "Ready" },
];

function stageIndex(status: JobStatus): number {
  const i = STAGES.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

const POLL_MS = 3000;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.utsuk.studio";

/* ─────────────── page ─────────────── */

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [job, setJob] = useState<JobResponse | null>(null);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  /* Poll job + stats until completed/failed. */
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const [jr, sr] = await Promise.all([
          fetch(`${API_URL}/api/jobs/${id}`, { cache: "no-store" }),
          fetch(`${API_URL}/api/jobs/${id}/stats`, { cache: "no-store" }),
        ]);
        if (!jr.ok) throw new Error(`job fetch failed (${jr.status})`);
        const jData: JobResponse = await jr.json();
        const sData: JobStats | null = sr.ok ? await sr.json() : null;

        if (cancelled) return;
        setJob(jData);
        if (sData) setStats(sData);
        setError(null);

        if (jData.status === "completed") {
          // Fetch the calendar once the job is done.
          const cr = await fetch(
            `${API_URL}/api/content/${jData.brand_id}/calendar`,
            { cache: "no-store" }
          );
          if (cr.ok) {
            const cData: CalendarResponse = await cr.json();
            if (!cancelled) setCalendar(cData);
          }
          return; // stop polling
        }
        if (jData.status === "failed") return;

        timer = setTimeout(tick, POLL_MS);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not reach the generator.");
        timer = setTimeout(tick, POLL_MS * 2);
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  const currentStage = useMemo(
    () => (job ? stageIndex(job.status) : 0),
    [job]
  );

  const handleZipExport = async () => {
    if (!job) return;
    setZipBusy(true);
    try {
      const r = await fetch(`${API_URL}/api/jobs/${id}/export/zip`, {
        method: "POST",
      });
      if (!r.ok) throw new Error(`export failed (${r.status})`);
      const data: { delivery_url: string; piece_count: number; size_bytes: number } =
        await r.json();
      setZipUrl(data.delivery_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ZIP export failed.");
    } finally {
      setZipBusy(false);
    }
  };

  /* ─────────── render ─────────── */

  return (
    <main className="min-h-dvh bg-[#fffdf7] text-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 underline-offset-4 hover:underline"
          >
            ← back to Utsuk
          </Link>
          <span className="text-xs text-gray-400 font-mono">job {id.slice(0, 8)}</span>
        </div>

        <h1
          className="text-3xl md:text-5xl text-gray-900 mb-2"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
        >
          Your content is being made.
        </h1>
        <p className="text-base md:text-lg text-gray-600 mb-10">
          This usually takes 2–4 minutes. Keep this tab open; refresh is safe.
        </p>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-[#ff6b6b]/10 border border-[#ff6b6b] rounded-xl px-5 py-3 text-sm text-[#ff6b6b]">
            {error}
          </div>
        )}

        {/* Failure banner */}
        {job?.status === "failed" && (
          <div className="mb-8 bg-[#ff6b6b]/10 border-2 border-[#ff6b6b] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-[#ff6b6b] mb-1">Generation failed</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {job.error_message || "Unknown error. Check server logs."}
            </p>
          </div>
        )}

        {/* Pipeline stepper */}
        <ol className="mb-10 space-y-3">
          {STAGES.map((s, i) => {
            const done = i < currentStage || job?.status === "completed";
            const active = i === currentStage && job?.status !== "completed" && job?.status !== "failed";
            return (
              <li key={s.key} className="flex items-center gap-4">
                <span
                  className={
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 " +
                    (done
                      ? "bg-[#34d399] border-[#34d399] text-white"
                      : active
                        ? "bg-[#8b5cf6] border-[#8b5cf6] text-white animate-pulse"
                        : "bg-white border-gray-300 text-gray-400")
                  }
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={
                    "text-base md:text-lg " +
                    (done
                      ? "text-gray-900"
                      : active
                        ? "text-[#8b5cf6] font-semibold"
                        : "text-gray-400")
                  }
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Stats */}
        {stats && (
          <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Pieces" value={stats.total_pieces} />
            <StatTile label="Validated" value={stats.validated_pieces} />
            <StatTile
              label="Avg score"
              value={
                stats.average_quality_score
                  ? stats.average_quality_score.toFixed(2)
                  : "—"
              }
            />
            <StatTile label="Regens" value={stats.total_regenerations} />
          </div>
        )}

        {/* Done → download + calendar */}
        {job?.status === "completed" && (
          <section className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button
                onClick={handleZipExport}
                disabled={zipBusy}
                className="bg-[#8b5cf6] text-white font-bold rounded-xl px-6 py-3 text-base hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
              >
                {zipBusy ? "Packaging…" : zipUrl ? "Re-package ZIP" : "Download ZIP"}
              </button>
              {zipUrl && (
                <span className="text-sm text-gray-600 font-mono break-all">
                  {zipUrl}
                </span>
              )}
            </div>

            {calendar ? (
              <CalendarView calendar={calendar} />
            ) : (
              <p className="text-gray-500">Loading calendar…</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function CalendarView({ calendar }: { calendar: CalendarResponse }) {
  return (
    <div className="space-y-8">
      {calendar.days.map((day) => (
        <article
          key={day.day_number}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <header className="mb-4 flex items-baseline gap-3">
            <h3 className="text-xl font-extrabold text-gray-900">
              Day {day.day_number}
            </h3>
            {day.theme && (
              <span className="text-sm text-gray-500 italic">{day.theme}</span>
            )}
          </header>
          <ul className="space-y-5">
            {day.pieces.map((piece) => (
              <li
                key={piece.id}
                className="border-l-4 border-[#8b5cf6]/40 pl-4 py-1"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="uppercase text-xs font-bold tracking-wide text-[#8b5cf6]">
                    {piece.platform}
                  </span>
                  {piece.validation_score !== null && (
                    <span className="text-xs text-gray-500">
                      score {piece.validation_score.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {piece.copy_text}
                </p>
                {piece.hashtags?.length > 0 && (
                  <p className="mt-2 text-sm text-[#06b6d4]">
                    {piece.hashtags.map((t) => `#${t}`).join(" ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
