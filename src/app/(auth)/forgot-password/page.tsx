"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { isRateLimited } from "@/lib/security";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic email validation
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // Rate limit: 3 password reset requests per hour per email
    const rateLimitKey = `password-reset:${email.toLowerCase()}`;
    if (isRateLimited(rateLimitKey, { maxRequests: 3, windowMs: 3600000 })) {
      toast({
        title: "Too many requests",
        description: "Please wait before requesting another password reset.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (resetError) {
      // Don't reveal if email exists or not for security
      // Always show success message
      console.error("Password reset error:", resetError);
    }

    // Always show success to prevent email enumeration
    setEmailSent(true);
    toast({
      title: "Check your email",
      description: "If an account exists with this email, you'll receive a password reset link.",
    });
    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            If you don&apos;t see the email, check your spam folder. The link will expire in 1 hour.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setEmailSent(false)}
          >
            Try a different email
          </Button>
          <Link href="/login" className="text-center text-sm text-primary hover:underline">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              aria-invalid={!!error}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Send Reset Link
          </Button>
          <Link href="/login" className="text-center text-sm text-primary hover:underline">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
