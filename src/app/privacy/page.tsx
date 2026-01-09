import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - Claud Friend",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>

      <div className="prose prose-gray dark:prose-invert">
        <p className="text-muted-foreground">
          Last updated: January 2024
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect the following information:</p>
        <ul>
          <li>
            <strong>Account Information:</strong> Username, email address, and
            hashed password
          </li>
          <li>
            <strong>Profile Information:</strong> Role (talker/listener),
            preferred language
          </li>
          <li>
            <strong>Usage Data:</strong> Ratings, call session metadata (start
            time, end time, duration)
          </li>
          <li>
            <strong>Reports:</strong> Misconduct reports submitted by users
          </li>
        </ul>

        <h2>2. Information We Don&apos;t Collect</h2>
        <p>
          We do <strong>not</strong> collect, record, or store:
        </p>
        <ul>
          <li>Video or audio content from calls</li>
          <li>The content of confession descriptions (stored only temporarily)</li>
          <li>Your real identity (we only use usernames)</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and maintain the service</li>
          <li>Match talkers with listeners</li>
          <li>Calculate and display listener ratings</li>
          <li>Enforce our community guidelines</li>
          <li>Investigate reports of misconduct</li>
        </ul>

        <h2>4. Peer-to-Peer Communication</h2>
        <p>
          All video and audio communications are peer-to-peer using WebRTC. This
          means:
        </p>
        <ul>
          <li>
            Video and audio data flow directly between users, not through our
            servers
          </li>
          <li>We cannot see, hear, or record your conversations</li>
          <li>
            The &quot;confessional filter&quot; is applied locally on your device
          </li>
        </ul>

        <h2>5. Data Security</h2>
        <p>
          We implement industry-standard security measures including:
        </p>
        <ul>
          <li>Encrypted data transmission (HTTPS)</li>
          <li>Secure password hashing</li>
          <li>Row-level security in our database</li>
          <li>Regular security audits</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>
          We retain your account information as long as your account is active.
          You may request deletion of your account at any time.
        </p>

        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Delete your account and data</li>
          <li>Export your data</li>
        </ul>

        <h2>8. Contact</h2>
        <p>
          For privacy-related questions, please contact us through our support
          channels.
        </p>
      </div>
    </div>
  );
}
