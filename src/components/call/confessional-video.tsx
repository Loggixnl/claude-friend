"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { safeError } from "@/lib/security";

interface ConfessionalVideoProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
  label?: string;
  isLocal?: boolean;
}

// Apply confessional effect: pixelation + blur + grille overlay
function applyConfessionalEffect(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
) {
  const width = canvas.width;
  const height = canvas.height;

  if (width === 0 || height === 0) return;

  // Draw the video frame
  ctx.drawImage(video, 0, 0, width, height);

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply pixelation - this obscures facial details
  const pixelSize = 8;
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      for (let py = 0; py < pixelSize && y + py < height; py++) {
        for (let px = 0; px < pixelSize && x + px < width; px++) {
          const pi = ((y + py) * width + (x + px)) * 4;
          data[pi] = r;
          data[pi + 1] = g;
          data[pi + 2] = b;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Apply blur effect
  ctx.filter = "blur(3px)";
  ctx.globalAlpha = 0.7;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  ctx.globalAlpha = 1;

  // Apply diamond lattice mesh overlay
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 2;
  const spacing = 20;

  ctx.beginPath();
  for (let i = -height; i < width + height; i += spacing) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i + height, height);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let i = -height; i < width + height; i += spacing) {
    ctx.moveTo(i, height);
    ctx.lineTo(i + height, 0);
  }
  ctx.stroke();
}

export function ConfessionalVideo({
  stream,
  muted = false,
  className = "",
  label,
  isLocal = false,
}: ConfessionalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startRendering = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const render = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        // Update canvas size to match video
        const scale = 0.5;
        const targetWidth = Math.floor(video.videoWidth * scale);
        const targetHeight = Math.floor(video.videoHeight * scale);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          console.log(`[ConfessionalVideo ${isLocal ? "LOCAL" : "REMOTE"}] Canvas resized to ${targetWidth}x${targetHeight}`);
        }

        applyConfessionalEffect(ctx, video, canvas);

        if (!isReady) {
          setIsReady(true);
        }
      }
      animationRef.current = requestAnimationFrame(render);
    };

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    render();
  }, [isLocal, isReady]);

  // Handle stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log(`[ConfessionalVideo ${isLocal ? "LOCAL" : "REMOTE"}] useEffect triggered, stream:`, stream ? {
      id: stream.id,
      active: stream.active,
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
    } : "null");

    // Reset ready state
    setIsReady(false);

    // Stop any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (!stream) {
      video.srcObject = null;
      return;
    }

    // Set the stream
    video.srcObject = stream;
    video.muted = muted || isLocal;

    const handleLoadedMetadata = () => {
      console.log(`[ConfessionalVideo ${isLocal ? "LOCAL" : "REMOTE"}] loadedmetadata: ${video.videoWidth}x${video.videoHeight}`);
      startRendering();
    };

    const handleCanPlay = () => {
      console.log(`[ConfessionalVideo ${isLocal ? "LOCAL" : "REMOTE"}] canplay event`);
      startRendering();
    };

    const handlePlay = () => {
      console.log(`[ConfessionalVideo ${isLocal ? "LOCAL" : "REMOTE"}] play event, dimensions: ${video.videoWidth}x${video.videoHeight}`);
      startRendering();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);

    // Try to play immediately
    video.play().then(() => {
      console.log(`[ConfessionalVideo ${isLocal ? "LOCAL" : "REMOTE"}] play() succeeded`);
      startRendering();
    }).catch((err) => {
      console.error(`[ConfessionalVideo ${isLocal ? "LOCAL" : "REMOTE"}] play() failed:`, err);
      safeError("Video play failed:", err);
    });

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [stream, muted, isLocal, startRendering]);

  return (
    <div className={`relative overflow-hidden rounded-lg bg-black ${className}`}>
      {/* Video element - hidden but needs real dimensions */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || isLocal}
        className="absolute inset-0 w-full h-full opacity-0"
      />

      {/* Canvas with confessional effect */}
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover" }}
      />

      {/* Label - always show if provided */}
      {label && (
        <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white z-10">
          {label} {!stream && "(waiting...)"}
        </div>
      )}

      {/* No stream indicator */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/50 text-sm">Waiting for video...</p>
        </div>
      )}

      {/* Loading indicator */}
      {stream && !isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
    </div>
  );
}
