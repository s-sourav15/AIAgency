"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INDUSTRIES = [
  "Apparel",
  "Beauty",
  "F&B",
  "Home",
  "Wellness",
  "Tech",
  "Services",
  "Other",
] as const;

const TONE_OPTIONS = [
  "playful",
  "warm",
  "witty",
  "confident",
  "serious",
  "casual",
  "professional",
  "anti-corporate",
  "luxurious",
  "minimal",
  "Gen-Z",
  "sarcastic",
  "educational",
  "bold",
  "energetic",
  "calm",
  "direct",
];

const PLATFORM_OPTIONS = ["Instagram", "Twitter/X", "LinkedIn", "Ads", "Email"];

/* ===== SCHEMAS ===== */

const fastSchema = z.object({
  brand_blob: z
    .string()
    .min(50, "Tell us at least a few sentences about your brand.")
    .max(4000),
  brand_name: z.string().min(2, "Brand name needed.").max(80),
  email: z.email("Valid email needed."),
});

const step1Schema = z.object({
  brand_name: z.string().min(2, "At least 2 characters").max(80),
  email: z.email("Please enter a valid email"),
  industry: z.enum(INDUSTRIES, { message: "Pick an industry" }),
  num_days: z.number().int().min(1, "At least 1 day").max(30, "Max 30 days"),
});

const step2Schema = z.object({
  brand_description: z
    .string()
    .min(50, "At least 50 characters — tell us more!")
    .max(2000),
  tone: z.array(z.string()).min(1, "Pick at least one tone"),
});

const step3Schema = z.object({
  sample_content: z
    .string()
    .min(50, "Paste at least 50 characters of real content"),
  content_brief: z.string().optional(),
  platforms: z.array(z.string()).min(1, "Pick at least one platform"),
  brand_illustrations: z.array(z.any()).max(5).optional(),
});

type FastForm = z.infer<typeof fastSchema>;
type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;
type FullForm = Step1 & Step2 & Step3;

