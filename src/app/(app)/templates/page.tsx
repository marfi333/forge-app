import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TemplateList } from "./template-list";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return <TemplateList />;
}
