"use client";

import { Lock, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import appLogo from "@/../public/app_logo.png";
import { type SignInState, signInWithCredentials } from "./actions";
import { GoogleSignInButton } from "./google-button";

export default function SignInPage() {
  const t = useTranslations("signIn");
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const reset = searchParams.get("reset") === "true";

  const [state, action, pending] = useActionState<SignInState, FormData>(
    signInWithCredentials,
    {},
  );

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-0">
              <Image
                src={appLogo}
                alt="FORGE"
                className="h-12 w-12"
                width={48}
                height={48}
              />
              <span className="text-3xl font-bold tracking-tight text-foreground">
                FORGE
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{t("tagline")}</p>
          </div>

          {verified && (
            <p className="rounded-lg bg-primary/10 px-3 py-2 text-center text-sm text-primary">
              {t("verified")}
            </p>
          )}

          {reset && (
            <p className="rounded-lg bg-primary/10 px-3 py-2 text-center text-sm text-primary">
              {t("resetSuccess")}
            </p>
          )}

          {state.error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
              {t(`errors.${state.error}`)}
            </p>
          )}

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

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                name="password"
                placeholder={t("password")}
                required
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
              <Link
                href="/forgot-password"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline"
              >
                {t("forgot")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {pending ? t("signingIn") : t("submit")}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t("or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <GoogleSignInButton />

          <p className="text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-primary hover:underline">
              {t("register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
