import { Resend } from "resend";

const FROM_EMAIL = "FORGE <noreply@erkely.tech>";

export function createResendClient(apiKey: string) {
  return new Resend(apiKey);
}

export async function sendVerificationEmail(
  apiKey: string,
  email: string,
  token: string,
  locale: string,
) {
  const resend = createResendClient(apiKey);
  const verifyUrl = `https://forge.erkely.tech/api/auth/verify-email?token=${token}`;

  const subject =
    locale === "hu"
      ? "Erősítsd meg az email címed – FORGE"
      : "Verify your email – FORGE";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">FORGE</h1>
      <p style="margin-bottom: 24px;">
        ${locale === "hu" ? "Kattints az alábbi gombra az email címed megerősítéséhez:" : "Click the button below to verify your email address:"}
      </p>
      <a href="${verifyUrl}" style="display: inline-block; background: #ccff00; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        ${locale === "hu" ? "Email megerősítése" : "Verify Email"}
      </a>
      <p style="margin-top: 24px; font-size: 14px; color: #666;">
        ${locale === "hu" ? "Ez a link 24 órán belül lejár." : "This link expires in 24 hours."}
      </p>
    </div>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(
  apiKey: string,
  email: string,
  token: string,
  locale: string,
) {
  const resend = createResendClient(apiKey);
  const resetUrl = `https://forge.erkely.tech/reset-password?token=${token}`;

  const subject =
    locale === "hu"
      ? "Jelszó visszaállítás – FORGE"
      : "Reset your password – FORGE";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">FORGE</h1>
      <p style="margin-bottom: 24px;">
        ${locale === "hu" ? "Kattints az alábbi gombra a jelszavad visszaállításához:" : "Click the button below to reset your password:"}
      </p>
      <a href="${resetUrl}" style="display: inline-block; background: #ccff00; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        ${locale === "hu" ? "Jelszó visszaállítása" : "Reset Password"}
      </a>
      <p style="margin-top: 24px; font-size: 14px; color: #666;">
        ${locale === "hu" ? "Ez a link 1 órán belül lejár." : "This link expires in 1 hour."}
      </p>
    </div>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html,
  });
}
