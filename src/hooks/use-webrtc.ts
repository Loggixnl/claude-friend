"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

interface WebRTCSignal {
  type: "offer" | "answer" | "ice_candidate" | "hangup";
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
  from: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // TURN servers can be added via env vars
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
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  const sendSignal = useCallback(
    (signal: WebRTCSignal) => {
      if (!channelRef.current) return;

      channelRef.current.send({
        type: "broadcast",
        event: "webrtc_signal",
        payload: signal,
      });
    },
    []
  );

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "ice_candidate",
          payload: event.candidate.toJSON(),
          from: userId,
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStream(stream);
      onRemoteStream?.(stream);
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      onConnectionStateChange?.(pc.connectionState);

      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        onError?.(new Error("Connection lost"));
      }
    };

    pc.onnegotiationneeded = async () => {
      if (isTalker) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal({
            type: "offer",
            payload: offer,
            from: userId,
          });
        } catch (error) {
          onError?.(error as Error);
        }
      }
    };

    return pc;
  }, [userId, isTalker, sendSignal, onConnectionStateChange, onRemoteStream, onError]);

  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480 },
          height: { ideal: 360 },
          facingMode: "user",
        },
        audio: true,
      });

      setLocalStream(stream);
      setIsMediaReady(true);

      // Add tracks to peer connection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current!.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  }, [onError]);

  const handleSignal = useCallback(
    async (signal: WebRTCSignal) => {
      if (signal.from === userId) return;

      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        switch (signal.type) {
          case "offer":
            await pc.setRemoteDescription(
              new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
            );

            // Process queued ICE candidates
            for (const candidate of iceCandidatesQueue.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            iceCandidatesQueue.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal({
              type: "answer",
              payload: answer,
              from: userId,
            });
            break;

          case "answer":
            await pc.setRemoteDescription(
              new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
            );

            // Process queued ICE candidates
            for (const candidate of iceCandidatesQueue.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            iceCandidatesQueue.current = [];
            break;

          case "ice_candidate":
            if (pc.remoteDescription) {
              await pc.addIceCandidate(
                new RTCIceCandidate(signal.payload as RTCIceCandidateInit)
              );
            } else {
              iceCandidatesQueue.current.push(signal.payload as RTCIceCandidateInit);
            }
            break;

          case "hangup":
            onHangup?.();
            break;
        }
      } catch (error) {
        console.error("Signal handling error:", error);
        onError?.(error as Error);
      }
    },
    [userId, sendSignal, onError, onHangup]
  );

  const hangup = useCallback(() => {
    sendSignal({
      type: "hangup",
      payload: null,
      from: userId,
    });

    // Cleanup
    localStream?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();
    channelRef.current?.unsubscribe();

    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("closed");

    onHangup?.();
  }, [localStream, userId, sendSignal, onHangup]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Initialize WebRTC
  useEffect(() => {
    const supabase = createClient();
    const channelName = `call:${requestId}`;

    const setup = async () => {
      // Create peer connection
      peerConnectionRef.current = createPeerConnection();

      // Initialize media
      const stream = await initializeMedia();
      if (!stream) return;

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current!.addTrack(track, stream);
      });

      // Subscribe to signaling channel
      channelRef.current = supabase
        .channel(channelName)
        .on("broadcast", { event: "webrtc_signal" }, ({ payload }) => {
          handleSignal(payload as WebRTCSignal);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && isTalker) {
            // Talker initiates the call after subscription
            peerConnectionRef.current?.createOffer().then(async (offer) => {
              await peerConnectionRef.current!.setLocalDescription(offer);
              sendSignal({
                type: "offer",
                payload: offer,
                from: userId,
              });
            });
          }
        });
    };

    setup();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [
    requestId,
    userId,
    isTalker,
    createPeerConnection,
    initializeMedia,
    handleSignal,
    sendSignal,
  ]);

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
