"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  brief: z.string().min(50, "Please provide at least 50 characters about your brand."),
  brandName: z.union([z.string().min(2, "Brand name must be at least 2 characters."), z.literal("")]),
  email: z.union([z.email("Please enter a valid email address."), z.literal("")]),
});

type FormData = z.infer<typeof schema>;

export default function Home() {
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

    // TODO: replace with real POST to /api/intake once backend is live
    // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/intake`, { method: "POST", body: JSON.stringify(payload) })
    console.log("Intake payload:", payload);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmittedBrand(data.brandName || "your brand");
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 py-6" style={{ backgroundColor: "#faf9f5" }}>
      <header>
        <span className="font-mono text-sm text-[#1a1a1a]/40">LOGO</span>
      </header>

      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center py-12">
        {submitted ? (
          <div className="w-full rounded-xl border border-[#1a1a1a]/10 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-medium text-[#1a1a1a]">Got it.</h2>
            <p className="mt-3 text-[#1a1a1a]/70">
              We are generating content for <span className="font-medium text-[#1a1a1a]">{submittedBrand}</span>.
              You&apos;ll receive the full calendar via email within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-medium text-[#1a1a1a]">Tell us about your brand.</h1>
              <p className="text-sm text-[#1a1a1a]/60">
                Paste a brand brief, product description, or a few sample posts. We will generate a
                month&apos;s worth of on-brand content across platforms.
              </p>
            </div>

            <div className="space-y-1.5">
              <Textarea
                {...register("brief")}
                rows={12}
                placeholder="Your brand story, product description, or a few sample posts..."
                className="min-h-[288px] resize-none border-[#1a1a1a]/15 bg-white text-[#1a1a1a] shadow-none transition-shadow placeholder:text-[#1a1a1a]/35 focus-visible:border-[#c4572b]/50 focus-visible:shadow-[0_0_0_3px_rgba(196,87,43,0.08)] focus-visible:ring-0"
              />
              {errors.brief && (
                <p className="text-xs text-red-600">{errors.brief.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Input
                  {...register("brandName")}
                  placeholder="Brand name (optional)"
                  className="border-[#1a1a1a]/15 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/35 focus-visible:border-[#c4572b]/50 focus-visible:shadow-[0_0_0_3px_rgba(196,87,43,0.08)] focus-visible:ring-0"
                />
                {errors.brandName && (
                  <p className="text-xs text-red-600">{errors.brandName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Contact email (optional)"
                  className="border-[#1a1a1a]/15 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/35 focus-visible:border-[#c4572b]/50 focus-visible:shadow-[0_0_0_3px_rgba(196,87,43,0.08)] focus-visible:ring-0"
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 cursor-pointer gap-2 rounded-lg bg-[#c4572b] px-5 text-sm font-medium text-white hover:bg-[#a84824] disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Generate a month of content
              </Button>
              <p className="text-xs text-[#1a1a1a]/40">
                Free sample. No signup required. We will email the output within 24 hours.
              </p>
            </div>
          </form>
        )}
      </main>

      <footer className="pb-4 text-center text-xs text-[#1a1a1a]/35">
        Made in India &middot;{" "}
        <a href="/privacy" className="underline-offset-2 hover:text-[#c4572b] hover:underline">Privacy</a> &middot;{" "}
        <a href="/terms" className="underline-offset-2 hover:text-[#c4572b] hover:underline">Terms</a>
      </footer>
    </div>
  );
}
