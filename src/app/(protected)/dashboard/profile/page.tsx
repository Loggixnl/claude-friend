import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLanguageFlag, getLanguageName } from "@/lib/utils";
import { User, Star, Flag, Calendar } from "lucide-react";

export const metadata = {
  title: "Profile - Claud Friend",
};

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const createdAt = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Your Profile</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium">{profile.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="outline" className="capitalize">
                {profile.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Language</span>
              <span className="font-medium">
                {getLanguageFlag(profile.language_code)}{" "}
                {getLanguageName(profile.language_code)}
              </span>
            </div>
          </CardContent>
        </Card>

        {profile.role === "listener" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Listener Stats
              </CardTitle>
              <CardDescription>
                Your performance as a listener
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Average Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {profile.rating_avg.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Ratings</span>
                <span className="font-medium">{profile.rating_count}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Account Status
            </CardTitle>
            <CardDescription>Your account standing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={profile.banned ? "destructive" : "success"}>
                {profile.banned ? "Banned" : "Good Standing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reports Received</span>
              <span className="font-medium">{profile.reports_count}</span>
            </div>
            {profile.reports_count > 0 && (
              <p className="text-sm text-muted-foreground">
                Users with more than 5 reports are automatically banned.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Account Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{createdAt}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
