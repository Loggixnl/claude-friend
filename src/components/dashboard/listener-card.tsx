"use client";

import { Star, Heart, HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getLanguageFlag, formatRating } from "@/lib/utils";
import type { ListenerWithProfile } from "@/lib/types";

interface ListenerCardProps {
  listener: ListenerWithProfile;
  onConnect: () => void;
  onToggleFavorite: () => void;
}

export function ListenerCard({
  listener,
  onConnect,
  onToggleFavorite,
}: ListenerCardProps) {
  const isActive = listener.status === "active";
  const isActivating = listener.isActivating;

  return (
    <Card className={!isActive && !isActivating ? "opacity-75" : ""}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {listener.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{listener.username}</span>
              <span className="text-lg">
                {getLanguageFlag(listener.language_code)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span>{formatRating(listener.rating_avg)}</span>
              {listener.rating_count > 0 && (
                <span>({listener.rating_count})</span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFavorite}
          className="h-8 w-8"
          aria-label={
            listener.isFavorite ? "Remove from favorites" : "Add to favorites"
          }
        >
          {listener.isFavorite ? (
            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
          ) : (
            <HeartOff className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <Badge variant={isActive ? "success" : isActivating ? "warning" : "secondary"}>
          {isActive ? "Active" : isActivating ? "Activating..." : "Inactive"}
        </Badge>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onConnect}
          disabled={!isActive}
          className="w-full"
        >
          {isActive ? "Connect" : "Unavailable"}
        </Button>
      </CardFooter>
    </Card>
  );
}
