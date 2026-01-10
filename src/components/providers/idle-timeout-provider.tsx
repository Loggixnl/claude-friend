"use client";

import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { useToast } from "@/hooks/use-toast";

interface IdleTimeoutProviderProps {
  children: React.ReactNode;
}

export function IdleTimeoutProvider({ children }: IdleTimeoutProviderProps) {
  const { toast } = useToast();

  useIdleTimeout({
    timeoutMs: 30 * 60 * 1000, // 30 minutes
    warningMs: 5 * 60 * 1000, // 5 minutes before timeout
    onWarning: () => {
      toast({
        title: "Session expiring soon",
        description: "Your session will expire in 5 minutes due to inactivity.",
        variant: "destructive",
      });
    },
    onTimeout: () => {
      toast({
        title: "Session expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
    },
  });

  return <>{children}</>;
}
