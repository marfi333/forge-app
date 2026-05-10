import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return <CalendarView />;
}
