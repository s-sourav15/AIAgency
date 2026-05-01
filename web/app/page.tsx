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

export default function StickerPackPage() {
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
    <div className="min-h-screen bg-[#fefbf3] overflow-x-hidden">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden min-h-[90vh] flex flex-col items-center justify-center px-6 py-24">
        {/* Floating shapes */}
        <div className="absolute top-12 left-8 w-20 h-20 rounded-full bg-[#8b5cf6] opacity-60" />
        <div className="absolute top-32 right-12 w-14 h-14 rounded-lg bg-[#ff6b6b] opacity-50 rotate-12" />
        <div className="absolute bottom-24 left-16 w-28 h-10 rounded-full bg-[#fde047] opacity-70 -rotate-6" />
        <div className="absolute bottom-40 right-20 w-16 h-16 rounded-full bg-[#34d399] opacity-50" />
        <div className="absolute top-1/2 left-4 w-10 h-10 rounded-md bg-[#ff6b6b] opacity-40 rotate-45" />
        <div className="absolute top-20 left-1/2 w-6 h-24 rounded-full bg-[#34d399] opacity-30 rotate-12" />

        <div className="relative z-10 max-w-3xl text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight" style={{ fontFamily: "var(--font-sans)" }}>
            Content that doesn&apos;t sound like ChatGPT.
          </h1>
          <p className="mt-4 text-2xl md:text-3xl font-extrabold text-gray-700" style={{ fontFamily: "var(--font-sans)" }}>
            Built for brands who care.
          </p>

          {/* Caveat annotation */}
          <span
            className="absolute -right-4 md:right-8 top-2 text-2xl text-[#8b5cf6] -rotate-6"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            &larr; yes, really
          </span>
          <span
            className="block mt-8 text-xl text-[#ff6b6b] rotate-2"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            no cap &darr;
          </span>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative overflow-hidden py-28 px-6">
        {/* Floating shapes */}
        <div className="absolute top-8 right-10 w-12 h-12 rounded-full bg-[#fde047] opacity-60" />
        <div className="absolute bottom-12 left-8 w-16 h-16 rounded-lg bg-[#8b5cf6] opacity-40 rotate-12" />
        <div className="absolute top-1/3 left-1/2 w-8 h-24 rounded-full bg-[#34d399] opacity-30 -rotate-12" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-16" style={{ fontFamily: "var(--font-sans)" }}>
            How it works
          </h2>

          <div className="flex flex-col md:flex-row gap-8 md:gap-6 items-center md:items-start justify-center">
            {/* Step 1 */}
            <div className="relative bg-[#fef3c7] p-8 rounded-xl shadow-md rotate-1 max-w-xs w-full">
              <span className="text-sm font-bold text-[#8b5cf6] uppercase tracking-wide">Step 1</span>
              <p className="mt-2 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-sans)" }}>
                Paste your brand brief
              </p>
              <span
                className="absolute -top-4 -right-6 text-lg text-[#ff6b6b] -rotate-12"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                &larr; 2 min
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative bg-[#dbeafe] p-8 rounded-xl shadow-md -rotate-2 max-w-xs w-full">
              <span className="text-sm font-bold text-[#ff6b6b] uppercase tracking-wide">Step 2</span>
              <p className="mt-2 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-sans)" }}>
                We generate a month&apos;s content
              </p>
              <span
                className="absolute -bottom-5 -left-4 text-lg text-[#8b5cf6] rotate-6"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                magic happens here ✨
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative bg-[#d1fae5] p-8 rounded-xl shadow-md rotate-1 max-w-xs w-full">
              <span className="text-sm font-bold text-[#34d399] uppercase tracking-wide">Step 3</span>
              <p className="mt-2 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-sans)" }}>
                Anti-slop AI scores every piece
              </p>
              <span
                className="absolute -top-4 right-2 text-lg text-[#fde047] -rotate-3"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                no fluff &darr;
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SAMPLE OUTPUT SHOWCASE ===== */}
      <section className="relative overflow-hidden py-28 px-6 bg-[#fefbf3]">
        {/* Floating shapes */}
        <div className="absolute top-16 left-6 w-24 h-8 rounded-full bg-[#ff6b6b] opacity-40 rotate-6" />
        <div className="absolute bottom-20 right-10 w-14 h-14 rounded-full bg-[#fde047] opacity-50" />
        <div className="absolute top-1/2 right-4 w-10 h-10 rounded-md bg-[#8b5cf6] opacity-30 rotate-45" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-6" style={{ fontFamily: "var(--font-sans)" }}>
            Real output. Real brands.
          </h2>
          <p
            className="text-center text-xl text-[#8b5cf6] mb-16 -rotate-1"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            these are actual generations &darr;
          </p>

          <div className="flex flex-col md:flex-row gap-10 md:gap-8 items-center justify-center">
            {/* Phone mockup 1 */}
            <div className="relative bg-white rounded-3xl shadow-xl p-5 pt-8 max-w-[280px] w-full border-2 border-gray-100 rotate-[-2deg]">
              {/* Tape decoration */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#fde047] opacity-80 rounded-sm rotate-1" />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Hoya Beauty</p>
                  <p className="text-[10px] text-gray-500">@hoyabeauty</p>
                </div>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                Monsoon ruined your makeup? Good. That means you&apos;re actually going outside. Our 3-in-1 stick stays put when your plans don&apos;t.
              </p>
              {/* Score sticker */}
              <div className="absolute -bottom-3 -right-3 bg-[#34d399] text-white text-xs font-bold px-3 py-1 rounded-full rotate-6 shadow-md">
                0.89
              </div>
            </div>

            {/* Phone mockup 2 */}
            <div className="relative bg-white rounded-3xl shadow-xl p-5 pt-8 max-w-[280px] w-full border-2 border-gray-100 rotate-[1deg]">
              {/* Tape decoration */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#ff6b6b] opacity-70 rounded-sm -rotate-2" />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-red-500" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Kalki Apparel</p>
                  <p className="text-[10px] text-gray-500">@kalkiapparel</p>
                </div>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                This blouse has been in 40 weddings. It has seen more mehendi than most guests. Still fits like day one.
              </p>
              {/* Score sticker */}
              <div className="absolute -bottom-3 -left-3 bg-[#8b5cf6] text-white text-xs font-bold px-3 py-1 rounded-full -rotate-6 shadow-md">
                0.92
              </div>
            </div>

            {/* Phone mockup 3 */}
            <div className="relative bg-white rounded-3xl shadow-xl p-5 pt-8 max-w-[280px] w-full border-2 border-gray-100 rotate-[-1deg]">
              {/* Tape decoration */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#8b5cf6] opacity-70 rounded-sm rotate-1" />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Jhola Foods</p>
                  <p className="text-[10px] text-gray-500">@jholafoods</p>
                </div>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                We don&apos;t do &ldquo;healthy.&rdquo; We do delicious that happens to not ruin your afternoon.
              </p>
              {/* Score sticker */}
              <div className="absolute -bottom-3 -right-3 bg-[#ff6b6b] text-white text-xs font-bold px-3 py-1 rounded-full rotate-3 shadow-md">
                0.87
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="relative overflow-hidden py-28 px-6">
        {/* Floating shapes */}
        <div className="absolute top-10 left-12 w-10 h-10 rounded-full bg-[#34d399] opacity-50" />
        <div className="absolute bottom-16 right-16 w-20 h-6 rounded-full bg-[#ff6b6b] opacity-40 rotate-12" />
        <div className="absolute top-1/2 left-1/3 w-8 h-8 rounded-md bg-[#fde047] opacity-50 -rotate-12" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-16" style={{ fontFamily: "var(--font-sans)" }}>
            Why us?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Card 1 */}
            <div className="bg-white border-3 border-[#8b5cf6] rounded-xl p-6 shadow-md rotate-1 hover:rotate-0 transition-transform">
              <p className="text-lg font-extrabold text-gray-900" style={{ fontFamily: "var(--font-sans)" }}>
                Anti-slop scoring
              </p>
              <p className="mt-1 text-sm text-gray-600">Every piece rated. Zero generic filler.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border-3 border-[#ff6b6b] rounded-xl p-6 shadow-md -rotate-2 hover:rotate-0 transition-transform sm:mt-8">
              <p className="text-lg font-extrabold text-gray-900" style={{ fontFamily: "var(--font-sans)" }}>
                Indian D2C voice
              </p>
              <p className="mt-1 text-sm text-gray-600">Trained on brands your audience already loves.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border-3 border-[#fde047] rounded-xl p-6 shadow-md rotate-2 hover:rotate-0 transition-transform">
              <p className="text-lg font-extrabold text-gray-900" style={{ fontFamily: "var(--font-sans)" }}>
                One brief &rarr; 30 days
              </p>
              <p className="mt-1 text-sm text-gray-600">Paste once. Get a full month of content.</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white border-3 border-[#34d399] rounded-xl p-6 shadow-md -rotate-1 hover:rotate-0 transition-transform sm:mt-8">
              <p className="text-lg font-extrabold text-gray-900" style={{ fontFamily: "var(--font-sans)" }}>
                Not a ChatGPT wrapper
              </p>
              <p className="mt-1 text-sm text-gray-600">Custom models. Custom scoring. Custom voice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INPUT FORM ===== */}
      <section className="relative overflow-hidden py-28 px-6 bg-[#fefbf3]">
        {/* Floating shapes */}
        <div className="absolute top-8 right-8 w-14 h-14 rounded-full bg-[#8b5cf6] opacity-40" />
        <div className="absolute bottom-12 left-10 w-10 h-10 rounded-lg bg-[#fde047] opacity-60 rotate-12" />
        <div className="absolute top-1/3 left-4 w-6 h-20 rounded-full bg-[#ff6b6b] opacity-30 -rotate-6" />

        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-4" style={{ fontFamily: "var(--font-sans)" }}>
            Try it now
          </h2>
          <p
            className="text-center text-xl text-[#34d399] mb-12 rotate-1"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            paste your brief &amp; see the magic
          </p>

          {submitted ? (
            <div className="bg-white rounded-2xl shadow-xl p-10 text-center border-2 border-[#34d399]">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: "var(--font-sans)" }}>
                We&apos;re on it!
              </h3>
              <p className="text-gray-600">
                Generating content for <span className="font-bold text-[#8b5cf6]">{submittedBrand}</span>. Check your inbox soon.
              </p>
              <span
                className="inline-block mt-4 text-xl text-[#ff6b6b] rotate-2"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                this is gonna be good &rarr;
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="relative bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
              {/* Caveat annotation */}
              <span
                className="absolute -top-6 -right-2 md:-right-16 text-xl text-[#8b5cf6] -rotate-6"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                &larr; try this!
              </span>

              <div className="space-y-6">
                {/* Brief textarea */}
                <div>
                  <label htmlFor="brief" className="block text-sm font-bold text-gray-700 mb-2">
                    Brand Brief *
                  </label>
                  <textarea
                    id="brief"
                    rows={5}
                    placeholder="Tell us about your brand, audience, voice, and what makes you different..."
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 resize-none transition-colors"
                    {...register("brief")}
                  />
                  {errors.brief && (
                    <p className="mt-1 text-sm text-[#ff6b6b]">{errors.brief.message}</p>
                  )}
                </div>

                {/* Brand name */}
                <div>
                  <label htmlFor="brandName" className="block text-sm font-bold text-gray-700 mb-2">
                    Brand Name
                  </label>
                  <input
                    id="brandName"
                    type="text"
                    placeholder="e.g. Hoya Beauty"
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 transition-colors"
                    {...register("brandName")}
                  />
                  {errors.brandName && (
                    <p className="mt-1 text-sm text-[#ff6b6b]">{errors.brandName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="hello@yourbrand.com"
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 transition-colors"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-[#ff6b6b]">{errors.email.message}</p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#8b5cf6] text-white font-extrabold text-lg py-4 px-8 rounded-xl rotate-[-1deg] shadow-[4px_4px_0px_0px_#ff6b6b] hover:shadow-[6px_6px_0px_0px_#ff6b6b] hover:translate-y-[-2px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Generating..." : "Generate my content"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative overflow-hidden py-16 px-6 border-t border-gray-200">
        <div className="absolute top-4 right-8 w-8 h-8 rounded-full bg-[#fde047] opacity-40" />
        <div className="absolute bottom-4 left-12 w-6 h-6 rounded-md bg-[#34d399] opacity-30 rotate-12" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-2xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: "var(--font-handwriting)" }}>
            LOGO
          </p>
          <span
            className="inline-block text-lg text-[#8b5cf6] -rotate-2 mb-4"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            content that slaps
          </span>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} LOGO. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
