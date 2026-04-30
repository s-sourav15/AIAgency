import Link from "next/link";
import {
  ShieldCheck,
  Globe,
  Layers,
  Lock,
  Camera,
  Briefcase,
  Hash,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    number: "01",
    title: "Tell us about your brand",
    description:
      "One paragraph about what you sell and who you sell it to. Drop in a few sample posts if you have them. Takes five minutes.",
  },
  {
    number: "02",
    title: "We study your voice",
    description:
      "Our system analyses your tone, vocabulary, and cadence. Every draft gets scored against a slop detector — banned words, AI-sounding phrases, and generic filler get flagged and rewritten before you ever see them.",
  },
  {
    number: "03",
    title: "Get posts you can actually publish",
    description:
      "Instagram captions, Twitter threads, LinkedIn posts, ad copy, email subject lines — 30 days of content, delivered to your dashboard. Download as CSV, ZIP, or export to Drive.",
  },
];

const valueProps = [
  {
    icon: ShieldCheck,
    title: "Posts that do not read like AI",
    description:
      "Every piece runs through our anti-slop validator. If it sounds like ChatGPT wrote it, it gets rewritten. Your audience should never be able to tell.",
  },
  {
    icon: Globe,
    title: "Built for the way founders actually talk",
    description:
      "We understand the tone and rhythm of brands built here. Hinglish-capable, culturally aware, never tone-deaf. Your voice, not a template.",
  },
  {
    icon: Layers,
    title: "One input, every surface",
    description:
      "Instagram, Twitter, LinkedIn, ads, email — all from a single brand brief. No per-platform busywork, no copy-pasting between tools.",
  },
  {
    icon: Lock,
    title: "You own everything",
    description:
      "No watermarks, no attribution requirements, no platform lock-in. Your content is yours. Export it, repurpose it, do whatever you want with it.",
  },
];

const samplePosts = [
  {
    platform: "Instagram",
    icon: Camera,
    brand: "Tanvi Ethnic",
    content:
      "Your lehenga should not need a disclaimer. Ours is handwoven, not screen-printed-to-look-handwoven. The difference shows up in how it falls, how it catches light, how it moves with you.",
    slopScore: "0.91",
  },
  {
    platform: "LinkedIn",
    icon: Briefcase,
    brand: "Dermarite Labs",
    content:
      "We cold-process everything. Yes, it takes 3x longer. Yes, our margins are thinner. But our retinol actually works at the concentration on the label. That is the whole pitch.",
    slopScore: "0.87",
  },
  {
    platform: "Twitter",
    icon: Hash,
    brand: "Crunchbox Snacks",
    content:
      "hot take: if your ingredient list needs a glossary, you are not a clean-label brand. ours has six items. you can pronounce all of them.",
    slopScore: "0.93",
  },
];

