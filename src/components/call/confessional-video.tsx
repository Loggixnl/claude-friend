"use client";

import { useEffect, useRef, useState } from "react";
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

  // Draw the video frame
  ctx.drawImage(video, 0, 0, width, height);

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply pixelation - this obscures facial details
  const pixelSize = 8;
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      // Get the color of the top-left pixel in this block
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Fill the entire block with this color
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

  // Put the pixelated image back
  ctx.putImageData(imageData, 0, 0);

  // Apply blur effect
  ctx.filter = "blur(3px)";
  ctx.globalAlpha = 0.7;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  ctx.globalAlpha = 1;

  // Apply diamond lattice mesh overlay (like a confessional screen)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 2;

  const spacing = 20; // Size of diamond pattern

  // Draw diagonal lines from top-left to bottom-right
  ctx.beginPath();
  for (let i = -height; i < width + height; i += spacing) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i + height, height);
  }
  ctx.stroke();

  // Draw diagonal lines from top-right to bottom-left
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
  const animationRef = useRef<number>();
  const [isVideoReady, setIsVideoReady] = useState(false);
  const isVideoReadyRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isVideoReadyRef.current = isVideoReady;
  }, [isVideoReady]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset state when stream changes
    setIsVideoReady(false);
    isVideoReadyRef.current = false;

    // Clear canvas and stop animation when no stream
    if (!stream) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width || 320, canvas.height || 240);
      return;
    }

    // Set stream to video element
    video.srcObject = stream;
    video.muted = muted || isLocal; // Always mute local to prevent feedback

    // Resize canvas to match video dimensions
    const resizeCanvas = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw > 0 && vh > 0) {
        // Use smaller dimensions for performance
        const scale = 0.5;
        canvas.width = vw * scale;
        canvas.height = vh * scale;
        return true;
      }
      return false;
    };

    // Try to play video
    const playVideo = async () => {
      try {
        // Wait a tick to ensure srcObject is properly set
        await new Promise((r) => setTimeout(r, 50));
        await video.play();
      } catch (err) {
        safeError("Failed to play video:", err);
      }
    };

    // Render loop - runs continuously once started
    const render = () => {
      // Check if video has valid data
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        // Try to resize canvas if not done yet
        if (canvas.width === 0 || canvas.height === 0) {
          resizeCanvas();
        }

        // Only render if canvas has valid dimensions
        if (canvas.width > 0 && canvas.height > 0) {
          // Check video dimensions again (might change)
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            const scale = 0.5;
            const targetWidth = video.videoWidth * scale;
            const targetHeight = video.videoHeight * scale;
            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
              canvas.width = targetWidth;
              canvas.height = targetHeight;
            }
          }

          applyConfessionalEffect(ctx, video, canvas);

          // Mark as ready once we've successfully rendered (use ref to avoid re-renders in loop)
          if (!isVideoReadyRef.current) {
            isVideoReadyRef.current = true;
            setIsVideoReady(true);
          }
        }
      }
      animationRef.current = requestAnimationFrame(render);
    };

    // Handle video events
    const handleCanPlay = () => {
      resizeCanvas();
    };

    const handlePlaying = () => {
      resizeCanvas();
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("loadedmetadata", handleCanPlay);

    // Set initial canvas size (will be overwritten when video is ready)
    canvas.width = 320;
    canvas.height = 240;

    // Start playback
    playVideo();

    // Start render loop
    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("loadedmetadata", handleCanPlay);
    };
  }, [stream, muted, isLocal]);

  return (
    <div className={`relative overflow-hidden rounded-lg bg-black ${className}`}>
      {/* Hidden video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || isLocal}
        className="absolute opacity-0 pointer-events-none"
        style={{ width: 1, height: 1 }}
      />

      {/* Canvas with confessional effect - styled to fill container */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover" }}
      />

      {/* CSS overlay for additional effect */}
      <div className="confessional-video absolute inset-0 pointer-events-none" />

      {/* Label */}
      {label && (
        <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white z-10">
          {label}
        </div>
      )}

      {/* No video state */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">No video</p>
        </div>
      )}

      {/* Loading state - show only briefly when stream exists but video not ready */}
      {stream && !isVideoReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
    </div>
  );
}
