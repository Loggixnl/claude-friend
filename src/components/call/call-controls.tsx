"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Flag,
} from "lucide-react";

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onHangup: () => void;
  onReport: () => void;
}

export function CallControls({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onHangup,
  onReport,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 bg-black/90 p-4 sm:p-6">
      <TooltipProvider>
        {/* Mute Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="icon"
              className="h-12 w-12 rounded-full sm:h-14 sm:w-14"
              onClick={onToggleMute}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isMuted ? "Unmute" : "Mute"}
          </TooltipContent>
        </Tooltip>

        {/* Camera Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isCameraOff ? "destructive" : "secondary"}
              size="icon"
              className="h-12 w-12 rounded-full sm:h-14 sm:w-14"
              onClick={onToggleCamera}
              aria-label={isCameraOff ? "Turn on camera" : "Turn off camera"}
            >
              {isCameraOff ? (
                <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Video className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isCameraOff ? "Turn on camera" : "Turn off camera"}
          </TooltipContent>
        </Tooltip>

        {/* Hangup Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="h-14 w-14 rounded-full sm:h-16 sm:w-16"
              onClick={onHangup}
              aria-label="End call"
            >
              <PhoneOff className="h-6 w-6 sm:h-7 sm:w-7" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>End call</TooltipContent>
        </Tooltip>

        {/* Report Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full sm:h-14 sm:w-14"
              onClick={onReport}
              aria-label="Report user"
            >
              <Flag className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Report user</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
