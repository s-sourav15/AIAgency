"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

const schema = z.object({
  brief: z.string().min(50, "Please provide at least 50 characters about your brand."),
  brandName: z.union([z.string().min(2, "Brand name must be at least 2 characters."), z.literal("")]),
  email: z.union([z.email("Please enter a valid email address."), z.literal("")]),
});

type FormData = z.infer<typeof schema>;

/* ─── Phone Mockup Data ─── */
const samples = [
  {
    brand: "Hoya Beauty",
    handle: "@hoyabeauty",
    copy: "Monsoon ruined your makeup? Good. That means you’re actually going outside. Our 3-in-1 stick stays put when your plans don’t.",
    score: 0.89,
  },
  {
    brand: "Kalki Apparel",
    handle: "@kalkiapparel",
    copy: "This blouse has been in 40 weddings. It has seen more mehendi than most guests. Still fits like day one.",
    score: 0.92,
  },
  {
    brand: "Jhola Foods",
    handle: "@jholafoods",
    copy: "We don’t do healthy. We do delicious that happens to not ruin your afternoon.",
    score: 0.87,
  },
];

const valueProps = [
  {
    heading: "Anti-slop scoring on every piece",
    body: "Every piece of content is scored against a proprietary authenticity index. If it reads like it was generated, it doesn’t ship.",
  },
  {
    heading: "Trained on Indian D2C voice",
    body: "Not American SaaS copy translated for India. Built from thousands of high-performing Indian brand posts, ads, and product pages.",
  },
  {
    heading: "One brief → 30 days of content",
    body: "You spend 15 minutes on a brand brief. We return a full month of posts, captions, and hooks—ready to schedule.",
  },
  {
    heading: "Not a wrapper. A writing engine.",
    body: "We didn’t put a form on top of ChatGPT. This is a purpose-built pipeline with rewriting, scoring, and style-matching layers.",
  },
];

