"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { passwordSchema } from "@/lib/validations";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // User should have a session from the recovery link
      if (session) {
        setIsValidSession(true);
      }
      setIsCheckingSession(false);
    };

    checkSession();

    // Listen for auth state changes (recovery link click)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
        setIsCheckingSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validate password
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setErrors({ password: passwordResult.error.issues[0].message });
      setIsLoading(false);
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    toast({
      title: "Password updated",
      description: "Your password has been successfully reset.",
    });

    // Redirect to dashboard after a moment
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  if (isCheckingSession) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (!isValidSession) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Invalid or Expired Link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Password reset links expire after 1 hour for security reasons.
            Please request a new link.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request New Link</Link>
          </Button>
          <Link href="/login" className="text-center text-sm text-primary hover:underline">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Password Reset Complete</CardTitle>
          <CardDescription>
            Your password has been successfully updated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Redirecting you to the dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={isLoading}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Password must be at least 12 characters with uppercase, lowercase, number, and special character.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Reset Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
