import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import webPattern from "@/assets/web-pattern.jpg";

const registerSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
  fullName: z.string().trim().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }).max(100),
});

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") as "artist" | "organizer" | null;
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userType || (userType !== "artist" && userType !== "organizer")) {
      navigate("/");
    }
  }, [userType, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userType) return;

    try {
      const validatedData = registerSchema.parse({ email, password, fullName });
      setLoading(true);

      const redirectUrl = `${window.location.origin}/onboarding?type=${userType}`;
      
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validatedData.fullName,
            user_type: userType,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email já está cadastrado");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: validatedData.email,
            full_name: validatedData.fullName,
            user_type: userType,
          });

        if (profileError) {
          toast.error("Erro ao criar perfil");
          return;
        }

        toast.success("Conta criada com sucesso!");
        navigate(`/onboarding?type=${userType}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userType) return null;

  const isArtist = userType === "artist";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${webPattern})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-border/50 backdrop-blur-sm bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle className={`text-2xl font-bold text-center ${
              isArtist ? "text-artist-glow" : "text-organizer-glow"
            }`}>
              Cadastro de {isArtist ? "Artista" : "Organizador"}
            </CardTitle>
            <CardDescription className="text-center">
              Crie sua conta para começar a se conectar
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
            </CardContent>
            <div className="px-6 pb-6">
              <Button 
                type="submit" 
                variant={isArtist ? "artist" : "organizer"}
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Criando conta..." : "Continuar"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
