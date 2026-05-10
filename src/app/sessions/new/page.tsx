import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NewSession } from "./new-session";

export default async function NewSessionPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <main className="min-h-dvh px-4 pb-20 pt-6">
      <NewSession />
    </main>
  );
}
