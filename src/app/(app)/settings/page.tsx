import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { HapticsToggle } from "@/components/haptics-toggle";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = session.user;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <div className="rounded-2xl border border-white/10 bg-card p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="size-14 rounded-full ring-2 ring-primary/50"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
              {user.name?.charAt(0) ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card backdrop-blur-xl">
        <HapticsToggle />
      </div>

      <div className="rounded-2xl border border-white/10 bg-card p-4 backdrop-blur-xl">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/sign-in" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10 active:bg-red-400/20"
          >
            Sign Out
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        FORGE v{process.env.NEXT_PUBLIC_APP_VERSION}
      </p>
    </>
  );
}
