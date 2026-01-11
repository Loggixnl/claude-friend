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
import {
  MessageCircle,
  Shield,
  Users,
  Lock,
  Heart,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { AnonymityDemo } from "@/components/landing/anonymity-demo";

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
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
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
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-16 text-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span>100% Anonymous Video Conversations</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Share Your Truth,
            <br />
            <span className="text-primary">Stay Anonymous</span>
          </h1>

          <p className="mb-10 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
            A safe space for real conversations. Connect with compassionate listeners
            through our unique confessional filter that protects your identity while
            keeping the human connection alive.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup?role=talker">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                <Heart className="mr-2 h-5 w-5" />
                I Need to Talk
              </Button>
            </Link>
            <Link href="/signup?role=listener">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                <Users className="mr-2 h-5 w-5" />
                I Want to Listen
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Anonymity Demo Section */}
      <section className="px-4 py-20 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 sm:text-4xl">
              See How Anonymous You Can Be
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our confessional filter uses advanced pixelation and a diamond lattice overlay
              to completely obscure your identity while still showing you&apos;re a real person.
            </p>
          </div>

          <AnonymityDemo />

          <div className="mt-12 grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            <div className="flex items-start gap-3 text-left">
              <div className="rounded-full bg-primary/10 p-2">
                <EyeOff className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Face Unrecognizable</h3>
                <p className="text-sm text-muted-foreground">
                  Pixelation ensures your facial features cannot be identified
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="rounded-full bg-primary/10 p-2">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Human Presence</h3>
                <p className="text-sm text-muted-foreground">
                  The listener can still see you&apos;re there and engaged
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="rounded-full bg-primary/10 p-2">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Always On</h3>
                <p className="text-sm text-muted-foreground">
                  The filter cannot be disabled during calls
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
            How It Works
          </h2>
          <p className="mb-12 text-center text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to start your anonymous conversation
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative">
              <div className="absolute -left-4 top-0 text-8xl font-bold text-muted/20">1</div>
              <Card className="relative h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Choose Your Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Sign up as a <strong>Talker</strong> if you need someone to listen,
                    or as a <strong>Listener</strong> if you want to help others.
                    Both roles are equally important.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-0 text-8xl font-bold text-muted/20">2</div>
              <Card className="relative h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Find a Match
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Talkers browse available listeners, check their ratings and language,
                    then send a brief description of what they want to discuss.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-0 text-8xl font-bold text-muted/20">3</div>
              <Card className="relative h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Talk Anonymously
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Once connected, both parties see each other through the confessional
                    filter. Have an honest conversation without fear of being recognized.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
            Built for Safety & Trust
          </h2>
          <p className="mb-12 text-center text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature is designed with your privacy and wellbeing in mind
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none bg-background/60">
              <CardHeader>
                <Shield className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>End-to-End Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Peer-to-peer video calls. Nothing is recorded or stored on our servers.
                  Your conversation stays between you.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-none bg-background/60">
              <CardHeader>
                <Users className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Rated Listeners</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Every listener has a public rating from previous conversations.
                  Choose someone you feel comfortable with.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-none bg-background/60">
              <CardHeader>
                <Lock className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Report System</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  If someone behaves inappropriately, report them instantly.
                  Repeat offenders are automatically banned.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-none bg-background/60">
              <CardHeader>
                <Heart className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Favorites</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Found a great listener? Add them to your favorites for easy
                  access next time you need to talk.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
            What Can You Talk About?
          </h2>
          <p className="mb-12 text-center text-lg text-muted-foreground">
            Anything that&apos;s on your mind. Here are some examples:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Work stress and career challenges",
              "Relationship difficulties",
              "Loneliness and isolation",
              "Family issues",
              "Life transitions and changes",
              "Anxiety and overwhelming feelings",
              "Decisions you need to make",
              "Things you can't tell anyone else",
            ].map((topic, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg border bg-background">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{topic}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <strong>Note:</strong> This platform is not a substitute for professional mental health services.
            If you&apos;re in crisis, please contact emergency services or a crisis helpline.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Ready to Share Your Truth?
          </h2>
          <p className="mb-8 text-lg opacity-90">
            Join thousands of people who have found relief in anonymous, judgment-free conversations.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup?role=talker">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8">
                Start Talking
              </Button>
            </Link>
            <Link href="/signup?role=listener">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Become a Listener
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Let me confess</span>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/report-abuse" className="hover:text-foreground transition-colors">
                Report Abuse
              </Link>
            </nav>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>A safe space for anonymous conversations.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
