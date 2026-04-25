import Link from "next/link";
import {
  Upload,
  CalendarDays,
  Download,
  ShieldCheck,
  Globe,
  Sparkles,
  UserCheck,
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
    icon: Upload,
    title: "Share your brand",
    description:
      "Product photo, a few lines about your brand, or just a blog URL. That's all we need.",
  },
  {
    icon: CalendarDays,
    title: "We generate 30 days of content",
    description:
      "Instagram, Twitter, LinkedIn, ads, email — all in your brand voice, across every platform you care about.",
  },
  {
    icon: Download,
    title: "Approve, edit, or download",
    description:
      "Request revisions on any piece, or download as CSV/ZIP — ready for Buffer, Hootsuite, or manual posting.",
  },
];

const valueProps = [
  {
    icon: ShieldCheck,
    title: "Anti-slop validation",
    description:
      'Every post runs through our slop detector before you see it. No "unlock your potential" — just copy that sounds like your brand.',
  },
  {
    icon: Globe,
    title: "Indian-first",
    description:
      "Hinglish-capable, INR pricing, festival-aware calendar (coming soon). Built for the Indian D2C ecosystem.",
  },
  {
    icon: Sparkles,
    title: "One input, all platforms",
    description:
      "Instagram, Twitter, LinkedIn, ads, email — from a single product photo or brand brief. No per-platform busywork.",
  },
  {
    icon: UserCheck,
    title: "Human QA on Pro tier",
    description:
      "A real editor reviews every piece before delivery. AI drafts, humans polish.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "4,999",
    description: "For brands just getting started with content",
    features: ["1 brand", "30 posts/month", "3 platforms"],
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
      "Ads + email",
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
    ],
    highlighted: false,
  },
];

const samplePosts = [
  {
    platform: "Instagram",
    icon: Camera,
    content:
      "Your morning skincare routine, but make it monsoon-proof. Our new Hydra Shield serum locks in moisture without the greasy feel. Swipe for the full 3-step routine →",
    hashtags: "#IndianSkincare #MonsoonReady #D2CBrand",
  },
  {
    platform: "LinkedIn",
    icon: Briefcase,
    content:
      "We bootstrapped to ₹50L MRR in 11 months. Here are 3 things we did differently with our D2C content strategy — and what we'd never do again.",
    hashtags: "#D2CIndia #ContentStrategy #StartupIndia",
  },
  {
    platform: "Twitter",
    icon: Hash,
    content:
      "hot take: most D2C brands don't need more ads. they need 30 days of content that actually sounds like them. we built a tool for that.",
    hashtags: "#D2C #ContentMarketing",
  },
];

const faqs = [
  {
    question: "How is this different from ChatGPT / Canva AI / Predis?",
    answer:
      "Those tools give you one post at a time. Kappa gives you a full 30-day calendar across all platforms, in your brand voice, with anti-slop validation. You get a complete content strategy, not a blank prompt.",
  },
  {
    question: "What if I don't like the output?",
    answer:
      "Request revisions on any piece — no limits on the Pro tier. We iterate until you're happy. If the entire calendar misses the mark, we'll redo it from scratch.",
  },
  {
    question: "Do you support Hinglish / regional languages?",
    answer:
      "Yes — Hinglish is supported out of the box. Regional language support (Tamil, Telugu, Marathi, Bengali) is on our roadmap for Q3 2026.",
  },
  {
    question: "How do you deliver the content?",
    answer:
      "You get a dashboard where you can review, edit, and approve each piece. When you're ready, download as CSV (for Buffer/Hootsuite) or ZIP (with images). Google Drive export is coming soon.",
  },
  {
    question: "Is my brand data secure?",
    answer:
      "Yes. We're DPDP-compliant, your data is encrypted at rest and in transit, and we delete everything on request. We never use your brand data to train models.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, all plans are month-to-month. Cancel from your dashboard — no calls, no retention flows, no guilt trips.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Kappa
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
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              30 days of on-brand content.{" "}
              <span className="text-primary">From one input.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Upload a product photo or paste your brand story. Get a full month
              of platform-ready posts, captions, and ads. Built for Indian D2C
              brands.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
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
          className="border-t bg-muted/40 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Three steps. One input. A month of content.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.title} className="flex flex-col gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Step {i + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Kappa */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">Why Kappa</h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Content tools are everywhere. Here&apos;s why this one is
              different.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {valueProps.map((prop) => (
                <div key={prop.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <prop.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{prop.title}</h3>
                    <p className="mt-1 text-muted-foreground leading-relaxed">
                      {prop.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t bg-muted/40 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">Pricing</h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Simple, monthly. Cancel anytime. All prices in INR.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      ₹{plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /mo
                      </span>
                    </p>
                    <ul className="mt-6 space-y-2">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      render={<Link href="/start" />}
                      className="mt-6 w-full"
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

        {/* Sample output carousel */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Sample output
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Real examples of what Kappa generates. Every post passes
              anti-slop validation.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {samplePosts.map((post) => (
                <Card key={post.platform}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <post.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">
                        {post.platform}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video rounded-md bg-muted mb-4 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        Image placeholder
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{post.content}</p>
                    <p className="mt-3 text-xs text-primary/70">
                      {post.hashtags}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t bg-muted/40 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <Accordion className="mt-8">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-base">
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
      </main>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Kappa</span>
            <span>· Made in India</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
