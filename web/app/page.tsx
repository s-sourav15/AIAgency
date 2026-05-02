"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INDUSTRIES = [
  { label: "Apparel", value: "apparel" },
  { label: "Beauty", value: "beauty" },
  { label: "F&B", value: "fnb" },
  { label: "Home", value: "home" },
  { label: "Wellness", value: "wellness" },
  { label: "Tech", value: "tech" },
  { label: "Services", value: "services" },
  { label: "Other", value: "other" },
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

const fullSchema = z.object({
  brand_name: z.string().min(2, "Brand name is required.").max(80),
  email: z.string().email("Valid email is required."),
  industry: z.enum(
    ["apparel", "beauty", "fnb", "home", "wellness", "tech", "services", "other"],
    { message: "Pick an industry" }
  ),
  num_days: z.number().int().min(1).max(30),
  brand_description: z.string().min(50, "At least a couple sentences."),
  tone: z.array(z.string()),
  sample_content: z.string().min(50, "Paste at least one real post."),
  content_brief: z.string().optional(),
  platforms: z.array(z.string()).min(1, "Pick at least one platform."),
  brand_illustrations: z.array(z.any()).max(5).optional(),
});

const partialSchema = z.object({
  brand_name: z.string().min(2, "Brand name is required.").max(80),
  email: z.string().email("Valid email is required."),
  industry: z.enum(
    ["apparel", "beauty", "fnb", "home", "wellness", "tech", "services", "other"],
    { message: "Pick an industry" }
  ),
  num_days: z.number().int().min(1).max(30),
  brand_description: z.string().min(10, "Give us at least a sentence."),
  tone: z.array(z.string()).optional(),
  sample_content: z.string().optional(),
  content_brief: z.string().optional(),
  platforms: z.array(z.string()).min(1, "Pick at least one platform."),
  brand_illustrations: z.array(z.any()).max(5).optional(),
});

type FormData = z.infer<typeof fullSchema>;

