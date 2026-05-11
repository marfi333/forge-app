"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { type ResetPasswordState, resetPassword } from "./actions";

export default function ResetPasswordPage() {
  const t = useTranslations("resetPassword");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(
    resetPassword,
    {},
  );

  useEffect(() => {
    if (state.error) {
      toast.error(t(`errors.${state.error}`));
    }
    if (state.fieldErrors) {
      const firstKey = Object.keys(state.fieldErrors)[0];
      if (firstKey) {
        const errorKey =
          firstKey === "password" ? "password_min" : "passwords_mismatch";
        toast.error(t(`errors.${errorKey}`));
      }
    }
  }, [state, t]);

  if (!token) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 backdrop-blur-xl">
          <div className="space-y-4 text-center">
            <h1 className="text-xl font-bold">{t("errors.invalid_token")}</h1>
            <Link
              href="/forgot-password"
              className="inline-block text-sm text-primary hover:underline"
            >
              {t("subtitle")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          <form action={action} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                name="password"
                placeholder={t("password")}
                required
                minLength={8}
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                name="confirmPassword"
                placeholder={t("confirmPassword")}
                required
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {pending ? t("resetting") : t("submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
