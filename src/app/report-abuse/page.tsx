import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Shield, AlertTriangle, Flag } from "lucide-react";

export const metadata = {
  title: "Report Abuse - Claud Friend",
};

export default function ReportAbusePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      <h1 className="mb-6 text-3xl font-bold">Report Abuse</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Our Commitment to Safety
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Claud Friend is committed to maintaining a safe and supportive
              environment for all users. We take all reports of abuse seriously
              and investigate each one thoroughly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              How to Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You can report abuse in the following ways:
            </p>
            <ul className="ml-4 list-disc space-y-2 text-muted-foreground">
              <li>
                <strong>During a call:</strong> Click the report button in the
                call controls
              </li>
              <li>
                <strong>After a call:</strong> Use the report option that
                appears after the call ends
              </li>
            </ul>
            <p className="text-muted-foreground">
              When reporting, please select the most appropriate category and
              provide any additional context that might help us understand the
              situation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              What Happens After a Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              When you submit a report:
            </p>
            <ol className="ml-4 list-decimal space-y-2 text-muted-foreground">
              <li>
                Your report is logged securely in our system
              </li>
              <li>
                Our team reviews the report and any related information
              </li>
              <li>
                Appropriate action is taken based on our community guidelines
              </li>
              <li>
                Users who accumulate more than 5 reports are automatically
                banned from the platform
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Types of Reportable Behavior</CardTitle>
            <CardDescription>
              The following behaviors violate our community guidelines:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="ml-4 list-disc space-y-2 text-muted-foreground">
              <li>
                <strong>Harassment:</strong> Bullying, intimidation, or
                persistent unwanted contact
              </li>
              <li>
                <strong>Hate Speech:</strong> Discrimination based on race,
                gender, sexuality, religion, or other protected characteristics
              </li>
              <li>
                <strong>Sexual Content:</strong> Inappropriate sexual behavior,
                nudity, or solicitation
              </li>
              <li>
                <strong>Scams:</strong> Attempts to defraud or manipulate users
                for financial gain
              </li>
              <li>
                <strong>Other Violations:</strong> Any other behavior that
                violates our terms of service
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">
              Emergency Situations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you or someone else is in immediate danger, please contact
              emergency services in your area immediately. Claud Friend is not
              equipped to handle emergency situations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
