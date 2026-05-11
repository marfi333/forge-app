"use client";

import { Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { type RegisterState, register } from "./actions";

export default function RegisterPage() {
  const t = useTranslations("register");
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    register,
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
          firstKey === "name"
            ? "name_required"
            : firstKey === "email"
              ? "invalid_email"
              : firstKey === "password"
                ? "password_min"
                : "passwords_mismatch";
        toast.error(t(`errors.${errorKey}`));
      }
    }
  }, [state, t]);

  if (state.success) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 backdrop-blur-xl">
          <div className="space-y-4 text-center">
            <Mail className="mx-auto size-12 text-primary" />
            <h1 className="text-xl font-bold">{t("checkEmail")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("checkEmailDescription")}
            </p>
            <Link
              href="/sign-in"
              className="inline-block text-sm text-primary hover:underline"
            >
              {t("backToLogin")}
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
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                name="name"
                placeholder={t("name")}
                required
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                name="email"
                placeholder={t("email")}
                required
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>

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
              {pending ? t("registering") : t("submit")}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
