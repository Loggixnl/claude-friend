"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  generateSignalSignature,
  verifySignalSignature,
  safeError,
} from "@/lib/security";

interface UseWebRTCOptions {
  requestId: string;
  userId: string;
  otherUserId: string;
  isTalker: boolean;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
  onHangup?: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    ...(process.env.NEXT_PUBLIC_TURN_URL
      ? [
          {
            urls: process.env.NEXT_PUBLIC_TURN_URL,
            username: process.env.NEXT_PUBLIC_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_TURN_PASSWORD,
          },
        ]
      : []),
  ],
};

export function useWebRTC({
  requestId,
  userId,
  otherUserId,
  isTalker,
  onConnectionStateChange,
  onRemoteStream,
  onError,
  onHangup,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // Use refs for mutable state that shouldn't trigger re-renders
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const isCleanedUpRef = useRef(false);
  const otherReadyRef = useRef(false);
  const hasCreatedOfferRef = useRef(false);

  // Store callbacks in refs
  const onErrorRef = useRef(onError);
  const onHangupRef = useRef(onHangup);
  const onConnectionStateChangeRef = useRef(onConnectionStateChange);
  const onRemoteStreamRef = useRef(onRemoteStream);

  useEffect(() => {
    onErrorRef.current = onError;
    onHangupRef.current = onHangup;
    onConnectionStateChangeRef.current = onConnectionStateChange;
    onRemoteStreamRef.current = onRemoteStream;
  }, [onError, onHangup, onConnectionStateChange, onRemoteStream]);

  const hangup = useCallback(async () => {
    console.log("[WebRTC] hangup called, isCleanedUp:", isCleanedUpRef.current);
    if (isCleanedUpRef.current) return;
    isCleanedUpRef.current = true;

    // Send hangup signal
    if (channelRef.current) {
      try {
        await channelRef.current.send({
          type: "broadcast",
          event: "webrtc_signal",
          payload: { type: "hangup", from: userId },
        });
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        safeError("Error sending hangup:", e);
      }
    }

    // Cleanup
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();

    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("closed");

    onHangupRef.current?.();
  }, [userId]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  useEffect(() => {
    console.log("[WebRTC] useEffect starting, requestId:", requestId, "userId:", userId, "isTalker:", isTalker);

    // Reset all refs for fresh start
    isCleanedUpRef.current = false;
    otherReadyRef.current = false;
    hasCreatedOfferRef.current = false;
    iceCandidatesQueue.current = [];
    remoteStreamRef.current = null;

    const supabase = createClient();
    const channelName = `call:${requestId}`;

    let pc: RTCPeerConnection | null = null;

    const createOffer = async () => {
      if (!pc || pc.signalingState === "closed" || hasCreatedOfferRef.current) {
        console.log("[WebRTC] Skipping createOffer - pc:", !!pc, "signalingState:", pc?.signalingState, "hasCreatedOffer:", hasCreatedOfferRef.current);
        return;
      }

      hasCreatedOfferRef.current = true;
      console.log("[WebRTC] Creating offer...");

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const timestamp = Date.now();
        const signature = generateSignalSignature(userId, requestId, timestamp);

        console.log("[WebRTC] Sending offer via channel");
        channelRef.current?.send({
          type: "broadcast",
          event: "webrtc_signal",
          payload: { type: "offer", sdp: offer, from: userId, timestamp, signature },
        });
      } catch (error) {
        console.error("[WebRTC] Error creating offer:", error);
        hasCreatedOfferRef.current = false; // Allow retry
        onErrorRef.current?.(error as Error);
      }
    };

    const handleSignal = async (data: {
      type: string;
      sdp?: RTCSessionDescriptionInit;
      candidate?: RTCIceCandidateInit;
      from: string;
      timestamp?: number;
      signature?: string;
    }) => {
      console.log("[WebRTC] handleSignal:", data.type, "from:", data.from, "isCleanedUp:", isCleanedUpRef.current);

      if (data.from === userId || isCleanedUpRef.current) {
        console.log("[WebRTC] Ignoring signal - same user or cleaned up");
        return;
      }

      // Verify signature for offer/answer/ice_candidate messages
      if (
        data.type !== "ready" &&
        data.type !== "hangup" &&
        data.timestamp &&
        data.signature
      ) {
        if (!verifySignalSignature(data.from, requestId, data.timestamp, data.signature)) {
          console.error("[WebRTC] Invalid signal signature, ignoring message");
          return;
        }
      }

      try {
        if (data.type === "ready") {
          console.log("[WebRTC] Other party ready, isTalker:", isTalker);
          otherReadyRef.current = true;
          // If we're talker, create offer
          if (isTalker && pc && pc.signalingState === "stable") {
            await createOffer();
          }
        } else if (data.type === "offer" && pc) {
          console.log("[WebRTC] Received offer, signalingState:", pc.signalingState);
          if (pc.signalingState === "closed") return;

          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp!));
          console.log("[WebRTC] Set remote description (offer), processing", iceCandidatesQueue.current.length, "queued candidates");

          // Process queued candidates
          for (const candidate of iceCandidatesQueue.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          iceCandidatesQueue.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const answerTimestamp = Date.now();
          const answerSignature = generateSignalSignature(userId, requestId, answerTimestamp);

          console.log("[WebRTC] Sending answer");
          channelRef.current?.send({
            type: "broadcast",
            event: "webrtc_signal",
            payload: { type: "answer", sdp: answer, from: userId, timestamp: answerTimestamp, signature: answerSignature },
          });
        } else if (data.type === "answer" && pc) {
          console.log("[WebRTC] Received answer, signalingState:", pc.signalingState);
          if (pc.signalingState === "closed") return;

          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp!));
          console.log("[WebRTC] Set remote description (answer), processing", iceCandidatesQueue.current.length, "queued candidates");

          // Process queued candidates
          for (const candidate of iceCandidatesQueue.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          iceCandidatesQueue.current = [];
        } else if (data.type === "ice_candidate" && data.candidate) {
          console.log("[WebRTC] Received ICE candidate");
          if (pc && pc.remoteDescription && pc.signalingState !== "closed") {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else {
            console.log("[WebRTC] Queueing ICE candidate (no remote description yet)");
            iceCandidatesQueue.current.push(data.candidate);
          }
        } else if (data.type === "hangup") {
          console.log("[WebRTC] Received hangup from other party");
          localStreamRef.current?.getTracks().forEach((track) => track.stop());
          pc?.close();
          setLocalStream(null);
          setRemoteStream(null);
          setConnectionState("closed");
          isCleanedUpRef.current = true;
          onHangupRef.current?.();
        }
      } catch (error) {
        console.error("[WebRTC] Signal handling error:", error);
        onErrorRef.current?.(error as Error);
      }
    };

    const setup = async () => {
      try {
        console.log("[WebRTC] Getting user media...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: "user" },
          audio: true,
        });

        if (isCleanedUpRef.current) {
          console.log("[WebRTC] Cleaned up during getUserMedia, stopping tracks");
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        console.log("[WebRTC] Got local stream:", stream.id);
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMediaReady(true);

        // Create peer connection
        pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;
        console.log("[WebRTC] Created RTCPeerConnection");

        // Add tracks to peer connection
        stream.getTracks().forEach((track) => {
          console.log("[WebRTC] Adding track to PC:", track.kind);
          pc!.addTrack(track, stream);
        });

        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            const iceTimestamp = Date.now();
            const iceSignature = generateSignalSignature(userId, requestId, iceTimestamp);
            channelRef.current.send({
              type: "broadcast",
              event: "webrtc_signal",
              payload: {
                type: "ice_candidate",
                candidate: event.candidate.toJSON(),
                from: userId,
                timestamp: iceTimestamp,
                signature: iceSignature,
              },
            });
          }
        };

        pc.ontrack = (event) => {
          console.log("[WebRTC] >>> ontrack event <<<", {
            trackKind: event.track?.kind,
            trackId: event.track?.id,
            trackEnabled: event.track?.enabled,
            trackReadyState: event.track?.readyState,
            streamsCount: event.streams?.length,
            firstStreamId: event.streams?.[0]?.id,
          });

          let streamToUse: MediaStream;

          if (event.streams && event.streams[0]) {
            streamToUse = event.streams[0];
            console.log("[WebRTC] Using stream from event.streams[0]");
          } else {
            // Fallback: create or use existing stream
            if (!remoteStreamRef.current) {
              remoteStreamRef.current = new MediaStream();
              console.log("[WebRTC] Created new MediaStream for remote");
            }
            streamToUse = remoteStreamRef.current;

            // Add track if not already present
            const existingTrack = streamToUse.getTracks().find(t => t.id === event.track.id);
            if (!existingTrack) {
              streamToUse.addTrack(event.track);
              console.log("[WebRTC] Added track to remote stream");
            }
          }

          remoteStreamRef.current = streamToUse;

          console.log("[WebRTC] Setting remoteStream state:", {
            id: streamToUse.id,
            active: streamToUse.active,
            videoTracks: streamToUse.getVideoTracks().length,
            audioTracks: streamToUse.getAudioTracks().length,
            videoTrackStates: streamToUse.getVideoTracks().map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })),
          });

          setRemoteStream(streamToUse);
          onRemoteStreamRef.current?.(streamToUse);
        };

        pc.onconnectionstatechange = () => {
          console.log("[WebRTC] Connection state changed:", pc?.connectionState);
          if (pc) {
            setConnectionState(pc.connectionState);
            onConnectionStateChangeRef.current?.(pc.connectionState);
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log("[WebRTC] ICE connection state:", pc?.iceConnectionState);
        };

        pc.onsignalingstatechange = () => {
          console.log("[WebRTC] Signaling state:", pc?.signalingState);
        };

        // Subscribe to channel
        console.log("[WebRTC] Subscribing to channel:", channelName);
        channelRef.current = supabase
          .channel(channelName)
          .on("broadcast", { event: "webrtc_signal" }, ({ payload }) => {
            handleSignal(payload);
          })
          .subscribe((status) => {
            console.log("[WebRTC] Channel subscription status:", status);
            if (status === "SUBSCRIBED" && !isCleanedUpRef.current) {
              // Signal ready
              console.log("[WebRTC] Sending ready signal");
              channelRef.current?.send({
                type: "broadcast",
                event: "webrtc_signal",
                payload: { type: "ready", from: userId },
              });

              // If talker and other is ready, start
              if (isTalker && otherReadyRef.current) {
                console.log("[WebRTC] Other was already ready, creating offer");
                createOffer();
              }
            }
          });

      } catch (error) {
        console.error("[WebRTC] Setup error:", error);
        onErrorRef.current?.(error as Error);
      }
    };

    setup();

    return () => {
      console.log("[WebRTC] Cleanup running");
      if (!isCleanedUpRef.current) {
        isCleanedUpRef.current = true;
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        peerConnectionRef.current?.close();
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      }
    };
  }, [requestId, userId, isTalker]);

  return {
    localStream,
    remoteStream,
    connectionState,
    isMediaReady,
    isMuted,
    isCameraOff,
    hangup,
    toggleMute,
    toggleCamera,
  };
}
