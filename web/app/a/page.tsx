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

const samplePosts = [
  {
    brand: "Hoya Beauty",
    handle: "@hoyabeauty",
    text: "Monsoon ruined your makeup? Good. That means youre actually going outside. Our 3-in-1 stick stays put when your plans dont.",
    score: 0.89,
  },
  {
    brand: "Kalki Apparel",
    handle: "@kalkiapparel",
    text: "This blouse has been in 40 weddings. It has seen more mehendi than most guests. Still fits like day one.",
    score: 0.92,
  },
  {
    brand: "Jhola Foods",
    handle: "@jholafoods",
    text: "We dont do healthy. We do delicious that happens to not ruin your afternoon.",
    score: 0.87,
  },
];

const valueProps = [
  {
    title: "Anti-slop scoring on every piece",
    description:
      "Every output gets scored against our proprietary anti-slop model. Below 0.8? Rewritten automatically.",
  },
  {
    title: "Trained on Indian D2C voice",
    description:
      "We studied 500+ Indian D2C brands to understand how they actually talk. Not American corporate. Not influencer cringe.",
  },
  {
    title: "One brief → 30 days of content",
    description:
      "You give us one brand brief. We give you a month of platform-ready content. Captions, hooks, CTAs, threads.",
  },
  {
    title: "Not a ChatGPT wrapper. Custom engine.",
    description:
      "We built our own fine-tuned pipeline. No prompt-chaining hacks. No 'just add more context' cope.",
  },
];

