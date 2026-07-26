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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await authService.forgotPassword(email);
      setSubmitted(true);
      toast.success(result.message);
      if (result.resetToken) {
        // Dev/test only — helps local reset without email
        toast.message('Dev reset token available — open Reset password with the link from the API log.');
      }
    } catch (error) {
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
              <p className="text-sm text-muted-foreground text-center">
                If an account exists for that email, password reset instructions have been sent. Check your
                inbox, then use the link to choose a new password.
              </p>
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
