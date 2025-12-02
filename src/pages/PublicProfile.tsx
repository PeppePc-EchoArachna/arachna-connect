import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MessageCircle, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import webPattern from "@/assets/web-pattern.jpg";

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  pronouns?: string;
  bio?: string;
  avatar_url?: string;
  user_type: "artist" | "organizer";
  artist_profile?: {
    artistic_branches: string[];
    location?: string;
    portfolio_items?: any[];
    skills?: string[];
    experience_years?: number;
    availability?: string;
  };
  organizer_profile?: {
    preferred_branches: string[];
    company_name?: string;
    location?: string;
    event_types?: string[];
    event_frequency?: string;
    budget_range?: string;
  };
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchProfile();
    checkFavorite();
  }, [id, user, navigate]);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (profileData.user_type === "artist") {
        const { data: artistProfile } = await supabase
          .from("artist_profiles")
          .select("*")
          .eq("profile_id", id)
          .single();

        setProfile({
          ...profileData,
          artist_profile: artistProfile ? {
            ...artistProfile,
            portfolio_items: Array.isArray(artistProfile.portfolio_items) 
              ? artistProfile.portfolio_items 
              : []
          } : undefined,
        });
      } else {
        const { data: organizerProfile } = await supabase
          .from("organizer_profiles")
          .select("*")
          .eq("profile_id", id)
          .single();

        setProfile({
          ...profileData,
          organizer_profile: organizerProfile || undefined,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("favorited_user_id", id)
        .maybeSingle();

      setIsFavorited(!!data);
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !id) return;

    try {
      if (isFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("favorited_user_id", id);

        setIsFavorited(false);
        toast.success("Removido dos favoritos");
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, favorited_user_id: id });

        setIsFavorited(true);
        toast.success("Adicionado aos favoritos!");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Perfil não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${webPattern})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/feed")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleFavorite}>
              <Heart
                className={`h-5 w-5 ${isFavorited ? "fill-artist text-artist" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/messages", { state: { userId: id } })}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Card className="border-border/50 backdrop-blur-sm bg-card/90">
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-3xl">
                  {profile.full_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">
                  {profile.full_name}
                  {profile.pronouns && (
                    <span className="text-lg text-muted-foreground ml-2">
                      ({profile.pronouns})
                    </span>
                  )}
                </CardTitle>

                <p className="text-muted-foreground capitalize mb-4">
                  {profile.user_type === "artist" ? "Artista" : "Organizador"}
                </p>

                {profile.organizer_profile?.company_name && (
                  <p className="text-lg mb-4">
                    {profile.organizer_profile.company_name}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {(profile.artist_profile?.artistic_branches ||
                    profile.organizer_profile?.preferred_branches ||
                    []
                  ).map((branch) => (
                    <Badge
                      key={branch}
                      variant="secondary"
                      className={
                        profile.user_type === "artist"
                          ? "bg-artist/20 text-artist-foreground"
                          : "bg-organizer/20 text-organizer-foreground"
                      }
                    >
                      {branchLabels[branch] || branch}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Contact Section */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <h3 className="font-semibold mb-3">Contato</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-background hover:bg-accent transition-colors"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{profile.email}</span>
                </a>
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-background hover:bg-accent transition-colors"
                  >
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phone}</span>
                  </a>
                )}
              </div>
            </div>

            {profile.bio && (
              <div>
                <h3 className="font-semibold mb-2">Sobre</h3>
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {profile.artist_profile?.location && (
              <div>
                <h3 className="font-semibold mb-2">Localização</h3>
                <p className="text-muted-foreground">
                  {profile.artist_profile.location}
                </p>
              </div>
            )}

            {profile.organizer_profile?.location && (
              <div>
                <h3 className="font-semibold mb-2">Localização</h3>
                <p className="text-muted-foreground">
                  {profile.organizer_profile.location}
                </p>
              </div>
            )}

            {profile.artist_profile?.experience_years && (
              <div>
                <h3 className="font-semibold mb-2">Experiência</h3>
                <p className="text-muted-foreground">
                  {profile.artist_profile.experience_years} anos
                </p>
              </div>
            )}

            {profile.artist_profile?.availability && (
              <div>
                <h3 className="font-semibold mb-2">Disponibilidade</h3>
                <p className="text-muted-foreground">
                  {profile.artist_profile.availability}
                </p>
              </div>
            )}

            {profile.artist_profile?.skills &&
              profile.artist_profile.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Habilidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.artist_profile.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {profile.organizer_profile?.event_types &&
              profile.organizer_profile.event_types.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tipos de Eventos</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.organizer_profile.event_types.map((type, index) => (
                      <Badge key={index} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {profile.organizer_profile?.event_frequency && (
              <div>
                <h3 className="font-semibold mb-2">Frequência de Eventos</h3>
                <p className="text-muted-foreground">
                  {profile.organizer_profile.event_frequency}
                </p>
              </div>
            )}

            {profile.organizer_profile?.budget_range && (
              <div>
                <h3 className="font-semibold mb-2">Faixa de Orçamento</h3>
                <p className="text-muted-foreground">
                  {profile.organizer_profile.budget_range}
                </p>
              </div>
            )}

            {profile.artist_profile?.portfolio_items &&
              Array.isArray(profile.artist_profile.portfolio_items) &&
              profile.artist_profile.portfolio_items.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Portfólio</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.artist_profile.portfolio_items.map(
                      (item: any, index: number) => (
                        <div
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden"
                        >
                          <img
                            src={item.url || item}
                            alt={`Portfolio ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
