import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.banned) {
    await supabase.auth.signOut();
    redirect("/login?error=banned");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader profile={profile} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
