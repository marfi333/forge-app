import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ExerciseInfo } from "./exercise-info";

export default async function ExerciseInfoPage({
  params,
}: {
  params: Promise<{ id: string; exerciseId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { id, exerciseId } = await params;
  return <ExerciseInfo templateId={id} exerciseId={exerciseId} />;
}
