"use client";

/**
 * Delivery panel — renders the right action for whatever delivery
 * shape the backend produced for a completed job.
 *
 * Three cases:
 *  1. `delivery_type === "drive"` → show "Open in Drive" button +
 *     helper text explaining the folder contents.
 *  2. `delivery_type === "zip"`   → show "Download ZIP" button that
 *     streams the zip via /api/jobs/{id}/delivery?download=true.
 *  3. no delivery yet             → show two buttons that trigger
 *     the export endpoints on demand ("Build Drive link" /
 *     "Build ZIP"). Useful for older jobs finished before auto-delivery
 *     was wired, and for re-generating after edits.
 *
 * This component is framework-only — no styling opinions beyond
 * Tailwind utility classes that match utsuk.studio's existing palette.
 * Drop it into the job status page and pass the fields it needs.
 */

import { useState } from "react";

type DeliveryType = "drive" | "zip" | null | undefined;

export interface DeliveryPanelProps {
  jobId: string;
  apiUrl: string; // e.g. NEXT_PUBLIC_API_URL
  deliveryType: DeliveryType;
  deliveryUrl: string | null | undefined;
  // Called after a successful export so the parent can refresh job state.
  onExported?: () => void;
}

export function DeliveryPanel({
  jobId,
  apiUrl,
  deliveryType,
  deliveryUrl,
  onExported,
}: DeliveryPanelProps) {
  const [busy, setBusy] = useState<"drive" | "zip" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buildExport(kind: "drive" | "zip") {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/jobs/${jobId}/export/${kind}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          kind === "drive" && res.status === 503
            ? "Drive delivery isn't configured on this backend yet."
            : `Export failed (${res.status}): ${body.slice(0, 200)}`,
        );
      }
      onExported?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  // Case 1: delivered to Drive — show the agency-feel CTA.
  if (deliveryType === "drive" && deliveryUrl) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Your deliverable is ready</h2>
        <p className="mt-2 text-sm text-neutral-600">
          A Google Drive folder with your 30-day calendar, the content as a
          Google Doc, all images, and a CSV for Buffer/Hootsuite import.
        </p>
        <a
          href={deliveryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Open in Drive →
        </a>
        <div className="mt-3 text-xs text-neutral-500">
          Prefer a file?{" "}
          <button
            type="button"
            className="underline hover:text-neutral-900"
            onClick={() => buildExport("zip")}
            disabled={busy !== null}
          >
            {busy === "zip" ? "Packaging…" : "Download as ZIP"}
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </section>
    );
  }

  // Case 2: ZIP only.
  if (deliveryType === "zip") {
    const downloadUrl = `${apiUrl}/api/jobs/${jobId}/delivery?download=true`;
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Your deliverable is ready</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Your 30-day calendar, images, and CSV packaged into one download.
        </p>
        <a
          href={downloadUrl}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Download ZIP →
        </a>
        <div className="mt-3 text-xs text-neutral-500">
          Want it on Drive instead?{" "}
          <button
            type="button"
            className="underline hover:text-neutral-900"
            onClick={() => buildExport("drive")}
            disabled={busy !== null}
          >
            {busy === "drive" ? "Uploading…" : "Send to Drive"}
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </section>
    );
  }

  // Case 3: nothing yet — two on-demand buttons.
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Package your deliverable</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Pick how you want to receive your 30-day calendar. You can always
        build the other format later.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
          onClick={() => buildExport("drive")}
          disabled={busy !== null}
        >
          {busy === "drive" ? "Uploading to Drive…" : "Send to Drive"}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
          onClick={() => buildExport("zip")}
          disabled={busy !== null}
        >
          {busy === "zip" ? "Packaging…" : "Download ZIP"}
        </button>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </section>
  );
}
