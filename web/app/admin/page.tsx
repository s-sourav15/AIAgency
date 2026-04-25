import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockClients = [
  { name: "Aura Skincare", plan: "Growth", campaigns: 3, status: "active" },
  { name: "Brew & Beyond", plan: "Starter", campaigns: 1, status: "active" },
  { name: "Thread Studio", plan: "Pro", campaigns: 5, status: "active" },
  { name: "HomeKraft", plan: "Starter", campaigns: 1, status: "paused" },
  { name: "WellNest", plan: "Agency", campaigns: 8, status: "active" },
];

export default function AdminPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">Admin view</h1>
        <p className="mt-1 text-muted-foreground">
          Admin dashboard — coming soon. Below is a stub client list.
        </p>

        <div className="mt-8 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Campaigns
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockClients.map((client) => (
                <TableRow key={client.name}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.plan}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {client.campaigns}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === "active" ? "default" : "secondary"
                      }
                    >
                      {client.status}
                    </Badge>
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
