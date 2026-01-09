"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDialogProps {
  sessionId: string;
  listenerId: string;
  onRatingSubmitted: () => void;
}

export function RatingDialog({
  sessionId,
  listenerId,
  onRatingSubmitted,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
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

    const { error } = await supabase.from("ratings").insert({
      call_session_id: sessionId,
      talker_id: user.id,
      listener_id: listenerId,
      rating,
    });

    if (error) {
      toast({
        title: "Failed to submit rating",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thank you!",
        description: "Your feedback helps improve the community.",
      });
      onRatingSubmitted();
    }

    setIsLoading(false);
  };

  const handleSkip = () => {
    onRatingSubmitted();
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px]" hideCloseButton>
        <DialogHeader className="items-center text-center">
          <DialogTitle>How was your experience?</DialogTitle>
          <DialogDescription>
            Rate your conversation with this listener
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-6">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Rate ${value} stars`}
            >
              <Star
                className={cn(
                  "h-10 w-10 transition-colors",
                  value <= displayRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {rating === 0 && "Select a rating"}
          {rating === 1 && "Poor"}
          {rating === 2 && "Fair"}
          {rating === 3 && "Good"}
          {rating === 4 && "Very Good"}
          {rating === 5 && "Excellent"}
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
