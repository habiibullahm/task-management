import env from '../config/env';

/**
 * Optional email delivery for password-reset links.
 * Uses Resend when RESEND_API_KEY is set; otherwise no-op (safe for free-tier demos).
 */
export class MailerUtil {
  public static async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return false;
    }

    const from = process.env.EMAIL_FROM || 'Task Management <onboarding@resend.dev>';

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
          subject: 'Reset your password',
          text: `Reset your password using this link (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
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
