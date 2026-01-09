"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { ListenerWithProfile } from "@/lib/types";

interface ConnectDialogProps {
  listener: ListenerWithProfile | null;
  onClose: () => void;
  onSendRequest: (description: string) => Promise<void>;
}

const MIN_DESCRIPTION_LENGTH = 100;

export function ConnectDialog({
  listener,
  onClose,
  onSendRequest,
}: ConnectDialogProps) {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const charactersRemaining = MIN_DESCRIPTION_LENGTH - description.length;
  const isValid = description.length >= MIN_DESCRIPTION_LENGTH;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsLoading(true);
    await onSendRequest(description);
    setDescription("");
    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={!!listener} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect with {listener?.username}</DialogTitle>
          <DialogDescription>
            Describe what you&apos;d like to talk about. This helps the listener
            understand your situation before accepting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">What&apos;s on your mind?</Label>
            <Textarea
              id="description"
              placeholder="Share a brief description of what you'd like to talk about. This will be shown to the listener before they accept your request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px]"
              maxLength={2000}
              disabled={isLoading}
            />
            <div className="flex justify-between text-sm">
              <p
                className={
                  charactersRemaining > 0
                    ? "text-muted-foreground"
                    : "text-green-600"
                }
              >
                {charactersRemaining > 0
                  ? `${charactersRemaining} more characters needed`
                  : "Ready to send"}
              </p>
              <p className="text-muted-foreground">
                {description.length}/2000
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
