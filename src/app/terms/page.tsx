import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service - Let me confess",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      <h1 className="mb-6 text-3xl font-bold">Terms of Service</h1>

      <div className="prose prose-gray dark:prose-invert">
        <p className="text-muted-foreground">
          Last updated: January 2024
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using Let me confess, you accept and agree to be bound
          by the terms and provision of this agreement.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Let me confess is a video chat platform that connects people who want to
          talk (Talkers) with people who want to listen (Listeners). The service
          includes a &quot;confessional filter&quot; that obscures video feeds to
          maintain anonymity.
        </p>

        <h2>3. User Conduct</h2>
        <p>Users agree not to:</p>
        <ul>
          <li>Harass, threaten, or intimidate other users</li>
          <li>Share hate speech or discriminatory content</li>
          <li>Share sexually explicit or inappropriate content</li>
          <li>Attempt to scam or defraud other users</li>
          <li>Attempt to circumvent the confessional filter</li>
          <li>Record or screenshot calls without consent</li>
          <li>Share personal identifying information of others</li>
        </ul>

        <h2>4. Account Termination</h2>
        <p>
          We reserve the right to terminate accounts that violate these terms.
          Users who receive more than 5 misconduct reports will be automatically
          banned from the platform.
        </p>

        <h2>5. Privacy</h2>
        <p>
          We respect your privacy. All video calls are peer-to-peer and not
          recorded or stored by us. See our Privacy Policy for more details.
        </p>

        <h2>6. Disclaimer</h2>
        <p>
          Let me confess is not a substitute for professional mental health
          services. If you are in crisis, please contact emergency services or a
          mental health professional.
        </p>

        <h2>7. Changes to Terms</h2>
        <p>
          We may modify these terms at any time. Continued use of the service
          constitutes acceptance of modified terms.
        </p>

        <h2>8. Contact</h2>
        <p>
          For questions about these terms, please contact us through our support
          channels.
        </p>
      </div>
    </div>
  );
}
