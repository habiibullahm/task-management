import env from '../config/env';

/**
 * Password-reset email via Resend when RESEND_API_KEY is set.
 * Without a key, returns false so callers can log the link in development.
 */
export class MailerUtil {
  public static isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY?.trim());
  }

  public static async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return false;
    }

    const from = process.env.EMAIL_FROM?.trim() || 'Task Management <onboarding@resend.dev>';

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
        console.error('Mailer: Resend request failed', response.status, await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error('Mailer: failed to send reset email', error);
      return false;
    }
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
