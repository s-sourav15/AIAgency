"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

const schema = z.object({
  brief: z.string().min(50, "Please provide at least 50 characters about your brand."),
  brandName: z.union([z.string().min(2, "Brand name must be at least 2 characters."), z.literal("")]),
  email: z.union([z.email("Please enter a valid email address."), z.literal("")]),
});

type FormData = z.infer<typeof schema>;

export default function LetterpressPage() {
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
    <div
      className="flex min-h-dvh flex-col px-6 py-8 md:px-10"
      style={{ backgroundColor: "#f4ede0", color: "#1a1a1a" }}
    >
      <header className="flex items-start justify-between">
        <span
          className="text-2xl leading-none text-[#1a1a1a]/20"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          *
        </span>
        <span className="text-xs tracking-widest text-[#1a1a1a]/40 uppercase">LOGO</span>
      </header>

      <main className="flex flex-1 items-center py-12">
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-5">
          {/* Left column — form */}
          <div className="md:col-span-3">
            {submitted ? (
              <div className="space-y-4">
                <h2
                  className="text-4xl md:text-5xl"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  Received.
                </h2>
                <p
                  className="max-w-md text-lg text-[#1a1a1a]/70"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  We are generating content for{" "}
                  <span className="text-[#1a1a1a]">{submittedBrand}</span>.
                  You&apos;ll receive the full calendar via email within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-3">
                  <h1
                    className="text-5xl leading-[1.1] md:text-7xl"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    Tell us about<br />your brand.
                  </h1>
                  <p
                    className="max-w-md text-lg italic text-[#1a1a1a]/60"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    Paste in a brand. We will hand you back a month of content.
                  </p>
                </div>

                <div className="space-y-1">
                  <textarea
                    {...register("brief")}
                    rows={8}
                    placeholder="Your brand story, product description, or a few sample posts..."
                    className="w-full resize-none border-0 border-b border-[#1a1a1a]/20 bg-transparent px-0 py-3 text-base text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30 focus:border-[#1a1a1a]/50"
                    style={{ fontFamily: "var(--font-sans)" }}
                  />
                  {errors.brief && (
                    <p className="text-xs text-red-700">{errors.brief.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <input
                      {...register("brandName")}
                      placeholder="Brand name (optional)"
                      className="w-full border-0 border-b border-[#1a1a1a]/20 bg-transparent px-0 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30 focus:border-[#1a1a1a]/50"
                      style={{ fontFamily: "var(--font-sans)" }}
                    />
                    {errors.brandName && (
                      <p className="text-xs text-red-700">{errors.brandName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="Contact email (optional)"
                      className="w-full border-0 border-b border-[#1a1a1a]/20 bg-transparent px-0 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30 focus:border-[#1a1a1a]/50"
                      style={{ fontFamily: "var(--font-sans)" }}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-700">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-[#1a1a1a] px-6 py-3 text-sm text-[#f4ede0] transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Generate a month of content
                </button>
              </form>
            )}
          </div>

          {/* Right column — decorative */}
          <div className="hidden items-center justify-center md:col-span-2 md:flex">
            <span
              className="text-6xl text-[#1a1a1a]/10 lg:text-8xl"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              ready.
            </span>
          </div>
        </div>
      </main>

      <footer className="pt-8 text-xs text-[#1a1a1a]/35" style={{ fontFamily: "var(--font-serif)" }}>
        <a href="/privacy" className="underline-offset-2 hover:underline">Privacy</a>
        {" · "}
        <a href="/terms" className="underline-offset-2 hover:underline">Terms</a>
      </footer>
    </div>
  );
}
