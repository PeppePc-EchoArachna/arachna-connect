import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") as "artist" | "organizer" | null;
  const { user, loading: authLoading } = useAuth();
  
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
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

  const handleComplete = async () => {
    if (!user || !userType) return;

    if (selectedBranches.length === 0) {
      toast.error("Selecione pelo menos uma opção");
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
            preferred_branches: selectedBranches as any,
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
              {isArtist ? "Quais são suas áreas artísticas?" : "Que tipo de artistas você procura?"}
            </CardTitle>
            <CardDescription className="text-center">
              Selecione todas as opções que se aplicam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <Button
              onClick={handleComplete}
              variant={isArtist ? "artist" : "organizer"}
              className="w-full"
              disabled={loading || selectedBranches.length === 0}
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
