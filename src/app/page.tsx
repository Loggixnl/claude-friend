import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageCircle, Shield, Users, Lock } from "lucide-react";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xl font-bold">Let me confess</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          A Safe Space to Be Heard
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Connect with compassionate listeners in a confidential video chat
          environment. Share your thoughts anonymously through our unique
          confessional filter.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/signup?role=talker">
            <Button size="lg" className="w-full sm:w-auto">
              I Want to Talk
            </Button>
          </Link>
          <Link href="/signup?role=listener">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              I Want to Listen
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 px-4 py-16">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Shield className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Anonymous & Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our confessional filter conceals your identity while still
                  showing you&apos;re present. Share without fear.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Verified Listeners</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with rated listeners who are genuinely here to help.
                  See their ratings before you connect.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Private Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All calls are peer-to-peer encrypted. No recordings, no
                  storage. Your conversation stays between you.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Real-Time Video</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Face-to-face connections help build trust and understanding.
                  Camera and mic required for authentic interaction.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="container mx-auto text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Connect?</h2>
          <p className="mb-8 text-muted-foreground">
            Join our community of talkers and listeners today.
          </p>
          <Link href="/signup">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>Let me confess</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/report-abuse" className="hover:underline">
              Report Abuse
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
