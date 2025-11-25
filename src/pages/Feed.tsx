import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, User, Heart, MessageCircle, Search } from "lucide-react";
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
    location?: string;
  };
  organizer_profile?: {
    preferred_branches: string[];
    company_name: string | null;
    location?: string;
  };
}

const Feed = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserType, setCurrentUserType] = useState<"artist" | "organizer" | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchFavorites();
    }
  }, [user, navigate]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('favorites')
        .select('favorited_user_id')
        .eq('user_id', user.id);

      if (data) {
        setFavorites(new Set(data.map(f => f.favorited_user_id)));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

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
      
      let query = supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          bio,
          avatar_url,
          user_type,
          artist_profiles (
            artistic_branches,
            location
          ),
          organizer_profiles (
            preferred_branches,
            company_name,
            location
          )
        `)
        .eq("user_type", targetType)
        .neq("id", user.id);

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      let formattedData = data?.map(profile => ({
        ...profile,
        artist_profile: profile.artist_profiles?.[0],
        organizer_profile: profile.organizer_profiles?.[0],
      })) || [];

      // Apply filters
      if (locationFilter) {
        formattedData = formattedData.filter(p => {
          const location = p.artist_profile?.location || p.organizer_profile?.location;
          return location?.toLowerCase().includes(locationFilter.toLowerCase());
        });
      }

      if (branchFilter && currentProfile.user_type === 'organizer') {
        formattedData = formattedData.filter(p =>
          p.artist_profile?.artistic_branches?.includes(branchFilter)
        );
      }

      setProfiles(formattedData);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar perfis");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (profileId: string) => {
    if (!user) return;

    try {
      if (favorites.has(profileId)) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('favorited_user_id', profileId);
        
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(profileId);
          return newSet;
        });
        toast.success("Removido dos favoritos");
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, favorited_user_id: profileId });
        
        setFavorites(prev => new Set(prev).add(profileId));
        toast.success("Adicionado aos favoritos!");
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Erro ao atualizar favoritos");
    }
  };

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
                onClick={() => navigate("/messages")}
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
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
            <div className="mb-6 space-y-4">
              <h2 className="text-xl font-semibold">
                {currentUserType === "artist" 
                  ? "Organizadores que podem te contratar" 
                  : "Artistas disponíveis"}
              </h2>

              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Input
                  placeholder="Localização..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-40"
                />
                {currentUserType === 'organizer' && (
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Ramo artístico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {Object.entries(branchLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={fetchProfiles}>Filtrar</Button>
              </div>
            </div>

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
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(profile.id);
                            }}
                          >
                            <Heart
                              className={`h-5 w-5 ${favorites.has(profile.id) ? 'fill-artist text-artist' : ''}`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/messages", { state: { userId: profile.id } });
                            }}
                          >
                            <MessageCircle className="h-5 w-5" />
                          </Button>
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