export default function StickerPackPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submittedBrand, setSubmittedBrand] = useState("");
  const [customToneInput, setCustomToneInput] = useState("");
  const [showCustomTone, setShowCustomTone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [validationBanner, setValidationBanner] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      brand_name: "",
      email: "",
      industry: undefined as unknown as FormData["industry"],
      num_days: 30,
      brand_description: "",
      tone: [],
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

  const toggleTone = (t: string) => {
    const current = watch("tone") || [];
    if (current.includes(t)) {
      setValue("tone", current.filter((x) => x !== t));
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
      setValue("platforms", current.filter((x) => x !== p));
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

  const submitPayload = async (data: FormData) => {
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
      brand_illustrations_count: data.brand_illustrations?.length || 0,
    };

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api.utsuk.studio";

    try {
      const res = await fetch(`${apiUrl}/api/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Pydantic 422 payload: { detail: [{ loc, msg, ... }, ...] }
        let message = `Intake failed (${res.status}).`;
        try {
          const body = await res.json();
          if (Array.isArray(body?.detail)) {
            message = body.detail
              .map((d: { msg?: string; loc?: unknown }) => d.msg || "Invalid field")
              .join(" — ");
          } else if (typeof body?.detail === "string") {
            message = body.detail;
          }
        } catch {
          // fall through with generic message
        }
        setValidationBanner(message);
        return;
      }

      const body: { job_id: string; brand_id: string; redirect_to: string } =
        await res.json();

      setSubmittedBrand(data.brand_name || "your brand");
      setSubmitted(true);
      setValidationBanner("");

      // Give the success card a beat, then jump to the job status page.
      setTimeout(() => {
        router.push(body.redirect_to || `/dashboard/jobs/${body.job_id}`);
      }, 1200);
    } catch (err) {
      console.error("Intake submit failed", err);
      setValidationBanner(
        "We could not reach the generator. Check your connection and try again."
      );
    }
  };

  const onFullSubmit = async (data: FormData) => {
    await submitPayload(data);
  };

  const onFullError = () => {
    setValidationBanner("Fill in the items marked with * and we are good to go.");
  };

  const generatePartial = async () => {
    const data = getValues();
    const result = partialSchema.safeParse({
      ...data,
      industry: data.industry || undefined,
    });
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      setValidationBanner(msgs || "Fill in the required fields first.");
      await trigger();
      return;
    }
    const confirmed = window.confirm(
      "You are generating with partial info. Output may be less on-brand. Continue?"
    );
    if (!confirmed) return;
    await submitPayload(data);
  };

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
              <span className="text-base font-bold text-[#8b5cf6] uppercase tracking-wide">
                Step 1
              </span>
              <p
                className="mt-2 text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Tell us about your brand
              </p>
              <span
                className="absolute -top-4 -right-6 text-xl text-[#ff6b6b] -rotate-12"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                &larr; 30 sec
              </span>
            </div>

            <div className="relative bg-[#dbeafe] p-8 rounded-xl shadow-md -rotate-2 max-w-xs w-full">
              <span className="text-base font-bold text-[#ff6b6b] uppercase tracking-wide">
                Step 2
              </span>
              <p
                className="mt-2 text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Show us your voice &amp; tone
              </p>
              <span
                className="absolute -bottom-5 -left-4 text-xl text-[#8b5cf6] rotate-6"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                magic happens here
              </span>
            </div>

            <div className="relative bg-[#d1fae5] p-8 rounded-xl shadow-md rotate-1 max-w-xs w-full">
              <span className="text-base font-bold text-[#34d399] uppercase tracking-wide">
                Step 3
              </span>
              <p
                className="mt-2 text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                We generate a month of content
              </p>
              <span
                className="absolute -top-4 right-2 text-xl text-[#fde047] -rotate-3"
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
              <p className="mt-1 text-base text-gray-600">
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
              <p className="mt-1 text-base text-gray-600">
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
              <p className="mt-1 text-base text-gray-600">
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
              <p className="mt-1 text-base text-gray-600">
                Custom models. Custom scoring. Custom voice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INTAKE FORM SECTION ===== */}
      <section className="relative overflow-hidden py-28 px-6 bg-[#fefbf3]">
        <div className="absolute top-10 right-10 w-14 h-14 rounded-full bg-[#8b5cf6] opacity-40" />
        <div className="absolute top-1/4 left-6 w-10 h-10 rounded-lg bg-[#fde047] opacity-60 rotate-12" />
        <div className="absolute top-1/3 right-4 w-8 h-20 rounded-full bg-[#34d399] opacity-30 -rotate-6" />
        <div className="absolute bottom-1/3 left-8 w-12 h-12 rounded-full bg-[#ff6b6b] opacity-40" />
        <div className="absolute bottom-16 right-16 w-16 h-6 rounded-full bg-[#8b5cf6] opacity-30 rotate-6" />
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 rounded-md bg-[#fde047] opacity-50 rotate-45" />

        <div className="relative z-10 max-w-2xl mx-auto">
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
              <p className="text-lg md:text-xl text-gray-600">
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
              {/* Validation banner */}
              {validationBanner && (
                <div className="mb-6 bg-[#ff6b6b]/10 border border-[#ff6b6b] rounded-xl px-5 py-3 text-base md:text-lg text-[#ff6b6b] font-medium text-center">
                  {validationBanner}
                </div>
              )}

              <form
                onSubmit={handleSubmit(onFullSubmit, onFullError)}
                className="relative bg-[#fffdf7] rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100"
                style={{ transform: "rotate(-0.2deg)" }}
              >
                {/* ===== SECTION A: WHO YOU ARE ===== */}
                <div className="mb-12">
                  <div className="relative mb-6">
                    <h3
                      className="text-2xl md:text-3xl text-gray-900"
                      style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                    >
                      Who you are
                    </h3>
                    <span
                      className="block mt-1 text-lg md:text-xl text-gray-500"
                      style={{ fontFamily: "var(--font-handwriting)" }}
                    >
                      (items with * are needed to generate)
                    </span>
                    <span
                      className="absolute -top-4 -right-2 md:-right-12 text-lg md:text-xl text-[#8b5cf6] -rotate-6"
                      style={{ fontFamily: "var(--font-handwriting)" }}
                    >
                      &larr; quick stuff first!
                    </span>
                  </div>

                  {/* Generate now shortcut */}
                  <button
                    type="button"
                    onClick={generatePartial}
                    className="mb-6 text-base text-gray-500 hover:text-[#8b5cf6] transition-colors underline decoration-dotted underline-offset-4"
                    style={{ fontFamily: "var(--font-handwriting)" }}
                  >
                    Generate now with what I have so far &rarr;
                  </button>

                  <div className="space-y-6">
                    {/* Brand name */}
                    <div>
                      <label
                        htmlFor="brand_name"
                        className="block text-base md:text-lg font-bold text-gray-700 mb-2"
                      >
                        Brand name <span className="text-base text-[#ff6b6b]">*</span>
                      </label>
                      <input
                        id="brand_name"
                        type="text"
                        placeholder="e.g. Hoya Beauty"
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base md:text-lg text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 transition-colors"
                        {...register("brand_name")}
                      />
                      {errors.brand_name && (
                        <p className="mt-1 text-base text-[#ff6b6b]">
                          {errors.brand_name.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-base md:text-lg font-bold text-gray-700 mb-2"
                      >
                        Email <span className="text-base text-[#ff6b6b]">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="hello@yourbrand.com"
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base md:text-lg text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 transition-colors"
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="mt-1 text-base text-[#ff6b6b]">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Industry */}
                    <div>
                      <label className="block text-base md:text-lg font-bold text-gray-700 mb-2">
                        Industry <span className="text-base text-[#ff6b6b]">*</span>
                      </label>
                      <Select
                        value={industry}
                        onValueChange={(val) =>
                          setValue(
                            "industry",
                            val as FormData["industry"],
                            { shouldValidate: true }
                          )
                        }
                      >
                        <SelectTrigger className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 h-auto text-base md:text-lg text-gray-900 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20">
                          <SelectValue placeholder="Pick your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((ind) => (
                            <SelectItem key={ind.value} value={ind.value}>
                              {ind.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.industry && (
                        <p className="mt-1 text-base text-[#ff6b6b]">
                          {errors.industry.message}
                        </p>
                      )}
                    </div>

                    {/* Number of days */}
                    <div>
                      <label className="block text-base md:text-lg font-bold text-gray-700 mb-2">
                        Number of days <span className="text-base text-[#ff6b6b]">*</span>
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[7, 14, 30].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() =>
                              setValue("num_days", d, { shouldValidate: true })
                            }
                            className={`px-6 py-2.5 rounded-full font-bold text-base md:text-lg border-2 transition-all ${
                              numDays === d
                                ? "bg-[#8b5cf6] text-white border-[#8b5cf6] shadow-md"
                                : "bg-white text-gray-700 border-gray-200 hover:border-[#8b5cf6]/50"
                            }`}
                          >
                            {d} days
                          </button>
                        ))}
                      </div>
                      {errors.num_days && (
                        <p className="mt-1 text-base text-[#ff6b6b]">
                          {errors.num_days.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section divider */}
                <div className="relative my-10 flex items-center justify-center">
                  <div className="w-full border-t-2 border-dashed border-gray-200" />
                  <span className="absolute bg-[#fffdf7] px-3 text-[#ff6b6b] text-xl rotate-12">&#10038;</span>
                </div>

                {/* ===== SECTION B: YOUR VOICE ===== */}
                <div className="mb-12">
                  <div className="relative mb-6">
                    <h3
                      className="text-2xl md:text-3xl text-gray-900"
                      style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                    >
                      Your voice
                    </h3>
                    <span
                      className="block mt-1 text-lg md:text-xl text-gray-500"
                      style={{ fontFamily: "var(--font-handwriting)" }}
                    >
                      the more you share, the better the output
                    </span>
                    <span
                      className="absolute -top-4 -right-2 md:-right-16 text-lg md:text-xl text-[#ff6b6b] -rotate-3"
                      style={{ fontFamily: "var(--font-handwriting)" }}
                    >
                      &larr; take your time here
                    </span>
                  </div>

                  {/* Generate now shortcut */}
                  <button
                    type="button"
                    onClick={generatePartial}
                    className="mb-6 text-base text-gray-500 hover:text-[#8b5cf6] transition-colors underline decoration-dotted underline-offset-4"
                    style={{ fontFamily: "var(--font-handwriting)" }}
                  >
                    Generate now with what I have so far &rarr;
                  </button>

                  <div className="space-y-6">
                    {/* Brand description */}
                    <div>
                      <label
                        htmlFor="brand_description"
                        className="block text-base md:text-lg font-bold text-gray-700 mb-2"
                      >
                        Brand description <span className="text-base text-[#ff6b6b]">*</span>
                      </label>
                      <textarea
                        id="brand_description"
                        rows={6}
                        placeholder="What you make, who its for, how you sound. A paragraph or two works."
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base md:text-lg text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 resize-none transition-colors"
                        {...register("brand_description")}
                      />
                      {errors.brand_description && (
                        <p className="mt-1 text-base text-[#ff6b6b]">
                          {errors.brand_description.message}
                        </p>
                      )}
                    </div>

                    {/* Tone chips */}
                    <div>
                      <label className="block text-base md:text-lg font-bold text-gray-700 mb-2">
                        Tone
                      </label>
                      <div className="relative">
                        <span
                          className="text-lg md:text-xl text-[#34d399] rotate-2"
                          style={{ fontFamily: "var(--font-handwriting)" }}
                        >
                          pick all that sound like you &darr;
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {TONE_OPTIONS.map((t, idx) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTone(t)}
                            className={`px-3 py-1.5 rounded-full text-base font-semibold border-2 transition-all ${getToneRotation(idx)} hover:rotate-0 ${
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
                              className={`px-3 py-1.5 rounded-full text-base font-semibold border-2 transition-all ${getToneColor(idx + TONE_OPTIONS.length)} shadow-md scale-105 ${getToneRotation(idx)}`}
                            >
                              {t} &times;
                            </button>
                          ))}
                        {!showCustomTone ? (
                          <button
                            type="button"
                            onClick={() => setShowCustomTone(true)}
                            className="px-3 py-1.5 rounded-full text-base font-semibold border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
                          >
                            + custom
                          </button>
                        ) : (
                          <input
                            type="text"
                            autoFocus
                            placeholder="type & press enter"
                            className="px-3 py-1.5 rounded-full text-base border-2 border-[#8b5cf6] focus:outline-none w-40"
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
                    </div>

                    {/* Sample content */}
                    <div>
                      <label
                        htmlFor="sample_content"
                        className="block text-base md:text-lg font-bold text-gray-700 mb-2"
                      >
                        Sample content <span className="text-base text-[#ff6b6b]">*</span>
                      </label>
                      <textarea
                        id="sample_content"
                        rows={6}
                        placeholder="Paste 3-5 real posts or captions from your brand. One per line works great."
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base md:text-lg text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 resize-none transition-colors"
                        {...register("sample_content")}
                      />
                      {errors.sample_content && (
                        <p className="mt-1 text-base text-[#ff6b6b]">
                          {errors.sample_content.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section divider */}
                <div className="relative my-10 flex items-center justify-center">
                  <div className="w-full border-t-2 border-dashed border-gray-200" />
                  <span className="absolute bg-[#fffdf7] px-3 text-[#34d399] text-xl -rotate-12">&#10040;</span>
                </div>

                {/* ===== SECTION C: WHAT YOU WANT ===== */}
                <div className="mb-10">
                  <div className="relative mb-6">
                    <h3
                      className="text-2xl md:text-3xl text-gray-900"
                      style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                    >
                      What you want
                    </h3>
                    <span
                      className="block mt-1 text-lg md:text-xl text-gray-500"
                      style={{ fontFamily: "var(--font-handwriting)" }}
                    >
                      all optional except platforms
                    </span>
                    <span
                      className="absolute -top-4 -right-2 md:-right-12 text-lg md:text-xl text-[#34d399] rotate-2"
                      style={{ fontFamily: "var(--font-handwriting)" }}
                    >
                      almost there! &rarr;
                    </span>
                  </div>

                  {/* Generate now shortcut */}
                  <button
                    type="button"
                    onClick={generatePartial}
                    className="mb-6 text-base text-gray-500 hover:text-[#8b5cf6] transition-colors underline decoration-dotted underline-offset-4"
                    style={{ fontFamily: "var(--font-handwriting)" }}
                  >
                    Generate now with what I have so far &rarr;
                  </button>

                  <div className="space-y-6">
                    {/* Content brief */}
                    <div>
                      <label
                        htmlFor="content_brief"
                        className="block text-base md:text-lg font-bold text-gray-700 mb-2"
                      >
                        Content brief
                      </label>
                      <textarea
                        id="content_brief"
                        rows={4}
                        placeholder="Any specific launches, campaigns, or themes for this month? Leave blank if you want us to decide."
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base md:text-lg text-gray-900 placeholder:text-gray-400 focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 resize-none transition-colors"
                        {...register("content_brief")}
                      />
                    </div>

                    {/* Platforms */}
                    <div>
                      <label className="block text-base md:text-lg font-bold text-gray-700 mb-3">
                        Platforms <span className="text-base text-[#ff6b6b]">*</span>
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
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-base md:text-lg border-2 transition-all ${rotations[idx]} hover:rotate-0 ${
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
                        <p className="mt-1 text-base text-[#ff6b6b]">
                          {errors.platforms.message}
                        </p>
                      )}
                    </div>

                    {/* File upload */}
                    <div>
                      <label className="block text-base md:text-lg font-bold text-gray-700 mb-2">
                        Brand images{" "}
                        <span className="text-gray-400 font-normal text-base">
                          (optional, max 5)
                        </span>
                      </label>
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#8b5cf6] transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add("border-[#8b5cf6]");
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove("border-[#8b5cf6]");
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("border-[#8b5cf6]");
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
                        <p className="text-gray-500 text-base md:text-lg">
                          Drop images here or{" "}
                          <span className="text-[#8b5cf6] font-semibold">
                            click to browse
                          </span>
                        </p>
                        <p className="text-base text-gray-400 mt-1">
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
                              <span className="text-base text-gray-700 truncate max-w-[80%]">
                                {f.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="text-[#ff6b6b] font-bold text-base hover:text-red-700"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ===== GENERATE BUTTON ===== */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#7c2d3e] text-white font-extrabold text-lg md:text-xl py-5 px-8 rounded-xl shadow-[4px_4px_0px_0px_#ff6b6b] hover:shadow-[6px_6px_0px_0px_#ff6b6b] hover:translate-y-[-2px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontFamily: "var(--font-handwriting)" }}
                >
                  {isSubmitting ? "Generating..." : "Generate a month of content →"}
                </button>
              </form>
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
            className="inline-block text-xl text-[#8b5cf6] -rotate-2 mb-4"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            content that slaps
          </span>
          <p className="text-base text-gray-500">
            &copy; {new Date().getFullYear()} LOGO. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
