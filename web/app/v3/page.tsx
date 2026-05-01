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

export default function NotepadPage() {
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
      style={{
        backgroundColor: "#faf8f1",
        backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(180,170,150,0.15) 31px, rgba(180,170,150,0.15) 32px)",
        color: "#1a1a1a",
      }}
    >
      <header>
        <span className="text-xs tracking-widest text-[#1a1a1a]/30 uppercase">LOGO</span>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12">
        {submitted ? (
          <div className="space-y-3">
            <h2
              className="text-3xl text-[#1a1a1a]"
              style={{ fontFamily: "var(--font-handwriting)" }}
            >
              got it!
            </h2>
            <p className="text-sm text-[#1a1a1a]/70">
              we are generating content for{" "}
              <span className="font-medium text-[#1a1a1a]">{submittedBrand}</span>.
              check your email within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            <div className="space-y-2">
              <h1
                className="text-3xl md:text-4xl text-[#1a1a1a]"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                hey - tell us about your brand.
              </h1>
              <p className="text-sm text-[#1a1a1a]/60">
                paste your brand story below. we will email you a month of content that{" "}
                <span
                  className="px-1"
                  style={{ backgroundColor: "#fff0a8" }}
                >
                  sounds like you
                </span>
                .
              </p>
            </div>

            <div className="space-y-1">
              <textarea
                {...register("brief")}
                rows={8}
                placeholder="your brand story, product description, or a few sample posts..."
                className="w-full resize-none border border-dashed border-[#1a1a1a]/15 bg-white/50 p-4 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30 focus:border-[#8b2c2c]/40"
                style={{ transform: "rotate(-0.2deg)" }}
              />
              {errors.brief && (
                <p className="text-xs text-red-700">{errors.brief.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <input
                  {...register("brandName")}
                  placeholder="brand name (optional)"
                  className="w-full border-0 border-b border-dashed border-[#1a1a1a]/15 bg-transparent px-0 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30 focus:border-[#8b2c2c]/40"
                />
                {errors.brandName && (
                  <p className="text-xs text-red-700">{errors.brandName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <input
                  {...register("email")}
                  type="email"
                  placeholder="email (optional)"
                  className="w-full border-0 border-b border-dashed border-[#1a1a1a]/15 bg-transparent px-0 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30 focus:border-[#8b2c2c]/40"
                />
                {errors.email && (
                  <p className="text-xs text-red-700">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex items-center gap-2 bg-[#8b2c2c] px-5 py-2.5 text-sm text-[#faf8f1] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                send it{" "}
                <span className="inline-block transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </div>
          </form>
        )}
      </main>

      <footer className="text-xs text-[#1a1a1a]/30">
        only good things → {" "}
        <a href="/privacy" className="underline-offset-2 hover:underline">privacy</a>
        {" · "}
        <a href="/terms" className="underline-offset-2 hover:underline">terms</a>
      </footer>
    </div>
  );
}
