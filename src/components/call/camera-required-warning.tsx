"use client";

import { VideoOff } from "lucide-react";

export function CameraRequiredWarning() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="flex flex-col items-center gap-2 rounded-lg bg-destructive/90 px-6 py-4 text-white shadow-lg">
        <VideoOff className="h-8 w-8" />
        <p className="text-center font-medium">Camera Required</p>
        <p className="text-center text-sm opacity-90">
          Turn on your camera within 10 seconds or the call will end
        </p>
      </div>
    </div>
  );
}
