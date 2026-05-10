import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <main className="min-h-dvh px-4 pb-20 pt-6">
      <CalendarView />
    </main>
  );
}
