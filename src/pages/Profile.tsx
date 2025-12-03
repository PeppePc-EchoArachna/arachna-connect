import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const eventTypes = [
  { id: "corporate", label: "Eventos Corporativos" },
  { id: "wedding", label: "Casamentos" },
  { id: "birthday", label: "Aniversários" },
  { id: "festival", label: "Festivais" },
  { id: "concert", label: "Shows/Concertos" },
  { id: "private_party", label: "Festas Privadas" },
  { id: "cultural", label: "Eventos Culturais" },
  { id: "sports", label: "Eventos Esportivos" },
  { id: "conference", label: "Conferências" },
  { id: "other", label: "Outro" },
];

const budgetRanges = [
  { id: "up_to_1k", label: "Até R$ 1.000" },
  { id: "1k_5k", label: "R$ 1.000 - R$ 5.000" },
  { id: "5k_10k", label: "R$ 5.000 - R$ 10.000" },
  { id: "10k_25k", label: "R$ 10.000 - R$ 25.000" },
  { id: "25k_50k", label: "R$ 25.000 - R$ 50.000" },
  { id: "above_50k", label: "Acima de R$ 50.000" },
];

const eventFrequencies = [
  { id: "weekly", label: "Semanalmente" },
  { id: "monthly", label: "Mensalmente" },
  { id: "quarterly", label: "Trimestralmente" },
  { id: "yearly", label: "Anualmente" },
  { id: "occasional", label: "Ocasionalmente" },
];

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

  // Organizer fields
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState("");
  const [eventFrequency, setEventFrequency] = useState("");
  const [companyName, setCompanyName] = useState("");

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

        if (data?.user_type === 'organizer') {
          const { data: organizerProfile } = await supabase
            .from("organizer_profiles")
            .select("*")
            .eq("profile_id", user.id)
            .maybeSingle();

          if (organizerProfile) {
            setSelectedEventTypes(Array.isArray(organizerProfile.event_types) ? organizerProfile.event_types : []);
            setBudgetRange(typeof organizerProfile.budget_range === 'string' ? organizerProfile.budget_range : "");
            setEventFrequency(typeof organizerProfile.event_frequency === 'string' ? organizerProfile.event_frequency : "");
            setCompanyName(typeof organizerProfile.company_name === 'string' ? organizerProfile.company_name : "");
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

  const handleToggleEventType = (eventId: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

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

      // Update organizer profile if applicable
      if (userType === "organizer") {
        const { error: organizerError } = await supabase
          .from("organizer_profiles")
          .update({
            event_types: selectedEventTypes,
            budget_range: budgetRange || null,
            event_frequency: eventFrequency || null,
            company_name: companyName || null,
          })
          .eq("profile_id", user.id);

        if (organizerError) throw organizerError;
      }

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

              {userType === "organizer" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa (opcional)</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nome da sua empresa ou organização"
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

              {userType === "organizer" && (
                <>
                  <div className="space-y-2">
                    <Label>Tipos de Eventos</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {eventTypes.map((event) => (
                        <label
                          key={event.id}
                          htmlFor={`event-${event.id}`}
                          className="flex items-center space-x-2 p-2 rounded-lg border border-border/50 hover:border-organizer-glow/50 transition-colors cursor-pointer"
                        >
                          <Checkbox
                            id={`event-${event.id}`}
                            checked={selectedEventTypes.includes(event.id)}
                            onCheckedChange={() => handleToggleEventType(event.id)}
                          />
                          <span className="flex-1 text-sm">
                            {event.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetRange">Faixa de Orçamento por Evento</Label>
                    <Select value={budgetRange || undefined} onValueChange={setBudgetRange}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Selecione uma faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((range) => (
                          <SelectItem key={range.id} value={range.id}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventFrequency">Frequência de Eventos</Label>
                    <Select value={eventFrequency || undefined} onValueChange={setEventFrequency}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Com que frequência organiza eventos?" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventFrequencies.map((freq) => (
                          <SelectItem key={freq.id} value={freq.id}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
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
