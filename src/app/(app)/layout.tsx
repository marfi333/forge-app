import { BottomNav } from "@/components/bottom-nav";
import { TourController } from "@/components/onboarding/tour-controller";
import { TopHeader } from "@/components/top-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopHeader />
      <main className="flex min-h-dvh flex-col gap-6 px-5 pt-[calc(env(safe-area-inset-top,0)+56px+24px)] pb-[calc(env(safe-area-inset-bottom,0)+64px+16px)] mb-10">
        {children}
      </main>
      <BottomNav />
      <TourController />
    </>
  );
}
