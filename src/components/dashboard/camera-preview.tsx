"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfessionalVideo } from "@/components/call/confessional-video";
import { Camera, CameraOff, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { safeError } from "@/lib/security";

interface CameraPreviewProps {
  open: boolean;
  onClose: () => void;
}

export function CameraPreview({ open, onClose }: CameraPreviewProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
    } catch (err) {
      safeError("Camera access error:", err);
      setHasPermission(false);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to preview your appearance.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Preview
          </DialogTitle>
          <DialogDescription>
            This is how you will appear to others during a call. The anonymizing filter is applied to protect your identity.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}

          {hasPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
              <CameraOff className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-white">Camera access denied</p>
                <p className="text-sm text-muted-foreground">
                  Please enable camera access in your browser settings and try again.
                </p>
              </div>
              <Button variant="secondary" onClick={startCamera}>
                Try Again
              </Button>
            </div>
          )}

          {stream && (
            <ConfessionalVideo
              stream={stream}
              isLocal
              className="h-full w-full"
            />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CameraPreviewButtonProps {
  className?: string;
}

export function CameraPreviewButton({ className }: CameraPreviewButtonProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowPreview(true)}
        className={className}
      >
        <Camera className="mr-2 h-4 w-4" />
        Preview Camera
      </Button>
      <CameraPreview open={showPreview} onClose={() => setShowPreview(false)} />
    </>
  );
}
