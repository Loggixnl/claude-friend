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

// Apply anonymizing confession booth effect: heavy pixelation + silhouette
// Designed so human form is visible but face is NOT recognizable
function applyConfessionalEffect(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
) {
  const width = canvas.width;
  const height = canvas.height;

  // STEP 1: Draw video at very low resolution for pixelation effect
  const pixelSize = 12; // Large pixels to destroy facial details
  const smallWidth = Math.ceil(width / pixelSize);
  const smallHeight = Math.ceil(height / pixelSize);

  // Create temporary canvas for pixelation
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = smallWidth;
  tempCanvas.height = smallHeight;
  const tempCtx = tempCanvas.getContext("2d")!;

  // Draw video to tiny size (this destroys detail)
  tempCtx.drawImage(video, 0, 0, smallWidth, smallHeight);

  // Draw back to main canvas with nearest-neighbor scaling (blocky pixels)
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempCanvas, 0, 0, smallWidth, smallHeight, 0, 0, width, height);
  ctx.imageSmoothingEnabled = true;

  // STEP 2: Get image data and apply extreme contrast + silhouette effect
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Calculate luminance
    const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    // Extreme threshold to create near-silhouette (3 levels only: dark, mid, light)
    let level: number;
    if (luminance < 60) {
      level = 20; // Very dark
    } else if (luminance < 140) {
      level = 80; // Dark mid-tone
    } else {
      level = 160; // Lighter areas (but still muted)
    }

    // Add heavy noise to further obscure
    const noise = (Math.random() - 0.5) * 60;
    const final = Math.max(0, Math.min(255, level + noise));

    // Warm/amber tint like looking through amber glass
    data[i] = Math.min(255, final * 1.1);     // R - warm
    data[i + 1] = Math.min(255, final * 0.9); // G - reduced
    data[i + 2] = Math.max(0, final * 0.6);   // B - heavily reduced
  }

  ctx.putImageData(imageData, 0, 0);

  // STEP 3: Apply heavy blur to smear any remaining detail
  ctx.filter = "blur(4px)";
  ctx.globalAlpha = 0.7;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  ctx.globalAlpha = 1;

  // Re-apply some contrast after blur
  const blurredData = ctx.getImageData(0, 0, width, height);
  const bd = blurredData.data;
  for (let i = 0; i < bd.length; i += 4) {
    // Boost contrast slightly
    bd[i] = Math.min(255, Math.max(0, (bd[i] - 128) * 1.3 + 128));
    bd[i + 1] = Math.min(255, Math.max(0, (bd[i + 1] - 128) * 1.3 + 128));
    bd[i + 2] = Math.min(255, Math.max(0, (bd[i + 2] - 128) * 1.3 + 128));
  }
  ctx.putImageData(blurredData, 0, 0);

  // STEP 4: Heavy vignette - very dark edges
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.1,
    width / 2,
    height / 2,
    height * 0.55
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.4, "rgba(0, 0, 0, 0.4)");
  gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.7)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // STEP 5: Dense confession booth mesh grille (thick horizontal slats)
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 2);
  }

  // Vertical bars for cross-hatch pattern
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  for (let x = 0; x < width; x += 5) {
    ctx.fillRect(x, 0, 2, height);
  }

  // STEP 6: Additional random noise overlay for extra obscuring
  const noiseData = ctx.getImageData(0, 0, width, height);
  const nd = noiseData.data;
  for (let i = 0; i < nd.length; i += 4) {
    const flicker = (Math.random() - 0.5) * 30;
    nd[i] = Math.max(0, Math.min(255, nd[i] + flicker));
    nd[i + 1] = Math.max(0, Math.min(255, nd[i + 1] + flicker));
    nd[i + 2] = Math.max(0, Math.min(255, nd[i + 2] + flicker));
  }
  ctx.putImageData(noiseData, 0, 0);
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
