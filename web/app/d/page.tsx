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

export default function BoldMonochromePage() {
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
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#ff5b2c]/30 selection:text-white">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 py-32">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.95] tracking-tight max-w-6xl">
          Write like you.
          <br />
          Post like you.
          <br />
          We just do the actual{" "}
          <span className="text-[#ff5b2c]">typing</span>.
        </h1>
        <p className="mt-8 text-lg md:text-xl text-[#a8a29e] max-w-2xl leading-relaxed">
          A content engine for Indian D2C brands that sounds like you wrote it —
          because we trained on how you think, not how marketers talk.
        </p>
        <div className="mt-12">
          <a
            href="#start"
            className="inline-block bg-[#ff5b2c] text-white font-bold text-lg px-10 py-4 rounded hover:bg-[#e04e24] transition-colors"
          >
            Generate your first batch
          </a>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 md:px-16 lg:px-24 py-32 border-t border-white/10">
        <p
          className="text-sm tracking-widest text-[#ff5b2c] uppercase mb-20"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          01 / How It Works
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 max-w-6xl">
          {/* Step 1 */}
          <div>
            <span
              className="block text-6xl lg:text-7xl font-black text-[#ff5b2c] mb-6"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              01
            </span>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Paste your brand brief
            </h3>
            <p className="text-[#a8a29e] leading-relaxed">
              Tell us who you are, what you sell, how you talk. One textarea.
              Two minutes. That&apos;s the only setup.
            </p>
          </div>

          {/* Step 2 */}
          <div>
            <span
              className="block text-6xl lg:text-7xl font-black text-[#ff5b2c] mb-6"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              02
            </span>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Engine writes 30 days of content
            </h3>
            <p className="text-[#a8a29e] leading-relaxed">
              Posts, captions, hooks — all calibrated to your voice. Not
              generic. Not &quot;engaging&quot;. Yours.
            </p>
          </div>

          {/* Step 3 */}
          <div>
            <span
              className="block text-6xl lg:text-7xl font-black text-[#ff5b2c] mb-6"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              03
            </span>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Anti-slop scoring on every piece
            </h3>
            <p className="text-[#a8a29e] leading-relaxed">
              Every post gets a score. If it sounds like AI wrote it, it gets
              killed before you ever see it.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SAMPLE OUTPUT
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 md:px-16 lg:px-24 py-32 border-t border-white/10">
        <p
          className="text-sm tracking-widest text-[#ff5b2c] uppercase mb-20"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          02 / Sample Output
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          {/* Phone 1 */}
          <div className="border border-white/20 rounded-[2rem] p-6 pt-10 pb-8 flex flex-col justify-between min-h-[420px]">
            <div>
              <p className="text-[#a8a29e] text-sm mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                @hoyabeauty
              </p>
              <p className="text-xs text-[#a8a29e] mb-6">Hoya Beauty</p>
              <p className="text-white text-base leading-relaxed">
                Monsoon ruined your makeup? Good. That means you&apos;re actually
                going outside. Our 3-in-1 stick stays put when your plans
                don&apos;t.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span
                className="text-[#ff5b2c] font-bold text-sm"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                SCORE
              </span>
              <span className="bg-[#ff5b2c] text-white text-sm font-bold px-3 py-1 rounded">
                0.89
              </span>
            </div>
          </div>

          {/* Phone 2 */}
          <div className="border border-white/20 rounded-[2rem] p-6 pt-10 pb-8 flex flex-col justify-between min-h-[420px]">
            <div>
              <p className="text-[#a8a29e] text-sm mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                @kalkiapparel
              </p>
              <p className="text-xs text-[#a8a29e] mb-6">Kalki Apparel</p>
              <p className="text-white text-base leading-relaxed">
                This blouse has been in 40 weddings. It has seen more mehendi
                than most guests. Still fits like day one.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span
                className="text-[#ff5b2c] font-bold text-sm"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                SCORE
              </span>
              <span className="bg-[#ff5b2c] text-white text-sm font-bold px-3 py-1 rounded">
                0.92
              </span>
            </div>
          </div>

          {/* Phone 3 */}
          <div className="border border-white/20 rounded-[2rem] p-6 pt-10 pb-8 flex flex-col justify-between min-h-[420px]">
            <div>
              <p className="text-[#a8a29e] text-sm mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                @jholafoods
              </p>
              <p className="text-xs text-[#a8a29e] mb-6">Jhola Foods</p>
              <p className="text-white text-base leading-relaxed">
                We don&apos;t do healthy. We do delicious that happens to not
                ruin your afternoon.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span
                className="text-[#ff5b2c] font-bold text-sm"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                SCORE
              </span>
              <span className="bg-[#ff5b2c] text-white text-sm font-bold px-3 py-1 rounded">
                0.87
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY US
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 md:px-16 lg:px-24 py-32 border-t border-white/10">
        <p
          className="text-sm tracking-widest text-[#ff5b2c] uppercase mb-20"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          03 / Why Us
        </p>

        <div className="max-w-4xl space-y-16">
          <div className="border-l-4 border-[#ff5b2c] pl-8">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Anti-slop scoring
            </h3>
            <p className="text-[#a8a29e] text-lg leading-relaxed">
              Every piece of content runs through our detection engine. If it
              reads like AI slop — filler words, hollow enthusiasm, corporate
              jargon — it gets flagged and rewritten until it sounds human.
            </p>
          </div>

          <div className="border-l-4 border-[#ff5b2c] pl-8">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Indian D2C voice
            </h3>
            <p className="text-[#a8a29e] text-lg leading-relaxed">
              Built for brands that talk like their customers. Not Silicon
              Valley speak. Not translated American copy. Real Indian internet
              language.
            </p>
          </div>

          <div className="border-l-4 border-[#ff5b2c] pl-8">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              One brief &rarr; 30 days
            </h3>
            <p className="text-[#a8a29e] text-lg leading-relaxed">
              You give us context once. We produce a full month of content.
              Posts, stories, captions — structured, scheduled, ready to ship.
            </p>
          </div>

          <div className="border-l-4 border-[#ff5b2c] pl-8">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Not a wrapper. An engine.
            </h3>
            <p className="text-[#a8a29e] text-lg leading-relaxed">
              We don&apos;t slap a UI on top of ChatGPT and call it a product.
              Custom scoring, voice calibration, format control — built from
              scratch for this one job.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          INPUT FORM
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="start"
        className="px-6 md:px-16 lg:px-24 py-32 border-t border-white/10"
      >
        <p
          className="text-sm tracking-widest text-[#ff5b2c] uppercase mb-20"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          04 / Start
        </p>

        {submitted ? (
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              We&apos;re on it.
            </h2>
            <p className="text-[#a8a29e] text-lg leading-relaxed">
              Content for{" "}
              <span className="text-[#ff5b2c] font-bold">{submittedBrand}</span>{" "}
              is being generated. We&apos;ll have your first batch ready soon.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-2xl space-y-8"
          >
            {/* Brief */}
            <div>
              <label
                htmlFor="brief"
                className="block text-sm font-bold uppercase tracking-wider mb-3"
              >
                Brand Brief{" "}
                <span className="text-[#ff5b2c]">*</span>
              </label>
              <textarea
                id="brief"
                rows={6}
                placeholder="Tell us about your brand — who you are, what you sell, how you talk to customers, what makes you different..."
                className="w-full bg-transparent border border-white/30 rounded-lg px-5 py-4 text-white placeholder:text-[#a8a29e]/60 focus:outline-none focus:border-[#ff5b2c] transition-colors resize-none"
                {...register("brief")}
              />
              {errors.brief && (
                <p className="mt-2 text-sm text-[#ff5b2c]">
                  {errors.brief.message}
                </p>
              )}
            </div>

            {/* Brand Name */}
            <div>
              <label
                htmlFor="brandName"
                className="block text-sm font-bold uppercase tracking-wider mb-3"
              >
                Brand Name{" "}
                <span className="text-[#a8a29e] font-normal normal-case">(optional)</span>
              </label>
              <input
                id="brandName"
                type="text"
                placeholder="e.g. Hoya Beauty"
                className="w-full bg-transparent border border-white/30 rounded-lg px-5 py-4 text-white placeholder:text-[#a8a29e]/60 focus:outline-none focus:border-[#ff5b2c] transition-colors"
                {...register("brandName")}
              />
              {errors.brandName && (
                <p className="mt-2 text-sm text-[#ff5b2c]">
                  {errors.brandName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold uppercase tracking-wider mb-3"
              >
                Email{" "}
                <span className="text-[#a8a29e] font-normal normal-case">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@brand.com"
                className="w-full bg-transparent border border-white/30 rounded-lg px-5 py-4 text-white placeholder:text-[#a8a29e]/60 focus:outline-none focus:border-[#ff5b2c] transition-colors"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-[#ff5b2c]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#ff5b2c] text-white font-bold text-lg px-10 py-4 rounded hover:bg-[#e04e24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Generating..." : "Generate content"}
            </button>
          </form>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="px-6 md:px-16 lg:px-24 py-12 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <span className="text-white font-black text-xl tracking-tight">
          LOGO
        </span>
        <span className="text-[#a8a29e] text-sm">
          &copy; {new Date().getFullYear()} LOGO. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
