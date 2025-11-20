import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import webPattern from "@/assets/web-pattern.jpg";

interface ProfileData {
  id: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  user_type: "artist" | "organizer";
  artist_profile?: {
    artistic_branches: string[];
  };
  organizer_profile?: {
    preferred_branches: string[];
    company_name: string | null;
  };
}

const Feed = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserType, setCurrentUserType] = useState<"artist" | "organizer" | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;

      try {
        // Get current user profile
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", user.id)
          .single();

        if (!currentProfile) {
          navigate("/");
          return;
        }

        setCurrentUserType(currentProfile.user_type);

        // Fetch opposite type profiles
        const targetType = currentProfile.user_type === "artist" ? "organizer" : "artist";
        
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            bio,
            avatar_url,
            user_type,
            artist_profiles (
              artistic_branches
            ),
            organizer_profiles (
              preferred_branches,
              company_name
            )
          `)
          .eq("user_type", targetType)
          .neq("id", user.id)
          .limit(20);

        if (error) throw error;

        const formattedData = data?.map(profile => ({
          ...profile,
          artist_profile: profile.artist_profiles?.[0],
          organizer_profile: profile.organizer_profiles?.[0],
        })) || [];

        setProfiles(formattedData);
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar perfis");
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user, navigate]);

  const branchLabels: Record<string, string> = {
    music: "Música",
    dance: "Dança",
    theater: "Teatro",
    visual_arts: "Artes Visuais",
    circus: "Circo",
    magic: "Mágica",
    comedy: "Comédia",
    dj: "DJ",
    live_painting: "Pintura ao Vivo",
    performance: "Performance",
    other: "Outro",
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url(${webPattern})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm bg-card/50 sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-artist-glow to-organizer-glow bg-clip-text text-transparent">
              EchoArachna
            </h1>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
              >
                <User className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Feed */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">
              {currentUserType === "artist" 
                ? "Organizadores que podem te contratar" 
                : "Artistas disponíveis"}
            </h2>

            <div className="space-y-4">
              {profiles.length === 0 ? (
                <Card className="border-border/50 backdrop-blur-sm bg-card/90">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Nenhum perfil encontrado no momento
                    </p>
                  </CardContent>
                </Card>
              ) : (
                profiles.map((profile) => (
                  <Card 
                    key={profile.id} 
                    className="border-border/50 backdrop-blur-sm bg-card/90 hover:border-accent transition-all cursor-pointer"
                    onClick={() => navigate(`/profile/${profile.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {profile.full_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {profile.full_name}
                          </CardTitle>
                          {profile.organizer_profile?.company_name && (
                            <CardDescription>
                              {profile.organizer_profile.company_name}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {profile.bio}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {(profile.artist_profile?.artistic_branches || 
                          profile.organizer_profile?.preferred_branches || [])
                          .map((branch) => (
                          <Badge 
                            key={branch} 
                            variant="secondary"
                            className={profile.user_type === "artist" 
                              ? "bg-artist/20 text-artist-foreground" 
                              : "bg-organizer/20 text-organizer-foreground"}
                          >
                            {branchLabels[branch] || branch}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Feed;