export default function SeriousCraftPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedBrand, setSubmittedBrand] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { brief: "", brandName: "", email: "" },
  });

  async function onSubmit(data: FormData) {
    const payload = {
      brief: data.brief,
      brandName: data.brandName || undefined,
      email: data.email || undefined,
    };
    console.log("Intake payload:", payload);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmittedBrand(data.brandName || "your brand");
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#3a1f2e", color: "#faf0e0" }}>
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-tight tracking-tight max-w-5xl"
          style={{ fontFamily: "var(--font-serif)", color: "#faf0e0" }}
        >
          We write in your voice.
          <br />
          <em>Not ours.</em>
        </h1>

        <p
          className="mt-8 text-lg sm:text-xl md:text-2xl max-w-2xl leading-relaxed"
          style={{ fontFamily: "var(--font-sans)", color: "#c68a8a" }}
        >
          A content engine that learns your brand’s tone, writes a month of posts, and scores every piece for authenticity—so nothing generic ever ships.
        </p>

        <a
          href="#intake"
          className="mt-12 inline-block px-10 py-4 rounded-full text-lg font-semibold tracking-wide transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#d4a04a", color: "#3a1f2e", fontFamily: "var(--font-sans)" }}
        >
          Start your brief
        </a>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 md:px-12 lg:px-24" style={{ backgroundColor: "#45273a" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl mb-20 text-center"
            style={{ fontFamily: "var(--font-serif)", color: "#faf0e0" }}
          >
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
            {[
              { num: "01", title: "Share your brand brief", desc: "Tell us about your brand, audience, and voice in a short questionnaire. Takes about 15 minutes." },
              { num: "02", title: "Our engine crafts a month of content", desc: "Purpose-built layers rewrite, score, and refine—generating 30 days of posts tuned to your voice." },
              { num: "03", title: "Every piece scored for authenticity", desc: "Nothing ships unless it passes our anti-slop index. You get only work that sounds like you." },
            ].map((step) => (
              <div key={step.num} className="flex flex-col">
                <span
                  className="text-6xl md:text-7xl font-light mb-4"
                  style={{ fontFamily: "var(--font-serif)", color: "#d4a04a" }}
                >
                  {step.num}
                </span>
                <h3
                  className="text-xl sm:text-2xl mb-3"
                  style={{ fontFamily: "var(--font-serif)", color: "#faf0e0" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-base leading-relaxed"
                  style={{ fontFamily: "var(--font-sans)", color: "#c68a8a" }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — SAMPLE OUTPUT SHOWCASE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 md:px-12" style={{ backgroundColor: "#2e1522" }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl mb-6 text-center"
            style={{ fontFamily: "var(--font-serif)", color: "#faf0e0" }}
          >
            What we deliver
          </h2>
          <p
            className="text-center text-lg mb-20 max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-sans)", color: "#c68a8a" }}
          >
            Real output from real briefs. Every caption scored and ready to post.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {samples.map((s) => (
              <div
                key={s.handle}
                className="rounded-3xl p-6 flex flex-col justify-between border"
                style={{
                  backgroundColor: "#3a1f2e",
                  borderColor: "#d4a04a",
                  minHeight: "420px",
                }}
              >
                {/* Phone top bar */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: "#d4a04a", color: "#3a1f2e" }}
                    >
                      {s.brand.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-sans)", color: "#faf0e0" }}>
                        {s.brand}
                      </p>
                      <p className="text-xs" style={{ color: "#c68a8a" }}>
                        {s.handle}
                      </p>
                    </div>
                  </div>

                  <p
                    className="text-base leading-relaxed"
                    style={{ fontFamily: "var(--font-sans)", color: "#faf0e0" }}
                  >
                    &ldquo;{s.copy}&rdquo;
                  </p>
                </div>

                {/* Score badge */}
                <div className="mt-8 flex items-center gap-2">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: "#d4a04a", color: "#3a1f2e" }}
                  >
                    {s.score.toFixed(2)}
                  </span>
                  <span className="text-xs" style={{ color: "#c68a8a", fontFamily: "var(--font-sans)" }}>
                    authenticity score
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — WHY US
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 md:px-12 lg:px-24" style={{ backgroundColor: "#3a1f2e" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl mb-24 text-center"
            style={{ fontFamily: "var(--font-serif)", color: "#faf0e0" }}
          >
            Why us
          </h2>

          <div className="space-y-24">
            {valueProps.map((prop, i) => (
              <div
                key={prop.heading}
                className={`flex flex-col md:flex-row md:items-start gap-6 md:gap-16 ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <h3
                  className="text-3xl sm:text-4xl md:text-5xl leading-tight flex-shrink-0 md:w-1/2"
                  style={{ fontFamily: "var(--font-serif)", color: "#faf0e0" }}
                >
                  {prop.heading}
                </h3>
                <p
                  className="text-lg leading-relaxed md:w-1/2 pt-2"
                  style={{ fontFamily: "var(--font-sans)", color: "#c68a8a" }}
                >
                  {prop.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — INPUT FORM
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="intake" className="py-32 px-6 md:px-12" style={{ backgroundColor: "#45273a" }}>
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl mb-6 text-center"
            style={{ fontFamily: "var(--font-serif)", color: "#faf0e0" }}
          >
            {submitted ? "We’re on it." : "Tell us about your brand"}
          </h2>

          {submitted ? (
            <div className="text-center mt-12">
              <p
                className="text-xl leading-relaxed"
                style={{ fontFamily: "var(--font-sans)", color: "#c68a8a" }}
              >
                We’ve received your brief for <strong style={{ color: "#faf0e0" }}>{submittedBrand}</strong>. Our engine is warming up. Expect your first batch within 48 hours.
              </p>
              <div
                className="mt-8 inline-block px-6 py-3 rounded-full text-sm font-semibold"
                style={{ backgroundColor: "#d4a04a", color: "#3a1f2e", fontFamily: "var(--font-sans)" }}
              >
                Brief received
              </div>
            </div>
          ) : (
            <>
              <p
                className="text-center text-lg mb-16 max-w-lg mx-auto"
                style={{ fontFamily: "var(--font-sans)", color: "#c68a8a" }}
              >
                The more you share, the better we write. Only the brand brief is required.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Brief */}
                <div>
                  <label
                    htmlFor="brief"
                    className="block text-sm font-medium mb-2"
                    style={{ fontFamily: "var(--font-sans)", color: "#faf0e0" }}
                  >
                    Brand brief *
                  </label>
                  <textarea
                    id="brief"
                    rows={6}
                    placeholder="Tell us about your brand, audience, tone of voice, what you sell, and what makes you different..."
                    className="w-full rounded-xl px-5 py-4 text-base leading-relaxed resize-y border focus:outline-none focus:ring-2 focus:ring-[#d4a04a] transition-shadow"
                    style={{
                      backgroundColor: "#3a1f2e",
                      borderColor: "#5a3548",
                      color: "#faf0e0",
                      fontFamily: "var(--font-sans)",
                    }}
                    {...register("brief")}
                  />
                  {errors.brief && (
                    <p className="mt-2 text-sm" style={{ color: "#d4a04a" }}>
                      {errors.brief.message}
                    </p>
                  )}
                </div>

                {/* Brand Name */}
                <div>
                  <label
                    htmlFor="brandName"
                    className="block text-sm font-medium mb-2"
                    style={{ fontFamily: "var(--font-sans)", color: "#faf0e0" }}
                  >
                    Brand name
                  </label>
                  <input
                    id="brandName"
                    type="text"
                    placeholder="e.g. Hoya Beauty"
                    className="w-full rounded-xl px-5 py-4 text-base border focus:outline-none focus:ring-2 focus:ring-[#d4a04a] transition-shadow"
                    style={{
                      backgroundColor: "#3a1f2e",
                      borderColor: "#5a3548",
                      color: "#faf0e0",
                      fontFamily: "var(--font-sans)",
                    }}
                    {...register("brandName")}
                  />
                  {errors.brandName && (
                    <p className="mt-2 text-sm" style={{ color: "#d4a04a" }}>
                      {errors.brandName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2"
                    style={{ fontFamily: "var(--font-sans)", color: "#faf0e0" }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@brand.com"
                    className="w-full rounded-xl px-5 py-4 text-base border focus:outline-none focus:ring-2 focus:ring-[#d4a04a] transition-shadow"
                    style={{
                      backgroundColor: "#3a1f2e",
                      borderColor: "#5a3548",
                      color: "#faf0e0",
                      fontFamily: "var(--font-sans)",
                    }}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm" style={{ color: "#d4a04a" }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full text-lg font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: "#d4a04a", color: "#3a1f2e", fontFamily: "var(--font-sans)" }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit your brief"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="py-12 px-6 text-center" style={{ backgroundColor: "#2e1522" }}>
        <p
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: "var(--font-serif)", color: "#faf0e0" }}
        >
          LOGO
        </p>
        <p className="text-sm" style={{ fontFamily: "var(--font-sans)", color: "#c68a8a" }}>
          &copy; {new Date().getFullYear()} LOGO. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
