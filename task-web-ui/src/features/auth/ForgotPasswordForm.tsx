import { useState } from 'react';
import { Link } from 'react-router-dom';
import { handleApiError } from '@/services/api';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // #region agent log
    const __dbgStarted = Date.now();
    fetch('http://127.0.0.1:7355/ingest/ccefaceb-6e3b-4191-bb20-389c82942a55', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd7a94c' },
        body: JSON.stringify({
          sessionId: 'd7a94c',
          runId: 'post-fix',
          hypothesisId: 'A',
          location: 'ForgotPasswordForm.tsx:submit',
          message: 'forgot-password submit started',
          data: { apiBase: import.meta.env.VITE_API_BASE_URL || 'default' },
          timestamp: Date.now(),
        }),
    }).catch(() => {});
    // #endregion
    try {
      const result = await authService.forgotPassword(email);
      // #region agent log
      fetch('http://127.0.0.1:7355/ingest/ccefaceb-6e3b-4191-bb20-389c82942a55', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd7a94c' },
        body: JSON.stringify({
          sessionId: 'd7a94c',
          runId: 'post-fix',
          hypothesisId: 'A',
          location: 'ForgotPasswordForm.tsx:success',
          message: 'forgot-password succeeded',
          data: {
            elapsedMs: Date.now() - __dbgStarted,
            emailSent: result.emailSent === true,
            hasDevResetUrl: Boolean(result.devResetUrl),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setSubmitted(true);
      if (result.devResetUrl) {
        setDevResetUrl(result.devResetUrl);
        setEmailError(result.emailError ?? null);
        toast.message(
          result.emailError
            ? `Email failed: ${result.emailError}`
            : 'Email not configured — use the local reset link below'
        );
      } else if (result.emailSent) {
        toast.success('Check your inbox for the reset link');
      } else {
        toast.success(result.message);
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7355/ingest/ccefaceb-6e3b-4191-bb20-389c82942a55', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd7a94c' },
        body: JSON.stringify({
          sessionId: 'd7a94c',
          runId: 'post-fix',
          hypothesisId: 'A',
          location: 'ForgotPasswordForm.tsx:catch',
          message: 'forgot-password failed',
          data: {
            elapsedMs: Date.now() - __dbgStarted,
            errorName: error instanceof Error ? error.name : typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
            looksLikeAxiosTimeout:
              error instanceof Error && /timeout of \d+ms exceeded/i.test(error.message),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      toast.error(handleApiError(error, 'Unable to process password reset'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot password</CardTitle>
          <CardDescription className="text-center">
            Enter your email and we will send reset instructions if an account exists.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {submitted ? (
              <div className="space-y-3 text-sm text-muted-foreground text-center">
                <p>
                  If an account exists for that email, password reset instructions have been sent. Check your
                  inbox, then use the link to choose a new password.
                </p>
                {devResetUrl && (
                  <div className="rounded-md border bg-amber-50 p-3 text-left text-amber-950">
                    <p className="mb-2 font-medium">Local testing — email was not sent</p>
                    {emailError && (
                      <p className="mb-2 text-xs">
                        Mailer error: <span className="font-mono">{emailError}</span>
                      </p>
                    )}
                    <a href={devResetUrl} className="break-all text-primary underline">
                      {devResetUrl}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {!submitted && (
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset instructions'}
              </Button>
            )}
            <p className="text-sm text-center text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
