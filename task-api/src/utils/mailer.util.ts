import nodemailer from 'nodemailer';
import env from '../config/env';

type SendResult = { sent: boolean; error?: string };

/** Fail fast on hung SMTP (e.g. Render → Gmail); nodemailer defaults are ~2 minutes. */
const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_GREETING_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 10_000;

/**
 * Password-reset email.
 * Prefer SMTP (Gmail App Password / any SMTP) when SMTP_* is set;
 * otherwise use Resend when RESEND_API_KEY is set.
 */
export class MailerUtil {
  public static isConfigured(): boolean {
    return this.hasSmtp() || Boolean(process.env.RESEND_API_KEY?.trim());
  }

  private static hasSmtp(): boolean {
    return Boolean(
      process.env.SMTP_HOST?.trim() &&
        process.env.SMTP_USER?.trim() &&
        process.env.SMTP_PASS?.trim()
    );
  }

  private static buildBodies(resetUrl: string): { text: string; html: string } {
    const text = [
      'Reset your Task Management password',
      '',
      'We received a request to reset your password. Open this link (expires in 1 hour):',
      resetUrl,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h1>
    <p style="margin: 0 0 16px;">We received a request to reset your Task Management password. This link expires in <strong>1 hour</strong>.</p>
    <p style="margin: 0 0 24px;">
      <a href="${resetUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 6px; font-weight: 600;">
        Reset password
      </a>
    </p>
    <p style="margin: 0 0 8px; font-size: 13px; color: #555;">Or copy this link:</p>
    <p style="margin: 0 0 24px; font-size: 12px; word-break: break-all; color: #333;">${resetUrl}</p>
    <p style="margin: 0; font-size: 13px; color: #777;">If you did not request this, you can ignore this email.</p>
  </body>
</html>`.trim();

    return { text, html };
  }

  private static async sendViaSmtp(to: string, resetUrl: string): Promise<SendResult> {
    const host = process.env.SMTP_HOST!.trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER!.trim();
    const pass = process.env.SMTP_PASS!.trim();
    const from = process.env.EMAIL_FROM?.trim() || user;
    const { text, html } = this.buildBodies(resetUrl);

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
        greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
        socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
      });

      await transporter.sendMail({
        from,
        to,
        subject: 'Reset your Task Management password',
        text,
        html,
      });
      return { sent: true };
    } catch (error) {
      console.error('Mailer: SMTP send failed', error);
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'SMTP send failed',
      };
    }
  }

  private static async sendViaResend(to: string, resetUrl: string): Promise<SendResult> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return { sent: false, error: 'RESEND_API_KEY is not set' };
    }

    const from = process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev';
    const { text, html } = this.buildBodies(resetUrl);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: 'Reset your Task Management password',
          text,
          html,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error('Mailer: Resend request failed', response.status, body);
        let message = `Resend HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(body) as { message?: string };
          if (parsed.message) message = parsed.message;
        } catch {
          /* keep default */
        }
        return { sent: false, error: message };
      }
      return { sent: true };
    } catch (error) {
      console.error('Mailer: Resend send failed', error);
      return { sent: false, error: error instanceof Error ? error.message : 'send failed' };
    }
  }

  public static async sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendResult> {
    if (this.hasSmtp()) {
      return this.sendViaSmtp(to, resetUrl);
    }
    if (process.env.RESEND_API_KEY?.trim()) {
      return this.sendViaResend(to, resetUrl);
    }
    return { sent: false, error: 'No mailer configured (set SMTP_* or RESEND_API_KEY)' };
  }

  public static buildResetUrl(rawToken: string): string {
    const appUrl = (process.env.APP_URL || env.get('CORS_ORIGIN')[0] || 'http://localhost:3000').replace(
      /\/$/,
      ''
    );
    return `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
  }
}

export default MailerUtil;
