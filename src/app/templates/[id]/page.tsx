import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TemplateDetail } from "./template-detail";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { id } = await params;
  return (
    <main className="min-h-dvh px-4 pb-20 pt-6">
      <TemplateDetail templateId={id} />
    </main>
  );
}
