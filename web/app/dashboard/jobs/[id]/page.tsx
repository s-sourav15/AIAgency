"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Download, Share2 } from "lucide-react";

const jobsMeta: Record<string, { name: string; status: string }> = {
  "spring-launch": { name: "Spring Launch Campaign", status: "ready" },
  "festive-season": { name: "Festive Season 30-day", status: "generating" },
  "blog-repurposing": {
    name: "Weekly Blog Repurposing",
    status: "needs feedback",
  },
};

const platforms = ["Instagram", "Twitter", "LinkedIn", "Ad", "Email"];

const mockPieces = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  day: i + 1,
  platform: platforms[i % platforms.length],
  excerpt: [
    "New drop alert — our handcrafted linen kurtas are here. Breathable, minimal, made for Indian summers.",
    "Thread: 5 things we learned scaling to 10K orders/month as a bootstrapped D2C brand.",
    "Your Monday morning needs this: artisan chai blend + our best-selling ceramic mug. Limited combo live now.",
    "Running a D2C brand in India? Here's why your content strategy matters more than your ad spend.",
    "Subject: Your exclusive early access starts now. 48 hours before everyone else.",
  ][i % 5],
}));

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  ready: "default",
  generating: "secondary",
  "needs feedback": "outline",
};

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const job = jobsMeta[id] ?? { name: "Unknown Job", status: "unknown" };
  const [openDialog, setOpenDialog] = useState<number | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Kappa
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              {job.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant[job.status] ?? "outline"}>
              {job.status}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => {}}>
              <Download className="mr-1 h-4 w-4" />
              Download CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => {}}>
              <Share2 className="mr-1 h-4 w-4" />
              Share to Drive
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockPieces.map((piece) => (
            <Card key={piece.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Day {piece.day} · {piece.platform}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 aspect-video rounded-md bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    Image placeholder
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {piece.excerpt}
                </p>
                <Dialog
                  open={openDialog === piece.id}
                  onOpenChange={(open) =>
                    setOpenDialog(open ? piece.id : null)
                  }
                >
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                      />
                    }
                  >
                    Request revision
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Revision — Day {piece.day} ({piece.platform})
                      </DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setOpenDialog(null);
                      }}
                      className="space-y-4"
                    >
                      <Textarea
                        rows={4}
                        placeholder="Describe what you'd like changed..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenDialog(null)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Submit</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
