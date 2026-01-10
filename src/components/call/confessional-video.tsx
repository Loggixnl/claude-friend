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

// Apply confession booth effect: B&W, high contrast, grain, vignette, mesh grille
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

  // Convert to high-contrast black and white with slight warmth
  for (let i = 0; i < data.length; i += 4) {
    // Calculate luminance (weighted for human perception)
    const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    // Apply contrast curve (S-curve for dramatic effect)
    let adjusted = luminance / 255;
    adjusted = adjusted < 0.5
      ? 2 * adjusted * adjusted
      : 1 - 2 * (1 - adjusted) * (1 - adjusted);
    adjusted = Math.max(0, Math.min(1, adjusted * 1.2 - 0.1)); // Boost contrast

    // Add slight sepia/warm tone for old confession booth feel
    const gray = adjusted * 255;
    data[i] = Math.min(255, gray * 1.05);     // R - slightly warm
    data[i + 1] = gray;                        // G
    data[i + 2] = Math.max(0, gray * 0.92);   // B - reduce blue

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

  // Heavy vignette effect (dark corners like peering through a confessional screen)
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.15,
    width / 2,
    height / 2,
    height * 0.7
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.3)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.85)");
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

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !stream) return;

    video.srcObject = stream;
    video.muted = muted || isLocal; // Always mute local to prevent feedback
    video.playsInline = true;

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        safeError("Failed to play video:", err);
      }
    };

    playVideo();

    // Set up canvas rendering
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to match video dimensions
    const resizeCanvas = () => {
      // Use smaller dimensions for performance
      const scale = 0.5;
      canvas.width = (video.videoWidth || 480) * scale;
      canvas.height = (video.videoHeight || 360) * scale;
    };

    video.addEventListener("loadedmetadata", resizeCanvas);
    resizeCanvas();

    // Render loop
    const render = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        applyConfessionalEffect(ctx, video, canvas);
      }
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      video.removeEventListener("loadedmetadata", resizeCanvas);
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
      />

      {/* Canvas with confessional effect */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* CSS overlay for additional effect */}
      <div className="confessional-video absolute inset-0 pointer-events-none" />

      {/* Label */}
      {label && (
        <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
          {label}
        </div>
      )}

      {/* No video state */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">No video</p>
        </div>
      )}

      {/* Loading state */}
      {stream && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
    </div>
  );
}
