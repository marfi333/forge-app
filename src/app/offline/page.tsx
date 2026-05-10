export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">You're offline</h1>
        <p className="mt-2 text-muted-foreground">
          Check your connection and try again.
        </p>
      </div>
    </main>
  );
}
