"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UseIdleTimeoutOptions {
  timeoutMs?: number; // Default: 30 minutes
  warningMs?: number; // Default: 5 minutes before timeout
  onWarning?: () => void;
  onTimeout?: () => void;
}

const DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const DEFAULT_WARNING = 5 * 60 * 1000; // 5 minutes

export function useIdleTimeout({
  timeoutMs = DEFAULT_TIMEOUT,
  warningMs = DEFAULT_WARNING,
  onWarning,
  onTimeout,
}: UseIdleTimeoutOptions = {}) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleTimeout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onTimeout?.();
    router.push("/login?reason=session_timeout");
  }, [router, onTimeout]);

  const handleWarning = useCallback(() => {
    onWarning?.();
  }, [onWarning]);

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Set warning timer
    warningRef.current = setTimeout(handleWarning, timeoutMs - warningMs);

    // Set timeout timer
    timeoutRef.current = setTimeout(handleTimeout, timeoutMs);
  }, [timeoutMs, warningMs, handleWarning, handleTimeout]);

  useEffect(() => {
    // Events that indicate user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetTimers();
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timers
    resetTimers();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [resetTimers]);

  return {
    resetTimers,
    lastActivity: lastActivityRef.current,
  };
}
