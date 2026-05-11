"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { type VerifyEmailState, verifyEmail } from "./actions";

export default function VerifyEmailPage() {
  const t = useTranslations("verifyEmail");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  const [state, action, pending] = useActionState<VerifyEmailState, FormData>(
    verifyEmail,
    {},
  );

  useEffect(() => {
    if (token && formRef.current && !submitted.current) {
      submitted.current = true;
      formRef.current.requestSubmit();
    }
  }, [token]);

  useEffect(() => {
    if (state.error) {
      toast.error(t(`errors.${state.error}`));
    }
  }, [state, t]);

  if (!token) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 backdrop-blur-xl">
          <div className="space-y-4 text-center">
            <h1 className="text-xl font-bold">{t("errors.invalid_token")}</h1>
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

  if (state.error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 backdrop-blur-xl">
          <div className="space-y-4 text-center">
            <h1 className="text-xl font-bold">{t(`errors.${state.error}`)}</h1>
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
        <div className="space-y-4 text-center">
          <h1 className="text-xl font-bold">{t("verifying")}</h1>
          <p className="text-sm text-muted-foreground">{t("pleaseWait")}</p>
        </div>
      </div>
      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="token" value={token} />
      </form>
    </div>
  );
}
