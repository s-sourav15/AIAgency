import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const jobs = [
  {
    id: "spring-launch",
    name: "Spring Launch Campaign",
    status: "ready" as const,
    created: "2026-04-20",
    pieces: 30,
  },
  {
    id: "festive-season",
    name: "Festive Season 30-day",
    status: "generating" as const,
    created: "2026-04-22",
    pieces: 30,
  },
  {
    id: "blog-repurposing",
    name: "Weekly Blog Repurposing",
    status: "needs feedback" as const,
    created: "2026-04-24",
    pieces: 12,
  },
];

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  ready: "default",
  generating: "secondary",
  "needs feedback": "outline",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Kappa
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Your campaigns</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your content calendars.
        </p>

        <div className="mt-8 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="hidden sm:table-cell text-right">
                  Pieces
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="font-medium hover:underline"
                    >
                      {job.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[job.status]}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {job.created}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
                    {job.pieces}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
