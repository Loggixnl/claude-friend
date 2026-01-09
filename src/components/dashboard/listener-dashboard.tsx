"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { IncomingCallDialog } from "./incoming-call-dialog";
import { useToast } from "@/hooks/use-toast";
import { getDenyWarning, isDenyDisabled } from "@/lib/sorting";
import { Headphones, Clock } from "lucide-react";
import type { Profile, CallRequest, ListenerPresence } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ListenerDashboardProps {
  userId: string;
  profile: Profile;
}

const ACTIVATION_DELAY = 30; // seconds

export function ListenerDashboard({ userId, profile }: ListenerDashboardProps) {
  const [presence, setPresence] = useState<ListenerPresence | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationProgress, setActivationProgress] = useState(0);
  const [activationTimeLeft, setActivationTimeLeft] = useState(0);
  const [incomingRequest, setIncomingRequest] = useState<CallRequest | null>(
    null
  );
  const [talkerUsername, setTalkerUsername] = useState("");
  const { toast } = useToast();

  const fetchPresence = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("listener_presence")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setPresence(data);

      // Check if currently in activation countdown
      if (data.activation_until) {
        const until = new Date(data.activation_until).getTime();
        if (until > Date.now()) {
          setIsActivating(true);
        } else {
          setIsActivating(false);
        }
      }
    } else {
      // Create initial presence record
      const { data: newPresence, error } = await supabase
        .from("listener_presence")
        .insert({ user_id: userId, status: "inactive" })
        .select()
        .single();

      if (!error && newPresence) {
        setPresence(newPresence);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchPresence();

    // Subscribe to call requests for this listener
    const supabase = createClient();
    let requestsChannel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      requestsChannel = supabase
        .channel("listener-call-requests")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "call_requests",
            filter: `listener_id=eq.${userId}`,
          },
          async (payload) => {
            const request = payload.new as CallRequest;
            if (request.status === "ringing") {
              // Fetch talker username
              const { data: talkerProfile } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", request.talker_id)
                .single();

              setTalkerUsername(talkerProfile?.username || "Someone");
              setIncomingRequest(request);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "call_requests",
            filter: `listener_id=eq.${userId}`,
          },
          (payload) => {
            const request = payload.new as CallRequest;
            if (request.status !== "ringing") {
              // Request was canceled or already handled
              setIncomingRequest(null);
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (requestsChannel) supabase.removeChannel(requestsChannel);
    };
  }, [userId, fetchPresence]);

  // Handle activation countdown
  useEffect(() => {
    if (!presence?.activation_until) {
      setIsActivating(false);
      setActivationProgress(0);
      return;
    }

    const until = new Date(presence.activation_until).getTime();
    const startTime = until - ACTIVATION_DELAY * 1000;

    const updateProgress = () => {
      const now = Date.now();
      if (now >= until) {
        setIsActivating(false);
        setActivationProgress(100);
        fetchPresence(); // Refresh to get updated status
        return;
      }

      const elapsed = now - startTime;
      const total = ACTIVATION_DELAY * 1000;
      const percent = Math.min(100, (elapsed / total) * 100);
      const remaining = Math.ceil((until - now) / 1000);

      setActivationProgress(percent);
      setActivationTimeLeft(remaining);
      setIsActivating(true);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 100);

    return () => clearInterval(interval);
  }, [presence?.activation_until, fetchPresence]);

  const handleToggleActive = async () => {
    const supabase = createClient();

    if (presence?.status === "active") {
      // Go inactive immediately
      const { error } = await supabase
        .from("listener_presence")
        .update({
          status: "inactive",
          activation_until: null,
        })
        .eq("user_id", userId);

      if (!error) {
        setPresence((prev) =>
          prev ? { ...prev, status: "inactive", activation_until: null } : null
        );
        toast({
          title: "Status updated",
          description: "You are now inactive and won't receive requests.",
        });
      }
    } else {
      // Start activation countdown
      const activationUntil = new Date(
        Date.now() + ACTIVATION_DELAY * 1000
      ).toISOString();

      const { error } = await supabase
        .from("listener_presence")
        .update({
          activation_until: activationUntil,
        })
        .eq("user_id", userId);

      if (!error) {
        setPresence((prev) =>
          prev ? { ...prev, activation_until: activationUntil } : null
        );
        setIsActivating(true);

        // Set up completion handler
        setTimeout(async () => {
          const { error: updateError } = await supabase
            .from("listener_presence")
            .update({
              status: "active",
              activation_until: null,
              last_active_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (!updateError) {
            setPresence((prev) =>
              prev
                ? { ...prev, status: "active", activation_until: null }
                : null
            );
            toast({
              title: "You're now active!",
              description: "Talkers can now send you connection requests.",
            });
          }
        }, ACTIVATION_DELAY * 1000);
      }
    }
  };

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;

    const supabase = createClient();

    // Update request status
    const { error: requestError } = await supabase
      .from("call_requests")
      .update({ status: "accepted" })
      .eq("id", incomingRequest.id);

    if (requestError) {
      toast({
        title: "Failed to accept",
        description: requestError.message,
        variant: "destructive",
      });
      return;
    }

    // Create call session
    const { error: sessionError } = await supabase
      .from("call_sessions")
      .insert({
        talker_id: incomingRequest.talker_id,
        listener_id: userId,
      });

    if (sessionError) {
      toast({
        title: "Failed to create session",
        description: sessionError.message,
        variant: "destructive",
      });
      return;
    }

    // Navigate to call
    window.location.href = `/call/${incomingRequest.id}`;
  };

  const handleDenyRequest = async () => {
    if (!incomingRequest || !presence) return;

    const supabase = createClient();
    const newDenyCount = presence.session_denies + 1;

    // Update request status
    await supabase
      .from("call_requests")
      .update({ status: "denied" })
      .eq("id", incomingRequest.id);

    // Update deny count
    await supabase
      .from("listener_presence")
      .update({ session_denies: newDenyCount })
      .eq("user_id", userId);

    setPresence((prev) =>
      prev ? { ...prev, session_denies: newDenyCount } : null
    );
    setIncomingRequest(null);

    const warning = getDenyWarning(newDenyCount);
    if (warning) {
      toast({
        title: "Warning",
        description: warning,
        variant: "destructive",
      });
    }
  };

  const handleRequestTimeout = async () => {
    if (!incomingRequest) return;

    const supabase = createClient();

    // Update request status
    await supabase
      .from("call_requests")
      .update({ status: "timeout" })
      .eq("id", incomingRequest.id);

    // Set listener to inactive (timeout doesn't count as deny)
    await supabase
      .from("listener_presence")
      .update({ status: "inactive", activation_until: null })
      .eq("user_id", userId);

    setPresence((prev) =>
      prev ? { ...prev, status: "inactive", activation_until: null } : null
    );
    setIncomingRequest(null);

    toast({
      title: "Request timed out",
      description:
        "You've been set to inactive. Toggle back to active when you're ready.",
    });
  };

  const isActive = presence?.status === "active";
  const denyDisabled = isDenyDisabled(presence?.session_denies || 0);
  const denyWarning = getDenyWarning(presence?.session_denies || 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Listener Dashboard</h1>
        <p className="text-muted-foreground">
          Help others by being available to listen
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Your Status
            </CardTitle>
            <CardDescription>
              Toggle your availability to receive connection requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="active-toggle" className="text-base">
                  Available to Listen
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isActive
                    ? "Talkers can connect with you"
                    : "You won't receive requests"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isActive ? "success" : "secondary"}>
                  {isActive ? "Active" : isActivating ? "Activating" : "Inactive"}
                </Badge>
                <Switch
                  id="active-toggle"
                  checked={isActive}
                  onCheckedChange={handleToggleActive}
                  disabled={isActivating}
                />
              </div>
            </div>

            {isActivating && (
              <div className="space-y-2 rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Activating in {activationTimeLeft}s
                  </span>
                </div>
                <Progress value={activationProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  This delay helps prevent rapid on/off toggling
                </p>
              </div>
            )}

            {denyWarning && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                {denyWarning}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
            <CardDescription>
              How you&apos;re doing as a listener
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {profile.rating_avg.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{profile.rating_count}</p>
                <p className="text-sm text-muted-foreground">Total Ratings</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {presence?.session_denies || 0}/3
                </p>
                <p className="text-sm text-muted-foreground">
                  Denies This Session
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{profile.reports_count}</p>
                <p className="text-sm text-muted-foreground">Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waiting State */}
        {isActive && !incomingRequest && (
          <Card className="md:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Headphones className="h-8 w-8 animate-pulse text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Waiting for connections...
              </h3>
              <p className="text-muted-foreground">
                You&apos;ll be notified when someone wants to talk
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <IncomingCallDialog
        request={incomingRequest}
        talkerUsername={talkerUsername}
        onAccept={handleAcceptRequest}
        onDeny={handleDenyRequest}
        onTimeout={handleRequestTimeout}
        denyDisabled={denyDisabled}
      />
    </div>
  );
}