export default function StickerPackPage() {
  const [mode, setMode] = useState<"fast" | "full">("fast");
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submittedBrand, setSubmittedBrand] = useState("");
  const [customDays, setCustomDays] = useState(false);
  const [customToneInput, setCustomToneInput] = useState("");
  const [showCustomTone, setShowCustomTone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ===== FAST PATH FORM ===== */
  const {
    register: fastRegister,
    handleSubmit: fastHandleSubmit,
    formState: { errors: fastErrors, isSubmitting: fastIsSubmitting },
  } = useForm<FastForm>({
    resolver: zodResolver(fastSchema),
    defaultValues: { brand_blob: "", brand_name: "", email: "" },
  });

  /* ===== FULL PATH FORM ===== */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger,
  } = useForm<FullForm>({
    defaultValues: {
      brand_name: "",
      email: "",
      industry: undefined as unknown as (typeof INDUSTRIES)[number],
      num_days: 14,
      brand_description: "",
      tone: ["conversational", "confident"],
      sample_content: "",
      content_brief: "",
      platforms: ["Instagram", "Twitter/X", "LinkedIn"],
      brand_illustrations: [],
    },
  });

  const numDays = watch("num_days");
  const tone = watch("tone") || [];
  const platforms = watch("platforms") || [];
  const industry = watch("industry");

  const validateStep = async (s: number): Promise<boolean> => {
    if (s === 1) {
      const result = step1Schema.safeParse({
        brand_name: watch("brand_name"),
        email: watch("email"),
        industry: watch("industry"),
        num_days: watch("num_days"),
      });
      if (!result.success) {
        await trigger(["brand_name", "email", "industry", "num_days"]);
        return false;
      }
      return true;
    }
    if (s === 2) {
      const result = step2Schema.safeParse({
        brand_description: watch("brand_description"),
        tone: watch("tone"),
      });
      if (!result.success) {
        await trigger(["brand_description", "tone"]);
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = async () => {
    const valid = await validateStep(step);
    if (valid) setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const toggleTone = (t: string) => {
    const current = watch("tone") || [];
    if (current.includes(t)) {
      setValue(
        "tone",
        current.filter((x) => x !== t)
      );
    } else {
      setValue("tone", [...current, t]);
    }
  };

  const addCustomTone = () => {
    const trimmed = customToneInput.trim().toLowerCase();
    if (trimmed && !tone.includes(trimmed)) {
      setValue("tone", [...tone, trimmed]);
    }
    setCustomToneInput("");
    setShowCustomTone(false);
  };

  const togglePlatform = (p: string) => {
    const current = watch("platforms") || [];
    if (current.includes(p)) {
      setValue(
        "platforms",
        current.filter((x) => x !== p)
      );
    } else {
      setValue("platforms", [...current, p]);
    }
  };

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const accepted = Array.from(newFiles).filter(
        (f) =>
          f.type === "image/png" ||
          f.type === "image/jpeg" ||
          f.type === "image/webp"
      );
      const combined = [...files, ...accepted].slice(0, 5);
      setFiles(combined);
      setValue("brand_illustrations", combined);
    },
    [files, setValue]
  );

  const removeFile = (idx: number) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    setValue("brand_illustrations", updated);
  };

  /* ===== FAST SUBMIT ===== */
  async function onFastSubmit(data: FastForm) {
    const payload = {
      mode: "fast" as const,
      brand_name: data.brand_name,
      email: data.email,
      brand_blob: data.brand_blob,
      use_defaults: true,
      default_num_days: 30,
      default_platforms: ["instagram", "twitter", "linkedin"],
    };
    console.log("Fast path payload:", payload);
    // TODO: replace with real POST to /api/intake (fast mode) once backend is live
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmittedBrand(data.brand_name || "your brand");
    setSubmitted(true);
  }

  /* ===== FULL SUBMIT ===== */
  async function onSubmit(data: FullForm) {
    const valid = await validateStep(3);
    if (!valid) return;

    const result = step3Schema.safeParse({
      sample_content: data.sample_content,
      content_brief: data.content_brief,
      platforms: data.platforms,
      brand_illustrations: files,
    });
    if (!result.success) {
      await trigger(["sample_content", "platforms"]);
      return;
    }

    const payload = {
      mode: "full" as const,
      brand_name: data.brand_name,
      email: data.email,
      industry: data.industry,
      num_days: data.num_days,
      brand_description: data.brand_description,
      tone: data.tone,
      sample_content: data.sample_content,
      content_brief: data.content_brief || undefined,
      platforms: data.platforms,
      brand_illustrations: files,
    };
    console.log("Intake payload:", payload);
    // TODO: POST to /api/intake
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmittedBrand(data.brand_name || "your brand");
    setSubmitted(true);
  }

  const toneColors = [
    "bg-[#8b5cf6]/10 border-[#8b5cf6] text-[#8b5cf6]",
    "bg-[#ff6b6b]/10 border-[#ff6b6b] text-[#ff6b6b]",
    "bg-[#34d399]/10 border-[#34d399] text-[#34d399]",
    "bg-[#fde047]/20 border-[#d4a000] text-[#a07800]",
    "bg-[#ec4899]/10 border-[#ec4899] text-[#ec4899]",
    "bg-[#06b6d4]/10 border-[#06b6d4] text-[#06b6d4]",
  ];

  const getToneColor = (idx: number) => toneColors[idx % toneColors.length];
  const toneRotations = [
    "rotate-1",
    "-rotate-1",
    "rotate-2",
    "-rotate-2",
    "rotate-0",
  ];
  const getToneRotation = (idx: number) =>
    toneRotations[idx % toneRotations.length];

  return (
    <div className="min-h-screen bg-[#fefbf3] overflow-x-hidden">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden min-h-[90vh] flex flex-col items-center justify-center px-6 py-24">
        <div className="absolute top-12 left-8 w-20 h-20 rounded-full bg-[#8b5cf6] opacity-60" />
        <div className="absolute top-32 right-12 w-14 h-14 rounded-lg bg-[#ff6b6b] opacity-50 rotate-12" />
        <div className="absolute bottom-24 left-16 w-28 h-10 rounded-full bg-[#fde047] opacity-70 -rotate-6" />
        <div className="absolute bottom-40 right-20 w-16 h-16 rounded-full bg-[#34d399] opacity-50" />
        <div className="absolute top-1/2 left-4 w-10 h-10 rounded-md bg-[#ff6b6b] opacity-40 rotate-45" />
        <div className="absolute top-20 left-1/2 w-6 h-24 rounded-full bg-[#34d399] opacity-30 rotate-12" />

        <div className="relative z-10 max-w-3xl text-center">
          <h1
            className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Content that doesn&apos;t sound like ChatGPT.
          </h1>
          <p
            className="mt-4 text-2xl md:text-3xl font-extrabold text-gray-700"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Built for brands who care.
          </p>

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
        <div className="absolute top-8 right-10 w-12 h-12 rounded-full bg-[#fde047] opacity-60" />
        <div className="absolute bottom-12 left-8 w-16 h-16 rounded-lg bg-[#8b5cf6] opacity-40 rotate-12" />
        <div className="absolute top-1/3 left-1/2 w-8 h-24 rounded-full bg-[#34d399] opacity-30 -rotate-12" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-16"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            How it works
          </h2>

          <div className="flex flex-col md:flex-row gap-8 md:gap-6 items-center md:items-start justify-center">
            <div className="relative bg-[#fef3c7] p-8 rounded-xl shadow-md rotate-1 max-w-xs w-full">
              <span className="text-sm font-bold text-[#8b5cf6] uppercase tracking-wide">
                Step 1
              </span>
              <p
                className="mt-2 text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Tell us about your brand
              </p>
              <span
                className="absolute -top-4 -right-6 text-lg text-[#ff6b6b] -rotate-12"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                &larr; 30 sec
              </span>
            </div>

            <div className="relative bg-[#dbeafe] p-8 rounded-xl shadow-md -rotate-2 max-w-xs w-full">
              <span className="text-sm font-bold text-[#ff6b6b] uppercase tracking-wide">
                Step 2
              </span>
              <p
                className="mt-2 text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Show us your voice &amp; tone
              </p>
              <span
                className="absolute -bottom-5 -left-4 text-lg text-[#8b5cf6] rotate-6"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                magic happens here
              </span>
            </div>

            <div className="relative bg-[#d1fae5] p-8 rounded-xl shadow-md rotate-1 max-w-xs w-full">
              <span className="text-sm font-bold text-[#34d399] uppercase tracking-wide">
                Step 3
              </span>
              <p
                className="mt-2 text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                We generate a month of content
              </p>
              <span
                className="absolute -top-4 right-2 text-lg text-[#fde047] -rotate-3"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                no fluff &darr;
              </span>
            </div>
          </div>

          <p
            className="text-center mt-12 text-xl text-[#8b5cf6] rotate-1"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            scroll down to start &darr;
          </p>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="relative overflow-hidden py-28 px-6">
        <div className="absolute top-10 left-12 w-10 h-10 rounded-full bg-[#34d399] opacity-50" />
        <div className="absolute bottom-16 right-16 w-20 h-6 rounded-full bg-[#ff6b6b] opacity-40 rotate-12" />
        <div className="absolute top-1/2 left-1/3 w-8 h-8 rounded-md bg-[#fde047] opacity-50 -rotate-12" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-16"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Why us?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white border-3 border-[#8b5cf6] rounded-xl p-6 shadow-md rotate-1 hover:rotate-0 transition-transform">
              <p
                className="text-lg font-extrabold text-gray-900"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Anti-slop scoring
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Every piece rated. Zero generic filler.
              </p>
            </div>

            <div className="bg-white border-3 border-[#ff6b6b] rounded-xl p-6 shadow-md -rotate-2 hover:rotate-0 transition-transform sm:mt-8">
              <p
                className="text-lg font-extrabold text-gray-900"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Indian D2C voice
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Trained on brands your audience already loves.
              </p>
            </div>

            <div className="bg-white border-3 border-[#fde047] rounded-xl p-6 shadow-md rotate-2 hover:rotate-0 transition-transform">
              <p
                className="text-lg font-extrabold text-gray-900"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                One brief &rarr; 30 days
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Paste once. Get a full month of content.
              </p>
            </div>

            <div className="bg-white border-3 border-[#34d399] rounded-xl p-6 shadow-md -rotate-1 hover:rotate-0 transition-transform sm:mt-8">
              <p
                className="text-lg font-extrabold text-gray-900"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Not a ChatGPT wrapper
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Custom models. Custom scoring. Custom voice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INTAKE FORM SECTION ===== */}
      <section className="relative overflow-hidden py-28 px-6 bg-[#fefbf3]">
        {/* Floating shapes for fast path */}
        {mode === "fast" && !submitted && (
          <>
            <div className="absolute top-10 right-10 w-12 h-12 rounded-full bg-[#34d399] opacity-50" />
            <div className="absolute bottom-16 left-8 w-10 h-10 rounded-lg bg-[#fde047] opacity-60 rotate-12" />
            <div className="absolute top-1/4 left-6 w-8 h-16 rounded-full bg-[#8b5cf6] opacity-30 -rotate-6" />
          </>
        )}

        {/* Floating shapes for full wizard steps */}
        {mode === "full" && !submitted && (
          <>
            {step === 1 && (
              <>
                <div className="absolute top-8 right-8 w-14 h-14 rounded-full bg-[#8b5cf6] opacity-40" />
                <div className="absolute bottom-12 left-10 w-10 h-10 rounded-lg bg-[#fde047] opacity-60 rotate-12" />
                <div className="absolute top-1/3 left-4 w-6 h-20 rounded-full bg-[#ff6b6b] opacity-30 -rotate-6" />
              </>
            )}
            {step === 2 && (
              <>
                <div className="absolute top-12 left-8 w-16 h-16 rounded-full bg-[#ff6b6b] opacity-40" />
                <div className="absolute bottom-16 right-10 w-12 h-12 rounded-lg bg-[#34d399] opacity-50 -rotate-12" />
                <div className="absolute top-1/4 right-6 w-8 h-20 rounded-full bg-[#fde047] opacity-40 rotate-6" />
              </>
            )}
            {step === 3 && (
              <>
                <div className="absolute top-10 right-12 w-18 h-8 rounded-full bg-[#34d399] opacity-50 rotate-6" />
                <div className="absolute bottom-10 left-8 w-14 h-14 rounded-full bg-[#8b5cf6] opacity-40" />
                <div className="absolute top-1/3 left-6 w-10 h-10 rounded-md bg-[#ff6b6b] opacity-30 rotate-45" />
              </>
            )}
          </>
        )}

        <div className="relative z-10 max-w-xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-4"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Try it now
          </h2>

          {submitted ? (
            <div className="bg-white rounded-2xl shadow-xl p-10 text-center border-2 border-[#34d399]">
              <div className="text-4xl mb-4">🎉</div>
              <h3
                className="text-2xl font-extrabold text-gray-900 mb-2"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                We&apos;re on it!
              </h3>
              <p className="text-gray-600">
                Generating content for{" "}
                <span className="font-bold text-[#8b5cf6]">
                  {submittedBrand}
                </span>
                . We email your results and that is it.
              </p>
              <span
                className="inline-block mt-4 text-xl text-[#ff6b6b] rotate-2"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                this is gonna be good &rarr;
              </span>
            </div>
          ) : (
            <>
              {/* ===== FAST PATH ===== */}
              {mode === "fast" && (
                <div className="relative">
                  <span
                    className="absolute -top-8 -left-2 md:-left-20 text-xl text-[#ff6b6b] -rotate-6"
                    style={{ fontFamily: "var(--font-handwriting)" }}
                  >
                    &larr; fastest way in
                  </span>

                  <form
                    onSubmit={fastHandleSubmit(onFastSubmit)}
                    className="relative bg-[#fffdf7] rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100"
                    style={{ transform: "rotate(-0.3deg)" }}
                  >
                    <h3
                      className="text-3xl text-gray-900 mb-1"
                      style={{ fontFamily: "var(--font-handwriting)" }}
                    >
                      Fast lane
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Paste your brand in. We will figure out the rest.
                    </p>

                    {/* Brand blob textarea */}
                    <div className="mb-5">
                      <label
                        htmlFor="brand_blob"
                        className="block text-sm font-bold text-gray-700 mb-2"
                      >
                        About your brand *
                      </label>
                      <textarea
                        id="brand_blob"
                        rows={8}
                        placeholder="What you make, who it&#39;s for, how you sound. Paste a brand description, product page copy, or a few of your favorite posts — whatever captures the vibe."
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 resize-none transition-colors"
                        {...fastRegister("brand_blob")}
                      />
                      {fastErrors.brand_blob && (
                        <p className="mt-1 text-sm text-[#ff6b6b]">
                          {fastErrors.brand_blob.message}
                        </p>
                      )}
                    </div>

                    {/* Brand name + Email inline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label
                          htmlFor="fast_brand_name"
                          className="block text-sm font-bold text-gray-700 mb-1"
                        >
                          Brand name *
                        </label>
                        <input
                          id="fast_brand_name"
                          type="text"
                          placeholder="e.g. Hoya Beauty"
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 transition-colors"
                          {...fastRegister("brand_name")}
                        />
                        {fastErrors.brand_name && (
                          <p className="mt-1 text-sm text-[#ff6b6b]">
                            {fastErrors.brand_name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="fast_email"
                          className="block text-sm font-bold text-gray-700 mb-1"
                        >
                          Email *
                        </label>
                        <input
                          id="fast_email"
                          type="email"
                          placeholder="hello@brand.com"
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 transition-colors"
                          {...fastRegister("email")}
                        />
                        {fastErrors.email && (
                          <p className="mt-1 text-sm text-[#ff6b6b]">
                            {fastErrors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={fastIsSubmitting}
                      className="w-full bg-[#8b5cf6] text-white font-extrabold text-lg py-4 px-8 rounded-xl shadow-[4px_4px_0px_0px_#ff6b6b] hover:shadow-[6px_6px_0px_0px_#ff6b6b] hover:translate-y-[-2px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {fastIsSubmitting
                        ? "Generating..."
                        : "Get a month of content →"}
                    </button>
                  </form>

                  {/* Expand to full wizard link */}
                  <p className="text-center mt-5">
                    <button
                      type="button"
                      onClick={() => setMode("full")}
                      className="text-gray-500 hover:text-[#8b5cf6] transition-colors"
                      style={{ fontFamily: "var(--font-handwriting)" }}
                    >
                      Want to walk us through in detail? &rarr;
                    </button>
                  </p>
                </div>
              )}

              {/* ===== FULL PATH (3-step wizard) ===== */}
              {mode === "full" && (
                <>
                  {/* Back to fast lane */}
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => setMode("fast")}
                      className="text-sm text-gray-500 hover:text-[#8b5cf6] transition-colors"
                      style={{ fontFamily: "var(--font-handwriting)" }}
                    >
                      &larr; back to fast lane
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-lg text-[#8b5cf6] -rotate-1"
                        style={{ fontFamily: "var(--font-handwriting)" }}
                      >
                        Step {step} of 3
                      </span>
                      <span
                        className="text-sm text-gray-500"
                        style={{ fontFamily: "var(--font-handwriting)" }}
                      >
                        {step === 1
                          ? "~30 sec"
                          : step === 2
                            ? "~3 min"
                            : "~5 min"}
                      </span>
                    </div>
                    <div className="relative h-4 bg-white rounded-full border-2 border-gray-200 overflow-hidden shadow-inner">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#8b5cf6] via-[#ff6b6b] to-[#34d399] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-full opacity-30"
                        style={{
                          width: `${(step / 3) * 100}%`,
                          background:
                            "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.4) 4px, rgba(255,255,255,0.4) 8px)",
                        }}
                      />
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="relative bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100"
                  >
                    {/* ===== STEP 1: BASICS ===== */}
                    {step === 1 && (
                      <div className="space-y-6">
                        <span
                          className="absolute -top-6 -right-2 md:-right-16 text-xl text-[#8b5cf6] -rotate-6"
                          style={{ fontFamily: "var(--font-handwriting)" }}
                        >
                          &larr; quick stuff first!
                        </span>

                        {/* Brand name */}
                        <div>
                          <label
                            htmlFor="brand_name"
                            className="block text-sm font-bold text-gray-700 mb-2"
                          >
                            Brand Name *
                          </label>
                          <input
                            id="brand_name"
                            type="text"
                            placeholder="e.g. Hoya Beauty"
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 transition-colors"
                            {...register("brand_name")}
                          />
                          {errors.brand_name && (
                            <p className="mt-1 text-sm text-[#ff6b6b]">
                              {errors.brand_name.message}
                            </p>
                          )}
                        </div>

                        {/* Email */}
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-bold text-gray-700 mb-2"
                          >
                            Email *
                          </label>
                          <input
                            id="email"
                            type="email"
                            placeholder="hello@yourbrand.com"
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 transition-colors"
                            {...register("email")}
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-[#ff6b6b]">
                              {errors.email.message}
                            </p>
                          )}
                        </div>

                        {/* Industry */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Industry *
                          </label>
                          <Select
                            value={industry}
                            onValueChange={(val) =>
                              setValue(
                                "industry",
                                val as (typeof INDUSTRIES)[number],
                                { shouldValidate: true }
                              )
                            }
                          >
                            <SelectTrigger className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 h-auto text-base text-gray-900 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20">
                              <SelectValue placeholder="Pick your industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((ind) => (
                                <SelectItem key={ind} value={ind}>
                                  {ind}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.industry && (
                            <p className="mt-1 text-sm text-[#ff6b6b]">
                              {errors.industry.message}
                            </p>
                          )}
                        </div>

                        {/* Number of days */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            How many days of content? *
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {[7, 14, 30].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  setValue("num_days", d, {
                                    shouldValidate: true,
                                  });
                                  setCustomDays(false);
                                }}
                                className={`px-5 py-2 rounded-full font-bold text-sm border-2 transition-all ${
                                  numDays === d && !customDays
                                    ? "bg-[#8b5cf6] text-white border-[#8b5cf6] shadow-md"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-[#8b5cf6]/50"
                                }`}
                              >
                                {d} days
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setCustomDays(true)}
                              className={`px-5 py-2 rounded-full font-bold text-sm border-2 transition-all ${
                                customDays
                                  ? "bg-[#8b5cf6] text-white border-[#8b5cf6] shadow-md"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-[#8b5cf6]/50"
                              }`}
                            >
                              Custom
                            </button>
                          </div>
                          {customDays && (
                            <input
                              type="number"
                              min={1}
                              max={30}
                              placeholder="1-30"
                              className="mt-3 w-24 rounded-xl border-2 border-gray-200 px-4 py-2 text-gray-900 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 transition-colors"
                              value={numDays}
                              onChange={(e) =>
                                setValue(
                                  "num_days",
                                  Math.min(
                                    30,
                                    Math.max(1, parseInt(e.target.value) || 1)
                                  ),
                                  { shouldValidate: true }
                                )
                              }
                            />
                          )}
                          {errors.num_days && (
                            <p className="mt-1 text-sm text-[#ff6b6b]">
                              {errors.num_days.message}
                            </p>
                          )}
                        </div>

                        {/* Next button */}
                        <button
                          type="button"
                          onClick={nextStep}
                          className="w-full bg-[#8b5cf6] text-white font-extrabold text-lg py-4 px-8 rounded-xl rotate-[-1deg] shadow-[4px_4px_0px_0px_#ff6b6b] hover:shadow-[6px_6px_0px_0px_#ff6b6b] hover:translate-y-[-2px] transition-all"
                        >
                          Next &rarr;
                        </button>
                      </div>
                    )}

                    {/* ===== STEP 2: TELL US WHO YOU ARE ===== */}
                    {step === 2 && (
                      <div className="space-y-6">
                        <span
                          className="absolute -top-6 -right-2 md:-right-20 text-xl text-[#ff6b6b] -rotate-3"
                          style={{ fontFamily: "var(--font-handwriting)" }}
                        >
                          &larr; take your time here
                        </span>

                        {/* Brand description */}
                        <div>
                          <label
                            htmlFor="brand_description"
                            className="block text-sm font-bold text-gray-700 mb-2"
                          >
                            Brand Description *
                          </label>
                          <p className="text-xs text-gray-500 mb-2">
                            What you make, who it is for, what makes you
                            different.
                          </p>
                          <textarea
                            id="brand_description"
                            rows={10}
                            placeholder="We make handcrafted skincare for South Asian women who are tired of brands that don't get their skin. Our products are Ayurveda-inspired but backed by dermatologists..."
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 resize-none transition-colors"
                            {...register("brand_description")}
                          />
                          {errors.brand_description && (
                            <p className="mt-1 text-sm text-[#ff6b6b]">
                              {errors.brand_description.message}
                            </p>
                          )}
                        </div>

                        {/* Tone chips */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Tone *
                          </label>
                          <div className="relative">
                            <span
                              className="absolute -top-6 right-0 text-base text-[#34d399] rotate-2"
                              style={{ fontFamily: "var(--font-handwriting)" }}
                            >
                              &larr; pick all that sound like you
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-4">
                            {TONE_OPTIONS.map((t, idx) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => toggleTone(t)}
                                className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${getToneRotation(idx)} hover:rotate-0 ${
                                  tone.includes(t)
                                    ? getToneColor(idx) +
                                      " shadow-md scale-105"
                                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                            {tone
                              .filter((t) => !TONE_OPTIONS.includes(t))
                              .map((t, idx) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => toggleTone(t)}
                                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${getToneColor(idx + TONE_OPTIONS.length)} shadow-md scale-105 ${getToneRotation(idx)}`}
                                >
                                  {t} &times;
                                </button>
                              ))}
                            {!showCustomTone ? (
                              <button
                                type="button"
                                onClick={() => setShowCustomTone(true)}
                                className="px-3 py-1.5 rounded-full text-sm font-semibold border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
                              >
                                + custom
                              </button>
                            ) : (
                              <input
                                type="text"
                                autoFocus
                                placeholder="type & press enter"
                                className="px-3 py-1.5 rounded-full text-sm border-2 border-[#8b5cf6] focus:outline-none w-40"
                                value={customToneInput}
                                onChange={(e) =>
                                  setCustomToneInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addCustomTone();
                                  }
                                  if (e.key === "Escape") {
                                    setShowCustomTone(false);
                                    setCustomToneInput("");
                                  }
                                }}
                                onBlur={() => {
                                  if (customToneInput.trim()) addCustomTone();
                                  else {
                                    setShowCustomTone(false);
                                    setCustomToneInput("");
                                  }
                                }}
                              />
                            )}
                          </div>
                          {errors.tone && (
                            <p className="mt-1 text-sm text-[#ff6b6b]">
                              {errors.tone.message}
                            </p>
                          )}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={prevStep}
                            className="flex-1 bg-white text-gray-700 font-bold text-lg py-4 px-8 rounded-xl border-2 border-gray-200 hover:border-[#8b5cf6] transition-colors"
                          >
                            &larr; Back
                          </button>
                          <button
                            type="button"
                            onClick={nextStep}
                            className="flex-1 bg-[#8b5cf6] text-white font-extrabold text-lg py-4 px-8 rounded-xl rotate-[-1deg] shadow-[4px_4px_0px_0px_#ff6b6b] hover:shadow-[6px_6px_0px_0px_#ff6b6b] hover:translate-y-[-2px] transition-all"
                          >
                            Next &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ===== STEP 3: SHOW US YOUR VOICE ===== */}
                    {step === 3 && (
                      <div className="space-y-6">
                        <span
                          className="absolute -top-6 -right-2 md:-right-16 text-xl text-[#34d399] rotate-2"
                          style={{ fontFamily: "var(--font-handwriting)" }}
                        >
                          almost there! &rarr;
                        </span>

                        {/* Sample content */}
                        <div>
                          <label
                            htmlFor="sample_content"
                            className="block text-sm font-bold text-gray-700 mb-2"
                          >
                            Sample Content *
                          </label>
                          <textarea
                            id="sample_content"
                            rows={10}
                            placeholder="Paste 3-5 real posts or captions from your brand. One per line works great."
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 resize-none transition-colors"
                            {...register("sample_content")}
                          />
                          {errors.sample_content && (
                            <p className="mt-1 text-sm text-[#ff6b6b]">
                              {errors.sample_content.message}
                            </p>
                          )}
                        </div>

                        {/* Content brief */}
                        <div>
                          <label
                            htmlFor="content_brief"
                            className="block text-sm font-bold text-gray-700 mb-2"
                          >
                            Content Brief{" "}
                            <span className="text-gray-400 font-normal">
                              (optional)
                            </span>
                          </label>
                          <textarea
                            id="content_brief"
                            rows={5}
                            placeholder="What are you trying to say this month? Launches, campaigns, themes?"
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 resize-none transition-colors"
                            {...register("content_brief")}
                          />
                        </div>

                        {/* Platforms */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3">
                            Platforms *
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {PLATFORM_OPTIONS.map((p, idx) => {
                              const rotations = [
                                "rotate-1",
                                "-rotate-1",
                                "rotate-2",
                                "-rotate-2",
                                "rotate-1",
                              ];
                              const colors = [
                                "border-[#ec4899] bg-[#ec4899]",
                                "border-[#1da1f2] bg-[#1da1f2]",
                                "border-[#0077b5] bg-[#0077b5]",
                                "border-[#ff6b6b] bg-[#ff6b6b]",
                                "border-[#8b5cf6] bg-[#8b5cf6]",
                              ];
                              const isChecked = platforms.includes(p);
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => togglePlatform(p)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm border-2 transition-all ${rotations[idx]} hover:rotate-0 ${
                                    isChecked
                                      ? `${colors[idx]} text-white shadow-md`
                                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  <span
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs ${
                                      isChecked
                                        ? "border-white bg-white/30"
                                        : "border-gray-300"
                                    }`}
                                  >
                                    {isChecked && "✓"}
                                  </span>
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                          {errors.platforms && (
                            <p className="mt-1 text-sm text-[#ff6b6b]">
                              {errors.platforms.message}
                            </p>
                          )}
                        </div>

                        {/* File upload */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Brand Images{" "}
                            <span className="text-gray-400 font-normal">
                              (optional, max 5)
                            </span>
                          </label>
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#8b5cf6] transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add(
                                "border-[#8b5cf6]"
                              );
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove(
                                "border-[#8b5cf6]"
                              );
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove(
                                "border-[#8b5cf6]"
                              );
                              handleFiles(e.dataTransfer.files);
                            }}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              multiple
                              className="hidden"
                              onChange={(e) => handleFiles(e.target.files)}
                            />
                            <p className="text-gray-500 text-sm">
                              Drop images here or{" "}
                              <span className="text-[#8b5cf6] font-semibold">
                                click to browse
                              </span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              PNG, JPG, or WebP
                            </p>
                          </div>
                          {files.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {files.map((f, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                                >
                                  <span className="text-sm text-gray-700 truncate max-w-[80%]">
                                    {f.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="text-[#ff6b6b] font-bold text-sm hover:text-red-700"
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={prevStep}
                            className="flex-1 bg-white text-gray-700 font-bold text-lg py-4 px-8 rounded-xl border-2 border-gray-200 hover:border-[#8b5cf6] transition-colors"
                          >
                            &larr; Back
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-[#8b5cf6] text-white font-extrabold text-lg py-4 px-8 rounded-xl rotate-[-1deg] shadow-[4px_4px_0px_0px_#ff6b6b] hover:shadow-[6px_6px_0px_0px_#ff6b6b] hover:translate-y-[-2px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? "Generating..." : "Generate →"}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative overflow-hidden py-16 px-6 border-t border-gray-200">
        <div className="absolute top-4 right-8 w-8 h-8 rounded-full bg-[#fde047] opacity-40" />
        <div className="absolute bottom-4 left-12 w-6 h-6 rounded-md bg-[#34d399] opacity-30 rotate-12" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p
            className="text-2xl font-extrabold text-gray-900 mb-1"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
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
