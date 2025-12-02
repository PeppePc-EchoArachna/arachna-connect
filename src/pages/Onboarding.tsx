import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import webPattern from "@/assets/web-pattern.jpg";

const artisticBranches = [
  { id: "music", label: "Música" },
  { id: "dance", label: "Dança" },
  { id: "theater", label: "Teatro" },
  { id: "visual_arts", label: "Artes Visuais" },
  { id: "circus", label: "Circo" },
  { id: "magic", label: "Mágica" },
  { id: "comedy", label: "Comédia" },
  { id: "dj", label: "DJ" },
  { id: "live_painting", label: "Pintura ao Vivo" },
  { id: "performance", label: "Performance" },
  { id: "other", label: "Outro" },
];

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

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") as "artist" | "organizer" | null;
  const { user, loading: authLoading } = useAuth();
  
  // Artist state
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  
  // Organizer state
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState("");
  const [eventFrequency, setEventFrequency] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!userType || (userType !== "artist" && userType !== "organizer")) {
      navigate("/");
    }
  }, [userType, navigate]);

  const handleToggleBranch = (branchId: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const handleToggleEventType = (eventId: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleComplete = async () => {
    if (!user || !userType) return;

    if (userType === "artist" && selectedBranches.length === 0) {
      toast.error("Selecione pelo menos uma área artística");
      return;
    }

    if (userType === "organizer" && selectedEventTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de evento");
      return;
    }

    setLoading(true);

    try {
      if (userType === "artist") {
        const { error } = await supabase
          .from("artist_profiles")
          .insert([{
            profile_id: user.id,
            artistic_branches: selectedBranches as any,
          }]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("organizer_profiles")
          .insert([{
            profile_id: user.id,
            event_types: selectedEventTypes,
            budget_range: budgetRange || null,
            event_frequency: eventFrequency || null,
            company_name: companyName || null,
          }]);

        if (error) throw error;
      }

      toast.success("Perfil configurado com sucesso!");
      navigate("/feed");
    } catch (error: any) {
      toast.error(error.message || "Erro ao configurar perfil");
    } finally {
      setLoading(false);
    }
  };

  if (!userType || authLoading) return null;

  const isArtist = userType === "artist";

  const isOrganizerFormValid = selectedEventTypes.length > 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${webPattern})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        <Card className="border-border/50 backdrop-blur-sm bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle className={`text-2xl font-bold text-center ${
              isArtist ? "text-artist-glow" : "text-organizer-glow"
            }`}>
              {isArtist ? "Quais são suas áreas artísticas?" : "Conte-nos sobre seus eventos"}
            </CardTitle>
            <CardDescription className="text-center">
              {isArtist 
                ? "Selecione todas as opções que se aplicam" 
                : "Preencha as informações sobre os eventos que você organiza"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isArtist ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artisticBranches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center space-x-3 p-4 rounded-lg border border-border/50 hover:border-accent transition-colors cursor-pointer"
                    onClick={() => handleToggleBranch(branch.id)}
                  >
                    <Checkbox
                      id={branch.id}
                      checked={selectedBranches.includes(branch.id)}
                      onCheckedChange={() => handleToggleBranch(branch.id)}
                    />
                    <Label
                      htmlFor={branch.id}
                      className="cursor-pointer flex-1 text-sm"
                    >
                      {branch.label}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Company Name */}
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

                {/* Event Types */}
                <div className="space-y-2">
                  <Label>Tipos de Eventos que Organiza *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {eventTypes.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-organizer-glow/50 transition-colors cursor-pointer"
                        onClick={() => handleToggleEventType(event.id)}
                      >
                        <Checkbox
                          id={event.id}
                          checked={selectedEventTypes.includes(event.id)}
                          onCheckedChange={() => handleToggleEventType(event.id)}
                        />
                        <Label
                          htmlFor={event.id}
                          className="cursor-pointer flex-1 text-sm"
                        >
                          {event.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Range */}
                <div className="space-y-2">
                  <Label htmlFor="budgetRange">Faixa de Orçamento por Evento (opcional)</Label>
                  <Select value={budgetRange} onValueChange={setBudgetRange}>
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

                {/* Event Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="eventFrequency">Frequência de Eventos (opcional)</Label>
                  <Select value={eventFrequency} onValueChange={setEventFrequency}>
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
              </div>
            )}

            <Button
              onClick={handleComplete}
              variant={isArtist ? "artist" : "organizer"}
              className="w-full"
              disabled={loading || (isArtist ? selectedBranches.length === 0 : !isOrganizerFormValid)}
            >
              {loading ? "Salvando..." : "Completar Cadastro"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
