import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "FORGE - Fitness Tracker",
  description:
    "Track your workouts, build templates, and crush your fitness goals with FORGE.",
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return <LandingPage />;
}
