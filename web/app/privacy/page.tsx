import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-muted-foreground">Coming soon.</p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-primary hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
