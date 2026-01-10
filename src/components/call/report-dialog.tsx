"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isRateLimited, getRateLimitRemaining } from "@/lib/security";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import type { MisconductCategory } from "@/lib/types";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  reportedId: string;
  onReportSubmitted: () => void;
}

const CATEGORIES: { value: MisconductCategory; label: string }[] = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech or discrimination" },
  { value: "sexual_content", label: "Inappropriate sexual content" },
  { value: "scam", label: "Scam or fraud attempt" },
  { value: "other", label: "Other violation" },
];

export function ReportDialog({
  open,
  onClose,
  sessionId,
  reportedId,
  onReportSubmitted,
}: ReportDialogProps) {
  const [category, setCategory] = useState<MisconductCategory | "">("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!category) {
      toast({
        title: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Authentication error",
        description: "Please log in again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Rate limit: 3 reports per hour per user
    const rateLimitKey = `report:${user.id}`;
    if (isRateLimited(rateLimitKey, { maxRequests: 3, windowMs: 3600000 })) {
      const remaining = getRateLimitRemaining(rateLimitKey, { maxRequests: 3, windowMs: 3600000 });
      toast({
        title: "Rate limit exceeded",
        description: `You can only submit 3 reports per hour. ${remaining} remaining.`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from("misconduct_reports").insert({
      call_session_id: sessionId,
      reporter_id: user.id,
      reported_id: reportedId,
      category,
      note: note.trim() || null,
    });

    if (error) {
      toast({
        title: "Failed to submit report",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onReportSubmitted();
    }

    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCategory("");
      setNote("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report User</DialogTitle>
          <DialogDescription>
            Help us keep our community safe by reporting inappropriate behavior.
            All reports are reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as MisconductCategory)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Additional details (optional)</Label>
            <Textarea
              id="note"
              placeholder="Provide any additional context that might help us understand the situation..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              disabled={isLoading}
            />
            <p className="text-right text-xs text-muted-foreground">
              {note.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!category || isLoading}
            variant="destructive"
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
