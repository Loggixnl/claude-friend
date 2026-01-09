"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Phone, PhoneOff } from "lucide-react";
import type { CallRequest } from "@/lib/types";

interface IncomingCallDialogProps {
  request: CallRequest | null;
  talkerUsername: string;
  onAccept: () => void;
  onDeny: () => void;
  onTimeout: () => void;
  denyDisabled: boolean;
}

const RING_DURATION = 30; // seconds

export function IncomingCallDialog({
  request,
  talkerUsername,
  onAccept,
  onDeny,
  onTimeout,
  denyDisabled,
}: IncomingCallDialogProps) {
  const [timeLeft, setTimeLeft] = useState(RING_DURATION);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!request || request.status !== "ringing") {
      setTimeLeft(RING_DURATION);
      setProgress(100);
      return;
    }

    const expiresAt = new Date(request.expires_at).getTime();
    const startedAt = new Date(request.created_at).getTime();
    const totalDuration = expiresAt - startedAt;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      const remainingSeconds = Math.ceil(remaining / 1000);
      const progressPercent = (remaining / totalDuration) * 100;

      setTimeLeft(remainingSeconds);
      setProgress(progressPercent);

      if (remaining <= 0) {
        onTimeout();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [request, onTimeout]);

  if (!request || request.status !== "ringing") return null;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" hideCloseButton>
        <DialogHeader className="items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Phone className="h-8 w-8 animate-pulse text-green-500" />
          </div>
          <DialogTitle>Incoming Request</DialogTitle>
          <DialogDescription>
            {talkerUsername} wants to talk with you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-2 text-sm font-medium">What they want to discuss:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground">
            {timeLeft}s to respond
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="destructive"
            onClick={onDeny}
            disabled={denyDisabled}
            className="w-full sm:w-auto"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            {denyDisabled ? "No denies left" : "Decline"}
          </Button>
          <Button onClick={onAccept} className="w-full sm:w-auto">
            <Phone className="mr-2 h-4 w-4" />
            Accept
          </Button>
        </DialogFooter>

        {denyDisabled && (
          <p className="text-center text-xs text-muted-foreground">
            You&apos;ve used all your denies this session. Accept or let it time out.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
