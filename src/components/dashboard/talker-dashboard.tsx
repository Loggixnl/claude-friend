"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ListenerCard } from "./listener-card";
import { ConnectDialog } from "./connect-dialog";
import { RingingDialog } from "./ringing-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { sortListeners } from "@/lib/sorting";
import type { ListenerWithProfile, CallRequest } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface TalkerDashboardProps {
  userId: string;
}

export function TalkerDashboard({ userId }: TalkerDashboardProps) {
  const [listeners, setListeners] = useState<ListenerWithProfile[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListener, setSelectedListener] =
    useState<ListenerWithProfile | null>(null);
  const [activeRequest, setActiveRequest] = useState<CallRequest | null>(null);
  const { toast } = useToast();

  const fetchListeners = useCallback(async () => {
    const supabase = createClient();

    // Fetch all listener profiles with their presence
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "listener")
      .eq("banned", false);

    if (profilesError) {
      toast({
        title: "Error loading listeners",
        description: profilesError.message,
        variant: "destructive",
      });
      return;
    }

    // Fetch listener presence - only for non-banned listeners we're displaying
    const listenerIds = (profiles || []).map((p) => p.id);
    const { data: presenceData } = await supabase
      .from("listener_presence")
      .select("*")
      .in("user_id", listenerIds);

    const presenceMap = new Map(
      presenceData?.map((p) => [p.user_id, p]) || []
    );

    // Fetch favorites
    const { data: favoritesData } = await supabase
      .from("favorites")
      .select("listener_id")
      .eq("talker_id", userId);

    const favoriteIds = new Set(favoritesData?.map((f) => f.listener_id) || []);
    setFavorites(favoriteIds);

    // Combine data
    const listenersWithStatus: ListenerWithProfile[] = (profiles || []).map(
      (profile) => {
        const presence = presenceMap.get(profile.id);
        return {
          ...profile,
          status: presence?.status || "inactive",
          isFavorite: favoriteIds.has(profile.id),
          isActivating:
            presence?.activation_until &&
            new Date(presence.activation_until) > new Date(),
          activationUntil: presence?.activation_until,
        };
      }
    );

    // Sort listeners according to rules
    const sorted = sortListeners(listenersWithStatus);
    setListeners(sorted);
    setIsLoading(false);
  }, [userId, toast]);

  useEffect(() => {
    fetchListeners();

    // Subscribe to realtime updates
    const supabase = createClient();
    let presenceChannel: RealtimeChannel | null = null;
    let requestsChannel: RealtimeChannel | null = null;

    const setupSubscriptions = () => {
      // Listen for presence changes
      presenceChannel = supabase
        .channel("listener-presence-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "listener_presence",
          },
          () => {
            fetchListeners();
          }
        )
        .subscribe();

      // Listen for call request updates (for this talker)
      requestsChannel = supabase
        .channel("talker-call-requests")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "call_requests",
            filter: `talker_id=eq.${userId}`,
          },
          (payload) => {
            const request = payload.new as CallRequest;
            if (request.status === "accepted") {
              // Navigate to call page
              window.location.href = `/call/${request.id}`;
            } else if (
              request.status === "denied" ||
              request.status === "timeout"
            ) {
              setActiveRequest(null);
              toast({
                title:
                  request.status === "denied"
                    ? "Request declined"
                    : "Request timed out",
                description:
                  request.status === "denied"
                    ? "The listener declined your request. Try another listener."
                    : "The listener didn't respond in time. Try again or choose another listener.",
              });
              fetchListeners();
            }
          }
        )
        .subscribe();
    };

    setupSubscriptions();

    return () => {
      if (presenceChannel) supabase.removeChannel(presenceChannel);
      if (requestsChannel) supabase.removeChannel(requestsChannel);
    };
  }, [userId, fetchListeners, toast]);

  const handleToggleFavorite = async (listenerId: string) => {
    const supabase = createClient();
    const isFavorite = favorites.has(listenerId);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("talker_id", userId)
        .eq("listener_id", listenerId);

      if (!error) {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(listenerId);
          return next;
        });
        setListeners((prev) =>
          sortListeners(
            prev.map((l) =>
              l.id === listenerId ? { ...l, isFavorite: false } : l
            )
          )
        );
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ talker_id: userId, listener_id: listenerId });

      if (!error) {
        setFavorites((prev) => new Set([...prev, listenerId]));
        setListeners((prev) =>
          sortListeners(
            prev.map((l) =>
              l.id === listenerId ? { ...l, isFavorite: true } : l
            )
          )
        );
      }
    }
  };

  const handleConnect = (listener: ListenerWithProfile) => {
    setSelectedListener(listener);
  };

  const handleSendRequest = async (description: string) => {
    if (!selectedListener) return;

    const supabase = createClient();
    const expiresAt = new Date(Date.now() + 30000).toISOString(); // 30 seconds

    const { data, error } = await supabase
      .from("call_requests")
      .insert({
        talker_id: userId,
        listener_id: selectedListener.id,
        description,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSelectedListener(null);
    setActiveRequest(data);
  };

  const handleCancelRequest = async () => {
    if (!activeRequest) return;

    const supabase = createClient();
    await supabase
      .from("call_requests")
      .update({ status: "canceled" })
      .eq("id", activeRequest.id);

    setActiveRequest(null);
    toast({
      title: "Request canceled",
      description: "You canceled the connection request.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find a Listener</h1>
        <p className="text-muted-foreground">
          Choose someone to share your thoughts with
        </p>
      </div>

      {listeners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-2 text-lg font-medium">No listeners available</p>
          <p className="text-muted-foreground">
            Check back later when listeners are online
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listeners.map((listener) => (
            <ListenerCard
              key={listener.id}
              listener={listener}
              onConnect={() => handleConnect(listener)}
              onToggleFavorite={() => handleToggleFavorite(listener.id)}
            />
          ))}
        </div>
      )}

      <ConnectDialog
        listener={selectedListener}
        onClose={() => setSelectedListener(null)}
        onSendRequest={handleSendRequest}
      />

      <RingingDialog
        request={activeRequest}
        onCancel={handleCancelRequest}
      />
    </div>
  );
}
