"use client";

import { useState, useEffect, useRef } from "react";

export function AnonymityDemo() {
  const [isFiltered, setIsFiltered] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Try to get camera access for live demo
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setHasCamera(true);
        }
      } catch {
        // Camera not available, will show placeholder
        setHasCamera(false);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasCamera || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;

        if (isFiltered) {
          // Apply confessional filter effect
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Pixelation
          const pixelSize = 8;
          for (let y = 0; y < canvas.height; y += pixelSize) {
            for (let x = 0; x < canvas.width; x += pixelSize) {
              const i = (y * canvas.width + x) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              for (let py = 0; py < pixelSize && y + py < canvas.height; py++) {
                for (let px = 0; px < pixelSize && x + px < canvas.width; px++) {
                  const pi = ((y + py) * canvas.width + (x + px)) * 4;
                  data[pi] = r;
                  data[pi + 1] = g;
                  data[pi + 2] = b;
                }
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);

          // Blur
          ctx.filter = "blur(3px)";
          ctx.globalAlpha = 0.7;
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = "none";
          ctx.globalAlpha = 1;

          // Diamond lattice
          ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
          ctx.lineWidth = 2;
          const spacing = 20;

          ctx.beginPath();
          for (let i = -canvas.height; i < canvas.width + canvas.height; i += spacing) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i + canvas.height, canvas.height);
          }
          ctx.stroke();

          ctx.beginPath();
          for (let i = -canvas.height; i < canvas.width + canvas.height; i += spacing) {
            ctx.moveTo(i, canvas.height);
            ctx.lineTo(i + canvas.height, 0);
          }
          ctx.stroke();
        } else {
          // Show original video
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasCamera, isFiltered]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative overflow-hidden rounded-2xl border-4 border-primary/20 shadow-2xl">
        {/* Hidden video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute opacity-0 pointer-events-none"
          style={{ width: 320, height: 240 }}
        />

        {hasCamera ? (
          <canvas
            ref={canvasRef}
            className="w-[320px] h-[240px] sm:w-[400px] sm:h-[300px]"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          /* Placeholder when no camera */
          <div
            className="w-[320px] h-[240px] sm:w-[400px] sm:h-[300px] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center relative"
          >
            {isFiltered ? (
              <div className="absolute inset-0">
                {/* Simulated pixelated silhouette */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-600 to-gray-800" />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%),
                      linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.1) 75%),
                      linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.1) 75%)
                    `,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                />
                {/* Silhouette */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gray-500/50 blur-lg" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-20 rounded-full bg-gray-400/30 blur-md mt-[-30px]" />
                  <div className="absolute w-32 h-24 rounded-t-full bg-gray-400/30 blur-md mt-[60px]" />
                </div>
                {/* Diamond lattice overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-30">
                  <defs>
                    <pattern id="diamond" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M0,10 L10,0 L20,10 L10,20 Z" fill="none" stroke="black" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#diamond)" />
                </svg>
                <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-xs text-white">
                  Anonymous User
                </div>
              </div>
            ) : (
              <div className="text-center text-white/70">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gray-500 flex items-center justify-center text-3xl">
                  ?
                </div>
                <p className="text-sm">Your face would appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Label */}
        <div className="absolute top-3 left-3 bg-black/70 px-3 py-1 rounded-full text-xs font-medium text-white">
          {isFiltered ? "With Filter (Anonymous)" : "Without Filter"}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsFiltered(!isFiltered)}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
      >
        {isFiltered ? "See Without Filter" : "Apply Confessional Filter"}
      </button>

      <p className="text-sm text-muted-foreground text-center max-w-md">
        {hasCamera
          ? "This is your actual camera feed. Toggle to see the difference."
          : "Allow camera access to see a live demo of the anonymity filter."}
      </p>
    </div>
  );
}
