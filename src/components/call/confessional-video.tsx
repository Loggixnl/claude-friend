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

// Apply confession booth effect: Black & white with grain, vignette, mesh grille
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

  // Convert to black and white with slight contrast boost
  for (let i = 0; i < data.length; i += 4) {
    // Calculate luminance (weighted for human perception)
    const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    // Apply slight contrast curve
    let adjusted = luminance / 255;
    adjusted = adjusted < 0.5
      ? 2 * adjusted * adjusted
      : 1 - 2 * (1 - adjusted) * (1 - adjusted);
    const gray = Math.max(0, Math.min(255, adjusted * 255));

    // Pure black and white
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B

    // Add film grain noise
    const noise = (Math.random() - 0.5) * 25;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }

  // Put the processed image back
  ctx.putImageData(imageData, 0, 0);

  // Apply slight blur for dreamy/mysterious effect
  ctx.filter = "blur(1.5px)";
  ctx.globalAlpha = 0.4;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  ctx.globalAlpha = 1;

  // Vignette effect (dark corners like peering through a confessional screen)
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.2,
    width / 2,
    height / 2,
    height * 0.8
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.2)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Confession booth mesh/grille overlay (horizontal slats)
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let y = 0; y < height; y += 6) {
    ctx.fillRect(0, y, width, 2);
  }

  // Add subtle vertical lines for cross-hatch mesh effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  for (let x = 0; x < width; x += 8) {
    ctx.fillRect(x, 0, 1, height);
  }
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Reset state when stream changes
    setIsPlaying(false);
    setHasVideo(false);

    if (!stream) {
      // Clear canvas when no stream
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    video.srcObject = stream;
    video.muted = muted || isLocal; // Always mute local to prevent feedback
    video.playsInline = true;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to match video dimensions
    const resizeCanvas = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        // Use smaller dimensions for performance
        const scale = 0.5;
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        setHasVideo(true);
      }
    };

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
        // Resize after play starts in case dimensions weren't available before
        resizeCanvas();
      } catch (err) {
        safeError("Failed to play video:", err);
      }
    };

    // Handle video metadata loaded
    const handleLoadedMetadata = () => {
      resizeCanvas();
      playVideo();
    };

    // Handle when video data is available
    const handleLoadedData = () => {
      resizeCanvas();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedData);

    // If video is already ready (e.g., stream was already playing), start immediately
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      // Try to play anyway for remote streams that might already be active
      playVideo();
    }

    // Render loop
    const render = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA && canvas.width > 0 && canvas.height > 0) {
        applyConfessionalEffect(ctx, video, canvas);
      }
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [stream, muted, isLocal]);

  return (
    <div className={`relative overflow-hidden rounded-lg bg-black ${className}`}>
      {/* Hidden video element - needs dimensions for canvas to reference */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || isLocal}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        style={{ objectFit: "cover" }}
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

      {/* Loading state - show when stream exists but not playing or no video dimensions yet */}
      {stream && (!isPlaying || !hasVideo) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
    </div>
  );
}
