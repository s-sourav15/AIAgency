"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const industries = [
  "Apparel",
  "Beauty",
  "F&B",
  "Home",
  "Wellness",
  "Tech",
  "Services",
  "Other",
] as const;

const toneOptions = [
  "Playful",
  "Professional",
  "Warm",
  "Witty",
  "Gen-Z",
  "Anti-corporate",
  "Luxurious",
  "Minimal",
  "Bold",
  "Informative",
] as const;

const platformOptions = [
  "Instagram",
  "Twitter",
  "LinkedIn",
  "Ads",
  "Email",
] as const;

const step1Schema = z.object({
  email: z.string().email("Enter a valid email address"),
  brandName: z.string().min(1, "Brand name is required"),
  industry: z.string().min(1, "Select an industry"),
});

const step2Schema = z.object({
  brandDescription: z
    .string()
    .min(200, "Minimum 200 characters")
    .max(5000, "Maximum 5000 characters"),
  tones: z.array(z.string()).min(1, "Select at least one tone"),
  sampleContent: z.string().optional(),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  numDays: z.number().min(7).max(90),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export default function StartPage() {
  const [step, setStep] = useState<1 | 2 | "done">(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: "", brandName: "", industry: "" },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      brandDescription: "",
      tones: [],
      sampleContent: "",
      platforms: [],
      numDays: 30,
    },
  });

  function onStep1Submit(data: Step1Data) {
    setStep1Data(data);
    setStep(2);
  }

  function onStep2Submit(data: Step2Data) {
    const payload = { ...step1Data, ...data };
    console.log("Form submitted:", payload);
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Thanks! We&apos;ll email you within 24 hours with your sample
            calendar.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Keep an eye on your inbox. If you don&apos;t see it, check spam.
          </p>
          <Button render={<Link href="/" />} variant="outline" className="mt-8">
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Kappa
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span
                className={
                  step === 1 ? "font-medium text-foreground" : "text-primary"
                }
              >
                Step 1
              </span>
              <span>→</span>
              <span
                className={
                  step === 2 ? "font-medium text-foreground" : ""
                }
              >
                Step 2
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {step === 1 ? "Tell us about your brand" : "Brand details"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {step === 1
                ? "We just need the basics to get started."
                : "Help us match your voice and pick the right platforms."}
            </p>
          </div>

          {step === 1 && (
            <form
              onSubmit={step1Form.handleSubmit(onStep1Submit)}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@brand.com"
                  {...step1Form.register("email")}
                />
                {step1Form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {step1Form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandName">Brand name</Label>
                <Input
                  id="brandName"
                  placeholder="Your brand name"
                  {...step1Form.register("brandName")}
                />
                {step1Form.formState.errors.brandName && (
                  <p className="text-sm text-destructive">
                    {step1Form.formState.errors.brandName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Industry</Label>
                <Select
                  onValueChange={(val) =>
                    step1Form.setValue("industry", val ?? "", {
                      shouldValidate: true,
                    })
                  }
                  defaultValue={step1Form.getValues("industry")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {step1Form.formState.errors.industry && (
                  <p className="text-sm text-destructive">
                    {step1Form.formState.errors.industry.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Continue
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={step2Form.handleSubmit(onStep2Submit)}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="brandDescription">
                  Brand description{" "}
                  <span className="text-muted-foreground font-normal">
                    (200–800 words ideal)
                  </span>
                </Label>
                <Textarea
                  id="brandDescription"
                  rows={6}
                  placeholder="Tell us about your brand — what you sell, who buys it, what makes you different..."
                  {...step2Form.register("brandDescription")}
                />
                {step2Form.formState.errors.brandDescription && (
                  <p className="text-sm text-destructive">
                    {step2Form.formState.errors.brandDescription.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map((tone) => {
                    const selected =
                      step2Form.watch("tones").includes(tone);
                    return (
                      <button
                        type="button"
                        key={tone}
                        onClick={() => {
                          const current = step2Form.getValues("tones");
                          step2Form.setValue(
                            "tones",
                            selected
                              ? current.filter((t) => t !== tone)
                              : [...current, tone],
                            { shouldValidate: true }
                          );
                        }}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        {tone}
                      </button>
                    );
                  })}
                </div>
                {step2Form.formState.errors.tones && (
                  <p className="text-sm text-destructive">
                    {step2Form.formState.errors.tones.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sampleContent">
                  Sample content{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional — paste an existing post or caption)
                  </span>
                </Label>
                <Textarea
                  id="sampleContent"
                  rows={3}
                  placeholder="Paste an existing post, ad copy, or brand description..."
                  {...step2Form.register("sampleContent")}
                />
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {platformOptions.map((platform) => {
                    const selected = step2Form
                      .watch("platforms")
                      .includes(platform);
                    return (
                      <label
                        key={platform}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) => {
                            const current =
                              step2Form.getValues("platforms");
                            step2Form.setValue(
                              "platforms",
                              checked
                                ? [...current, platform]
                                : current.filter((p) => p !== platform),
                              { shouldValidate: true }
                            );
                          }}
                        />
                        <span className="text-sm">{platform}</span>
                      </label>
                    );
                  })}
                </div>
                {step2Form.formState.errors.platforms && (
                  <p className="text-sm text-destructive">
                    {step2Form.formState.errors.platforms.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numDays">Number of days</Label>
                <Input
                  id="numDays"
                  type="number"
                  min={7}
                  max={90}
                  {...step2Form.register("numDays", { valueAsNumber: true })}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Submit
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
