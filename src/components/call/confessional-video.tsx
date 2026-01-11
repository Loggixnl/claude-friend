"use client";

import { useEffect, useRef, useState } from "react";

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
  const streamIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Handle stream changes
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Check if this is the same stream
    const newStreamId = stream?.id || null;
    if (newStreamId === streamIdRef.current && stream) {
      // Same stream, don't reset
      return;
    }
    streamIdRef.current = newStreamId;

    console.log(`[ConfessionalVideo ${isLocal ? "LOCAL" : "REMOTE"}] Stream changed:`, stream ? {
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
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Set the stream
    video.srcObject = stream;
    video.muted = muted || isLocal;

    // Render function
    const render = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        // Update canvas size to match video
        const scale = 0.5;
        const targetWidth = Math.floor(video.videoWidth * scale);
        const targetHeight = Math.floor(video.videoHeight * scale);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }

        applyConfessionalEffect(ctx, video, canvas);
        setIsReady(true);
      }
      animationRef.current = requestAnimationFrame(render);
    };

    // Start rendering when video is ready
    const startRender = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      render();
    };

    video.addEventListener("loadedmetadata", startRender);
    video.addEventListener("canplay", startRender);

    // Try to play
    video.play().catch(() => {
      // Ignore play errors - autoplay might handle it
    });

    // Start render loop immediately (will wait for video data in the loop)
    startRender();

    return () => {
      video.removeEventListener("loadedmetadata", startRender);
      video.removeEventListener("canplay", startRender);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [stream, muted, isLocal]);

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
