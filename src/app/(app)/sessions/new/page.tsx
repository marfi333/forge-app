import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NewSession } from "./new-session";

export default async function NewSessionPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <Suspense>
      <NewSession />
    </Suspense>
  );
}
