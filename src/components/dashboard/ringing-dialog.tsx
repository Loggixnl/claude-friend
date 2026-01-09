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
import { Phone } from "lucide-react";
import type { CallRequest } from "@/lib/types";

interface RingingDialogProps {
  request: CallRequest | null;
  onCancel: () => void;
}

const RING_DURATION = 30; // seconds

export function RingingDialog({ request, onCancel }: RingingDialogProps) {
  const [timeLeft, setTimeLeft] = useState(RING_DURATION);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!request) {
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
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [request]);

  if (!request) return null;

  return (
    <Dialog open={!!request && request.status === "ringing"} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px]" hideCloseButton>
        <DialogHeader className="items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Phone className="h-8 w-8 animate-pulse text-primary" />
          </div>
          <DialogTitle>Ringing...</DialogTitle>
          <DialogDescription>
            Waiting for the listener to accept your request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-2xl font-bold tabular-nums">
            {timeLeft}s
          </p>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button variant="destructive" onClick={onCancel} className="w-full sm:w-auto">
            Cancel Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
