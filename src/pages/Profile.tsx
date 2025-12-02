import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import webPattern from "@/assets/web-pattern.jpg";
import { z } from "zod";
import { AvatarUpload } from "@/components/AvatarUpload";
import { PortfolioUpload } from "@/components/PortfolioUpload";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
  pronouns: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
});

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"artist" | "organizer" | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [portfolioItems, setPortfolioItems] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFullName(data.full_name);
          setPronouns(data.pronouns || "");
          setBio(data.bio || "");
          setPhone(data.phone || "");
          setUserType(data.user_type);
          setAvatarUrl(data.avatar_url || "");
        }

        if (data?.user_type === 'artist') {
          const { data: artistProfile } = await supabase
            .from("artist_profiles")
            .select("portfolio_items")
            .eq("profile_id", user.id)
            .single();

          if (artistProfile?.portfolio_items && Array.isArray(artistProfile.portfolio_items)) {
            setPortfolioItems(
              artistProfile.portfolio_items.map((item: any) => item.url || item)
            );
          }
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const validatedData = profileSchema.parse({ 
        full_name: fullName, 
        pronouns, 
        bio,
        phone 
      });

      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validatedData.full_name,
          pronouns: validatedData.pronouns || null,
          bio: validatedData.bio || null,
          phone: validatedData.phone || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erro ao atualizar perfil");
      }
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
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

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/feed")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-border/50 backdrop-blur-sm bg-card/90">
          <CardHeader>
            <div className="mb-4">
              <AvatarUpload
                userId={user!.id}
                currentAvatarUrl={avatarUrl}
                onUploadComplete={setAvatarUrl}
              />
              <div className="text-center mt-4">
                <CardTitle className={userType === "artist" ? "text-artist-glow" : "text-organizer-glow"}>
                  Meu Perfil
                </CardTitle>
                <CardDescription>
                  {userType === "artist" ? "Perfil de Artista" : "Perfil de Organizador"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background/50"
                  required
                />
              </div>

              {userType === "artist" && (
                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronomes (opcional)</Label>
                  <Input
                    id="pronouns"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="ele/dele, ela/dela, etc."
                    className="bg-background/50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">Celular (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="bg-background/50"
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (opcional)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  className="bg-background/50 min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 caracteres
                </p>
              </div>

              {userType === 'artist' && (
                <div className="space-y-2">
                  <Label>Portfólio</Label>
                  <PortfolioUpload
                    userId={user!.id}
                    currentItems={portfolioItems}
                    onUploadComplete={setPortfolioItems}
                  />
                </div>
              )}

              <Button
                type="submit"
                variant={userType === "artist" ? "artist" : "organizer"}
                className="w-full"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
