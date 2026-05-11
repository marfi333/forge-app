"use client";

import { ArrowLeft, Mail, Send } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { type ForgotPasswordState, forgotPassword } from "./actions";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");
  const [state, action, pending] = useActionState<
    ForgotPasswordState,
    FormData
  >(forgotPassword, {});

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
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="size-4" />
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
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                name="email"
                placeholder={t("email")}
                required
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              <Send className="size-4" />
              {pending ? t("sending") : t("submit")}
            </button>
          </form>

          <Link
            href="/sign-in"
            className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
