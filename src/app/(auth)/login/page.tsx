"use client";

import { useState } from "react";
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
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { isRateLimited } from "@/lib/security";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState("");

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResend(false);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<LoginFormData> = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0] as keyof LoginFormData;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    // Rate limit: 5 login attempts per 15 minutes per email
    const rateLimitKey = `login:${formData.email.toLowerCase()}`;
    if (isRateLimited(rateLimitKey, { maxRequests: 5, windowMs: 900000 })) {
      toast({
        title: "Too many login attempts",
        description: "Please wait 15 minutes before trying again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      // Use generic error message to prevent user enumeration
      // Only differentiate for email confirmation to help legitimate users
      if (error.message.includes("Email not confirmed")) {
        setEmail(formData.email);
        setShowResend(true);
        toast({
          title: "Email not confirmed",
          description:
            "Please check your email for the confirmation link or resend it below.",
          variant: "destructive",
        });
      } else {
        // Generic message for all other errors (invalid credentials, user not found, etc.)
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
      return;
    }

    // Check if user is banned
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("banned")
        .eq("id", user.id)
        .single();

      if (profile?.banned) {
        await supabase.auth.signOut();
        toast({
          title: "Account suspended",
          description:
            "Your account has been suspended due to policy violations.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    toast({
      title: "Welcome back!",
      description: "You have been logged in successfully.",
    });

    router.push("/dashboard");
    router.refresh();
  };

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Confirmation email sent",
        description: "Please check your inbox for the confirmation link.",
      });
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
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
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {showResend && (
            <div className="rounded-md bg-muted p-4">
              <p className="mb-2 text-sm">
                Didn&apos;t receive the confirmation email?
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendConfirmation}
                disabled={isLoading}
              >
                Resend Confirmation Email
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Sign In
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