const plans = [
  {
    name: "Starter",
    price: "4,999",
    description: "For brands just getting started with content",
    features: ["1 brand", "30 posts/month", "3 platforms", "Anti-slop validation"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "14,999",
    description: "For brands ready to scale across every channel",
    features: [
      "1 brand",
      "90 posts/month",
      "All platforms",
      "Ads + email copy",
      "Priority delivery",
    ],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "29,999",
    description: "For brands that want human-reviewed quality",
    features: [
      "1 brand",
      "Unlimited posts",
      "All platforms",
      "Human QA review",
      "Dedicated editor",
    ],
    highlighted: false,
  },
  {
    name: "Agency",
    price: "49,999",
    description: "For agencies managing multiple brands",
    features: [
      "Up to 10 brands",
      "Unlimited posts",
      "White-label",
      "API access",
      "Custom integrations",
    ],
    highlighted: false,
  },
];

const faqs = [
  {
    question: "Is this just another AI content tool?",
    answer:
      "No. Most AI tools give you a blank prompt and wish you luck. We take your brand voice, run every output through an anti-slop validator, and deliver content that sounds like you wrote it on a good day. On Pro, a real human editor reviews everything before it reaches you. The bar is: would you actually post this?",
  },
  {
    question: "What if the output is bad?",
    answer:
      "On Pro, every piece goes through human QA before delivery. On all tiers, you can request revisions — no limits on how many. If the entire calendar misses the vibe, we will redo it from scratch, free. We would rather over-deliver than lose your trust.",
  },
  {
    question: "Do you do Hinglish?",
    answer:
      "Yes. If your brand speaks in Hinglish, the output will too — same pronouns, same phrases, same code-switching patterns. We match how your audience actually talks, not how a textbook says they should.",
  },
  {
    question: "How do I actually get the content?",
    answer:
      "Everything lands in your dashboard where you can review, edit, and approve each piece. When you are ready, download as CSV (for Buffer or Hootsuite), ZIP with images, or export to Google Drive (coming soon).",
  },
  {
    question: "Is my brand data safe?",
    answer:
      "DPDP compliant. Encrypted at rest and in transit. Delete on request — we remove everything within 48 hours. We never use your brand data to train models. Your voice stays yours.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. All plans are month-to-month. Cancel from your dashboard — no calls, no retention flows, no guilt trips. If you come back later, your brand profile is still there.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-serif text-2xl tracking-tight">
            Utsuk
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/start"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-36">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.1]">
              Your brand, your voice —{" "}
              <span className="text-primary">running on our backend.</span>
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Give us your brand. Get posts, captions, and ads that actually
              sound like you. Not like ChatGPT.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Button
                render={<Link href="/start" />}
                size="lg"
                className="text-base px-8"
              >
                Start free sample
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                render={<a href="#how-it-works" />}
                variant="outline"
                size="lg"
                className="text-base"
              >
                See how it works
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-t bg-muted/40 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">
              How it works
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl">
              Three steps. Five minutes of your time. A month of content that
              sounds like you.
            </p>
            <div className="mt-16 grid gap-12 sm:gap-16 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col gap-4">
                  <span className="font-serif text-5xl text-primary/30">
                    {step.number}
                  </span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Utsuk */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">
              Why Utsuk
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl">
              Content tools are everywhere. Here&apos;s why this one is
              different.
            </p>
            <div className="mt-16 grid gap-10 sm:grid-cols-2">
              {valueProps.map((prop) => (
                <div key={prop.title} className="flex gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <prop.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{prop.title}</h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed">
                      {prop.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sample Output */}
        <section className="border-t bg-muted/40 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">
              Sample output
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl">
              Real examples of what lands in your dashboard. Every post scored
              against our anti-slop validator.
            </p>
            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {samplePosts.map((post) => (
                <Card key={post.brand} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <post.icon className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {post.platform}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs font-mono">
                        slop score: {post.slopScore}
                      </Badge>
                    </div>
                    <CardDescription className="text-base font-semibold text-foreground mt-2">
                      {post.brand}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      &ldquo;{post.content}&rdquo;
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">
              Pricing
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl">
              Simple, monthly. Cancel anytime. All prices in INR.
            </p>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={
                    plan.highlighted
                      ? "border-primary shadow-md ring-1 ring-primary/20"
                      : ""
                  }
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {plan.highlighted && (
                        <Badge variant="default" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      <span className="font-serif">₹{plan.price}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        /mo
                      </span>
                    </p>
                    <ul className="mt-6 space-y-2.5">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2.5 text-sm text-muted-foreground"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      render={<Link href="/start" />}
                      className="mt-8 w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      Get started
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t bg-muted/40 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">
              Questions
            </h2>
            <Accordion className="mt-10">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-base font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Founder Note */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">
              Why this exists
            </h2>
            <div className="mt-10 space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                Every D2C brand I know either pays 40K a month for mediocre
                freelance content or burns out doing it themselves. The founder
                writes posts at midnight, the intern writes posts that sound like
                an intern, and the agency sends back copy that could belong to
                any brand in any category.
              </p>
              <p>
                I built Utsuk because there should be a better option. Not just
                cheaper — actually good. Content that sounds like your brand, not
                like every other AI tool. We score every piece against a slop
                detector before you see it. If it reads like a prompt response,
                it gets rewritten.
              </p>
              <p>
                The goal is simple: you should be able to hand this off and trust
                what comes back. No babysitting, no extensive editing, no
                cringing when you read the drafts. Just content you would
                actually post.
              </p>
            </div>
            <p className="mt-10 font-serif text-lg text-foreground">
              — Soumya, founder
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Utsuk · Made in India
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
