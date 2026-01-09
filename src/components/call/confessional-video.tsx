"use client";

import { useEffect, useRef, useState } from "react";

interface ConfessionalVideoProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
  label?: string;
  isLocal?: boolean;
}

// Apply confessional effect: blur + pixelation + vignette + grille overlay
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

  // Apply pixelation
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

  // Apply vignette effect
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.3,
    width / 2,
    height / 2,
    height * 0.8
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Apply vertical grille/mesh overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 2);
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
        console.error("Failed to play video:", err);
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
        className="h-full w-full object-cover"
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
