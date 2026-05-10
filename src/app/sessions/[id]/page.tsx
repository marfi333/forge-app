import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SessionDetail } from "./session-detail";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { id } = await params;
  return (
    <main className="min-h-dvh px-4 pb-20 pt-6">
      <SessionDetail sessionId={id} />
    </main>
  );
}
