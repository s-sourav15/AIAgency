"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  brief: z.string().min(50, "Please provide at least 50 characters about your brand."),
  brandName: z.union([z.string().min(2, "Brand name must be at least 2 characters."), z.literal("")]),
  email: z.union([z.email("Please enter a valid email address."), z.literal("")]),
});

type FormData = z.infer<typeof schema>;

function BlinkingCursor() {
  return (
    <span className="ml-1 inline-block h-5 w-1 animate-pulse bg-[#f0d96e]" />
  );
}

export default function TerminalPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedBrand, setSubmittedBrand] = useState("");
  const [charCount, setCharCount] = useState(0);

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

  const monoFont = "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

  return (
    <div
      className="flex min-h-dvh flex-col px-6 py-6 md:px-10"
      style={{ backgroundColor: "#0a0a0a", color: "#f5f0e4", fontFamily: monoFont }}
    >
      <header>
        <span className="text-sm text-[#f5f0e4]/50">~/LOGO$</span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-12">
        {submitted ? (
          <div className="space-y-4">
            <p className="text-lg text-[#f0d96e]">$ success</p>
            <p className="text-sm text-[#f5f0e4]/70">
              Generating content for <span className="text-[#f5f0e4]">{submittedBrand}</span>.
              <br />
              Output will be delivered to your email within 24 hours.
            </p>
            <p className="text-xs text-[#f5f0e4]/30">process exited with code 0</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <h1 className="text-xl md:text-2xl">
                <span className="text-[#f5f0e4]/50">&gt; </span>
                tell us about your brand
                <BlinkingCursor />
              </h1>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <textarea
                  {...register("brief", {
                    onChange: (e) => setCharCount(e.target.value.length),
                  })}
                  rows={10}
                  placeholder="paste brand brief, product copy, or sample posts..."
                  className="w-full resize-none border border-dashed border-[#f5f0e4]/20 bg-transparent p-4 text-sm text-[#f5f0e4] outline-none placeholder:text-[#f5f0e4]/25 focus:border-[#f0d96e]/50"
                  style={{ fontFamily: monoFont }}
                />
                <span className="absolute bottom-3 right-3 text-xs text-[#f5f0e4]/30">
                  {charCount} chars
                </span>
              </div>
              {errors.brief && (
                <p className="text-xs text-red-400">{errors.brief.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-[#f5f0e4]/40">--brand-name=&quot;&quot;</label>
                <input
                  {...register("brandName")}
                  placeholder="acme"
                  className="w-full border-0 border-b border-dashed border-[#f5f0e4]/20 bg-transparent px-0 py-2 text-sm text-[#f5f0e4] outline-none placeholder:text-[#f5f0e4]/20 focus:border-[#f0d96e]/50"
                  style={{ fontFamily: monoFont }}
                />
                {errors.brandName && (
                  <p className="text-xs text-red-400">{errors.brandName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#f5f0e4]/40">--email=&quot;&quot;</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@brand.co"
                  className="w-full border-0 border-b border-dashed border-[#f5f0e4]/20 bg-transparent px-0 py-2 text-sm text-[#f5f0e4] outline-none placeholder:text-[#f5f0e4]/20 focus:border-[#f0d96e]/50"
                  style={{ fontFamily: monoFont }}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#f0d96e] px-5 py-2.5 text-sm text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ fontFamily: monoFont }}
              >
                {isSubmitting ? "processing..." : "$ generate"}
              </button>
              <span className="text-xs text-[#f5f0e4]/30">
                <kbd className="rounded border border-[#f5f0e4]/20 px-1.5 py-0.5 text-[10px]">↵</kbd>{" "}
                return to submit
              </span>
            </div>
          </form>
        )}
      </main>

      <footer className="text-xs text-[#f5f0e4]/25">
        <a href="/privacy" className="underline-offset-2 hover:text-[#f0d96e] hover:underline">privacy</a>
        {" · "}
        <a href="/terms" className="underline-offset-2 hover:text-[#f0d96e] hover:underline">terms</a>
      </footer>
    </div>
  );
}
