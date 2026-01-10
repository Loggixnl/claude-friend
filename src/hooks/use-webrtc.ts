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

  // Use refs to avoid stale closures and prevent re-renders
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const isInitializedRef = useRef(false);
  const isCleanedUpRef = useRef(false);
  const otherReadyRef = useRef(false);

  // Store callbacks in refs to avoid dependency issues
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
    // Prevent double initialization in strict mode
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    isCleanedUpRef.current = false;

    const supabase = createClient();
    const channelName = `call:${requestId}`;

    const createOffer = async (pc: RTCPeerConnection) => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const timestamp = Date.now();
        const signature = generateSignalSignature(userId, requestId, timestamp);
        channelRef.current?.send({
          type: "broadcast",
          event: "webrtc_signal",
          payload: { type: "offer", sdp: offer, from: userId, timestamp, signature },
        });
      } catch (error) {
        safeError("Error creating offer:", error);
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
      if (data.from === userId || isCleanedUpRef.current) return;

      // Verify signature for offer/answer/ice_candidate messages
      if (
        data.type !== "ready" &&
        data.type !== "hangup" &&
        data.timestamp &&
        data.signature
      ) {
        if (!verifySignalSignature(data.from, requestId, data.timestamp, data.signature)) {
          safeError("Invalid signal signature, ignoring message");
          return;
        }
      }

      const pc = peerConnectionRef.current;

      try {
        if (data.type === "ready") {
          otherReadyRef.current = true;
          // If we're talker and have a connection, create offer
          if (isTalker && pc && pc.signalingState !== "closed") {
            await createOffer(pc);
          }
        } else if (data.type === "offer" && pc && pc.signalingState !== "closed") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp!));

          // Process queued candidates
          for (const candidate of iceCandidatesQueue.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          iceCandidatesQueue.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const answerTimestamp = Date.now();
          const answerSignature = generateSignalSignature(userId, requestId, answerTimestamp);
          channelRef.current?.send({
            type: "broadcast",
            event: "webrtc_signal",
            payload: { type: "answer", sdp: answer, from: userId, timestamp: answerTimestamp, signature: answerSignature },
          });
        } else if (data.type === "answer" && pc && pc.signalingState !== "closed") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp!));

          // Process queued candidates
          for (const candidate of iceCandidatesQueue.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          iceCandidatesQueue.current = [];
        } else if (data.type === "ice_candidate" && data.candidate) {
          if (pc && pc.remoteDescription && pc.signalingState !== "closed") {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else {
            iceCandidatesQueue.current.push(data.candidate);
          }
        } else if (data.type === "hangup") {
          // Other party hung up
          localStreamRef.current?.getTracks().forEach((track) => track.stop());
          peerConnectionRef.current?.close();
          setLocalStream(null);
          setRemoteStream(null);
          setConnectionState("closed");
          isCleanedUpRef.current = true;
          onHangupRef.current?.();
        }
      } catch (error) {
        safeError("Signal handling error:", error);
        onErrorRef.current?.(error as Error);
      }
    };

    const setup = async () => {
      try {
        // Get media first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: "user" },
          audio: true,
        });

        if (isCleanedUpRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMediaReady(true);

        // Create peer connection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add tracks
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
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
          const remoteStr = event.streams[0];
          setRemoteStream(remoteStr);
          onRemoteStreamRef.current?.(remoteStr);
        };

        pc.onconnectionstatechange = () => {
          setConnectionState(pc.connectionState);
          onConnectionStateChangeRef.current?.(pc.connectionState);
        };

        // Subscribe to channel
        channelRef.current = supabase
          .channel(channelName)
          .on("broadcast", { event: "webrtc_signal" }, ({ payload }) => {
            handleSignal(payload);
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED" && !isCleanedUpRef.current) {
              // Signal ready
              channelRef.current?.send({
                type: "broadcast",
                event: "webrtc_signal",
                payload: { type: "ready", from: userId },
              });

              // If talker and other is ready, start
              if (isTalker && otherReadyRef.current) {
                createOffer(pc);
              }
            }
          });

      } catch (error) {
        safeError("Setup error:", error);
        onErrorRef.current?.(error as Error);
      }
    };

    setup();

    return () => {
      // Only cleanup if actually initialized
      if (!isCleanedUpRef.current) {
        isCleanedUpRef.current = true;
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        peerConnectionRef.current?.close();
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      }
      // Reset for potential re-mount
      isInitializedRef.current = false;
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
