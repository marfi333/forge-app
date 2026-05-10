import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StatsView } from "./stats-view";

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return <StatsView />;
}
