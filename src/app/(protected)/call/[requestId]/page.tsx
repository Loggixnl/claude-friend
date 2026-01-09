import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { CallRoom } from "@/components/call/call-room";

interface CallPageProps {
  params: { requestId: string };
}

export default async function CallPage({ params }: CallPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the call request
  const { data: request } = await supabase
    .from("call_requests")
    .select("*")
    .eq("id", params.requestId)
    .single();

  if (!request) {
    notFound();
  }

  // Verify user is part of this call
  if (request.talker_id !== user.id && request.listener_id !== user.id) {
    redirect("/dashboard");
  }

  // Check request status
  if (request.status !== "accepted") {
    redirect("/dashboard");
  }

  // Get the call session
  const { data: session } = await supabase
    .from("call_sessions")
    .select("*")
    .eq("talker_id", request.talker_id)
    .eq("listener_id", request.listener_id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  // Get the other user's profile
  const otherUserId =
    request.talker_id === user.id ? request.listener_id : request.talker_id;
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", otherUserId)
    .single();

  const isTalker = request.talker_id === user.id;

  return (
    <CallRoom
      requestId={params.requestId}
      sessionId={session?.id}
      userId={user.id}
      otherUserId={otherUserId}
      otherUsername={otherProfile?.username || "User"}
      isTalker={isTalker}
    />
  );
}
