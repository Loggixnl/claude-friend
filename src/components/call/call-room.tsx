"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWebRTC } from "@/hooks/use-webrtc";
import { ConfessionalVideo } from "./confessional-video";
import { CallControls } from "./call-controls";
import { ReportDialog } from "./report-dialog";
import { RatingDialog } from "./rating-dialog";
import { CameraRequiredWarning } from "./camera-required-warning";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { safeError } from "@/lib/security";

interface CallRoomProps {
  requestId: string;
  sessionId: string | undefined;
  userId: string;
  otherUserId: string;
  otherUsername: string;
  isTalker: boolean;
}

const CAMERA_GRACE_PERIOD = 10000; // 10 seconds

export function CallRoom({
  requestId,
  sessionId,
  userId,
  otherUserId,
  otherUsername,
  isTalker,
}: CallRoomProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showReport, setShowReport] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [showCameraWarning, setShowCameraWarning] = useState(false);
  const [cameraWarningTimeout, setCameraWarningTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const handleHangup = useCallback(async () => {
    setCallEnded(true);

    // Update session in database
    if (sessionId) {
      const supabase = createClient();
      await supabase
        .from("call_sessions")
        .update({
          ended_at: new Date().toISOString(),
          ended_reason: "hangup",
        })
        .eq("id", sessionId);
    }

    // Show rating dialog for talkers
    if (isTalker && sessionId) {
      setShowRating(true);
    } else {
      router.push("/dashboard");
    }
  }, [sessionId, isTalker, router]);

  const handleConnectionStateChange = useCallback(
    (state: RTCPeerConnectionState) => {
      if (state === "failed" || state === "disconnected") {
        toast({
          title: "Connection lost",
          description: "The call was disconnected. Returning to dashboard.",
          variant: "destructive",
        });
        setTimeout(() => {
          if (!callEnded) {
            handleHangup();
          }
        }, 2000);
      }
    },
    [toast, callEnded, handleHangup]
  );

  const handleError = useCallback(
    (error: Error) => {
      safeError("WebRTC error:", error);
      toast({
        title: "Connection error",
        description: "A connection error occurred. Please try again.",
        variant: "destructive",
      });
    },
    [toast]
  );

  const {
    localStream,
    remoteStream,
    connectionState,
    isMediaReady,
    isMuted,
    isCameraOff,
    hangup,
    toggleMute,
    toggleCamera,
  } = useWebRTC({
    requestId,
    userId,
    otherUserId,
    isTalker,
    onConnectionStateChange: handleConnectionStateChange,
    onHangup: handleHangup,
    onError: handleError,
  });

  // Handle camera disabled grace period
  useEffect(() => {
    if (isCameraOff && !cameraWarningTimeout) {
      setShowCameraWarning(true);
      const timeout = setTimeout(() => {
        toast({
          title: "Call ended",
          description:
            "Camera is required for this app. The call has been ended.",
          variant: "destructive",
        });
        hangup();
      }, CAMERA_GRACE_PERIOD);
      setCameraWarningTimeout(timeout);
    } else if (!isCameraOff && cameraWarningTimeout) {
      clearTimeout(cameraWarningTimeout);
      setCameraWarningTimeout(null);
      setShowCameraWarning(false);
    }

    return () => {
      if (cameraWarningTimeout) {
        clearTimeout(cameraWarningTimeout);
      }
    };
  }, [isCameraOff, cameraWarningTimeout, hangup, toast]);

  const handleReportSubmitted = () => {
    setShowReport(false);
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep our community safe.",
    });
  };

  const handleRatingSubmitted = () => {
    setShowRating(false);
    router.push("/dashboard");
  };

  if (!isMediaReady) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-black">
        <Spinner size="lg" />
        <p className="text-muted-foreground">Setting up your camera and microphone...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black p-[2.5%] sm:p-[5%]">
      {/* Video Grid - constrained to available space */}
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-lg">
        {/* Remote Video (main) */}
        <ConfessionalVideo
          stream={remoteStream}
          className="absolute inset-0"
          label={otherUsername}
        />

        {/* Local Video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 h-24 w-36 overflow-hidden rounded-lg border-2 border-white/20 shadow-lg sm:h-32 sm:w-48 md:h-40 md:w-56">
          <ConfessionalVideo
            stream={localStream}
            isLocal
            className="h-full w-full"
            label="You"
          />
        </div>

        {/* Connection Status */}
        {connectionState !== "connected" && (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
            {connectionState === "connecting" && "Connecting..."}
            {connectionState === "new" && "Starting call..."}
            {connectionState === "failed" && "Connection failed"}
            {connectionState === "disconnected" && "Disconnected"}
          </div>
        )}

        {/* Camera Warning */}
        {showCameraWarning && <CameraRequiredWarning />}
      </div>

      {/* Call Controls */}
      <CallControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onHangup={hangup}
        onReport={() => setShowReport(true)}
      />

      {/* Report Dialog */}
      <ReportDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        sessionId={sessionId || ""}
        reportedId={otherUserId}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* Rating Dialog (talker only) */}
      {showRating && sessionId && (
        <RatingDialog
          sessionId={sessionId}
          listenerId={otherUserId}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </div>
  );
}
