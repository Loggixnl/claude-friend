import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TalkerDashboard } from "@/components/dashboard/talker-dashboard";
import { ListenerDashboard } from "@/components/dashboard/listener-dashboard";

export default async function DashboardPage() {
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

  if (profile.role === "talker") {
    return <TalkerDashboard userId={user.id} />;
  }

  return <ListenerDashboard userId={user.id} profile={profile} />;
}
