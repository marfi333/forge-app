export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col gap-6 px-5 pt-20 pb-24">
      {children}
    </main>
  );
}
