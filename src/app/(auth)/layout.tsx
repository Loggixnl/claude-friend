import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-2xl font-bold"
      >
        <MessageCircle className="h-8 w-8" />
        <span>Let me confess</span>
      </Link>
      {children}
    </div>
  );
}