export default function SaturatedPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedBrand, setSubmittedBrand] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      brief: "",
      brandName: "",
      email: "",
    },
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
    <main className="min-h-screen w-full overflow-x-hidden">
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section
        className="min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 py-24"
        style={{ backgroundColor: "#fdf7ed" }}
      >
        <div className="max-w-5xl mx-auto w-full">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight mb-8"
            style={{ fontFamily: "var(--font-sans)", color: "#e85410" }}
          >
            Your brand wrote it.
            <br />
            We just typed it.
          </h1>
          <p className="text-lg md:text-xl max-w-2xl text-neutral-700 mb-12 leading-relaxed">
            Give us your brand brief. Get back a month of content that sounds like you wrote it on
            your best day. Scored against our anti-slop engine so nothing generic ever ships.
          </p>
          <a
            href="#form"
            className="inline-block px-8 py-4 text-lg font-bold text-white rounded-full transition-transform hover:scale-105"
            style={{ backgroundColor: "#e85410" }}
          >
            Generate your content &darr;
          </a>
        </div>

        {/* Pull quote */}
        <div className="max-w-5xl mx-auto w-full mt-20">
          <blockquote
            className="text-2xl md:text-3xl leading-snug pl-6 border-l-4"
            style={{
              fontFamily: "var(--font-serif)",
              color: "#f26e9a",
              borderColor: "#f26e9a",
            }}
          >
            &ldquo;If your content sounds like it could belong to any brand, it belongs to no
            brand.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS SECTION */}
      {/* ============================================ */}
      <section
        className="py-24 md:py-32 px-6 md:px-16 lg:px-24"
        style={{ backgroundColor: "#f26e9a" }}
      >
        <div className="max-w-5xl mx-auto w-full">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-20 text-neutral-900">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {/* Step 1 */}
            <div className="flex flex-col">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-6 text-white"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                1
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">
                Paste your brand brief
              </h3>
              <p className="text-neutral-800 leading-relaxed">
                Tone of voice, target audience, what you sell, how you talk. The more detail, the
                sharper the output.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-6 text-white"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                2
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">
                Our engine writes a month of content
              </h3>
              <p className="text-neutral-800 leading-relaxed">
                Platform-native captions, threads, hooks, and CTAs generated from your brief. Not
                repurposed slop.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-6 text-white"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                3
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">
                Anti-slop scoring ensures quality
              </h3>
              <p className="text-neutral-800 leading-relaxed">
                Every piece is scored. Anything below 0.8 gets auto-rewritten. You only see the
                good stuff.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SAMPLE OUTPUT SHOWCASE */}
      {/* ============================================ */}
      <section
        className="py-24 md:py-32 px-6 md:px-16 lg:px-24"
        style={{ backgroundColor: "#2d5a3e" }}
      >
        <div className="max-w-5xl mx-auto w-full">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6"
            style={{ color: "#fdf7ed" }}
          >
            Real output. Real brands.
          </h2>
          <p className="text-lg mb-16 opacity-80" style={{ color: "#fdf7ed" }}>
            These are actual outputs from our engine, scored and ready to post.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {samplePosts.map((post) => (
              <div key={post.handle} className="flex flex-col items-center">
                {/* Phone mockup */}
                <div
                  className="relative w-full max-w-[280px] rounded-[2.5rem] p-3 shadow-2xl"
                  style={{ backgroundColor: "#1a1a1a" }}
                >
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-xl" />

                  {/* Screen */}
                  <div
                    className="rounded-[2rem] p-5 pt-10 min-h-[340px] flex flex-col justify-between"
                    style={{ backgroundColor: "#fdf7ed" }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: "#e85410" }}
                        >
                          {post.brand[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{post.brand}</p>
                          <p className="text-xs text-neutral-500">{post.handle}</p>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-800 leading-relaxed">{post.text}</p>
                    </div>

                    {/* Score badge */}
                    <div className="mt-6 flex justify-end">
                      <span
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: "#2d5a3e" }}
                      >
                        <span className="opacity-70">SCORE</span> {post.score}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pull quote */}
          <blockquote
            className="mt-20 text-2xl md:text-3xl leading-snug max-w-3xl"
            style={{
              fontFamily: "var(--font-serif)",
              color: "#f26e9a",
            }}
          >
            &ldquo;Content that scores below 0.8 never reaches you. That&rsquo;s our
            promise.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* ============================================ */}
      {/* WHY US SECTION */}
      {/* ============================================ */}
      <section
        className="py-24 md:py-32 px-6 md:px-16 lg:px-24"
        style={{ backgroundColor: "#fdf7ed" }}
      >
        <div className="max-w-5xl mx-auto w-full">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-20"
            style={{ color: "#e85410" }}
          >
            Why us
          </h2>

          <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-16 md:gap-y-12">
            {valueProps.map((prop, i) => (
              <div
                key={prop.title}
                className={`relative p-8 rounded-2xl ${
                  i % 2 === 1 ? "md:translate-y-8" : ""
                }`}
                style={{
                  backgroundColor: i === 0 ? "#e85410" : i === 1 ? "#2d5a3e" : i === 2 ? "#f26e9a" : "#1a1a1a",
                }}
              >
                <h3
                  className="text-xl md:text-2xl font-bold mb-3"
                  style={{ color: "#fdf7ed" }}
                >
                  {prop.title}
                </h3>
                <p className="leading-relaxed" style={{ color: "rgba(253,247,237,0.85)" }}>
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* INPUT FORM SECTION */}
      {/* ============================================ */}
      <section
        id="form"
        className="py-24 md:py-32 px-6 md:px-16 lg:px-24"
        style={{ backgroundColor: "#fdf7ed" }}
      >
        <div className="max-w-2xl mx-auto w-full">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-4"
            style={{ color: "#e85410" }}
          >
            Let&rsquo;s go
          </h2>
          <p className="text-lg text-neutral-600 mb-12">
            Paste your brand brief below. The more detail you give, the sharper your content.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Brief */}
              <div>
                <label htmlFor="brief" className="block text-sm font-bold text-neutral-800 mb-2">
                  Brand Brief *
                </label>
                <textarea
                  id="brief"
                  rows={6}
                  placeholder="Tell us about your brand — who you are, what you sell, your tone, your audience, what makes you different..."
                  className="w-full rounded-xl border-2 border-neutral-200 px-5 py-4 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#e85410] transition-colors resize-y"
                  style={{ backgroundColor: "#fff" }}
                  {...register("brief")}
                />
                {errors.brief && (
                  <p className="mt-2 text-sm text-red-600">{errors.brief.message}</p>
                )}
              </div>

              {/* Brand Name */}
              <div>
                <label htmlFor="brandName" className="block text-sm font-bold text-neutral-800 mb-2">
                  Brand Name <span className="font-normal text-neutral-500">(optional)</span>
                </label>
                <input
                  id="brandName"
                  type="text"
                  placeholder="e.g. Hoya Beauty"
                  className="w-full rounded-xl border-2 border-neutral-200 px-5 py-4 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#e85410] transition-colors"
                  style={{ backgroundColor: "#fff" }}
                  {...register("brandName")}
                />
                {errors.brandName && (
                  <p className="mt-2 text-sm text-red-600">{errors.brandName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-neutral-800 mb-2">
                  Email <span className="font-normal text-neutral-500">(optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@brand.com"
                  className="w-full rounded-xl border-2 border-neutral-200 px-5 py-4 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#e85410] transition-colors"
                  style={{ backgroundColor: "#fff" }}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-8 text-lg font-bold text-white rounded-full transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#e85410" }}
              >
                {isSubmitting ? "Generating..." : "Generate my content"}
              </button>
            </form>
          ) : (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ backgroundColor: "#2d5a3e" }}
            >
              <div className="text-5xl mb-4">&#10003;</div>
              <h3
                className="text-2xl md:text-3xl font-bold mb-3"
                style={{ color: "#fdf7ed" }}
              >
                We&rsquo;re on it.
              </h3>
              <p className="text-lg" style={{ color: "rgba(253,247,237,0.85)" }}>
                Content for <strong style={{ color: "#fdf7ed" }}>{submittedBrand}</strong> is being
                generated. We&rsquo;ll have your month of content ready soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer
        className="py-12 px-6 md:px-16 lg:px-24 border-t"
        style={{ backgroundColor: "#1a1a1a", borderColor: "#333" }}
      >
        <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-wider" style={{ color: "#fdf7ed" }}>
            LOGO
          </span>
          <p className="text-sm" style={{ color: "rgba(253,247,237,0.5)" }}>
            &copy; {new Date().getFullYear()} LOGO. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
