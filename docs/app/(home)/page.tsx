import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center text-center p-8">
      <h1 className="mb-4 text-3xl font-bold">Interview SDK</h1>
      <p className="text-fd-muted-foreground max-w-xl mx-auto mb-4">
        SDK + UI component library for building dynamic interview / form flows.
      </p>
      <p>
        <Link href="/docs" className="text-fd-foreground font-semibold underline">
          Browse the Documentation
        </Link>
      </p>
    </main>
  );
}
