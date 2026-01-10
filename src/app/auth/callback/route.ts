import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Allowed redirect paths (whitelist approach)
const ALLOWED_REDIRECTS = ["/dashboard", "/settings", "/call"];

function isValidRedirectPath(path: string): boolean {
  // Must start with / and not contain protocol or double slashes
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return false;
  }

  // Check against whitelist - path must start with one of the allowed prefixes
  return ALLOWED_REDIRECTS.some((allowed) => path === allowed || path.startsWith(`${allowed}/`));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Validate redirect path to prevent open redirect attacks
  const safeRedirect = isValidRedirectPath(next) ? next : "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${safeRedirect}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
