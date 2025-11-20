import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Mic2, Calendar } from "lucide-react";
import webPattern from "@/assets/web-pattern.jpg";
import batWings from "@/assets/bat-wings.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Web Pattern */}
      <div 
        className="absolute inset-0 opacity-20 animate-web-shimmer"
        style={{
          backgroundImage: `url(${webPattern})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo/Wings */}
        <div className="mb-8 animate-float">
          <img 
            src={batWings} 
            alt="EchoArachna Wings" 
            className="w-32 h-32 md:w-48 md:h-48 object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold text-center mb-4 bg-gradient-to-r from-artist-glow to-organizer-glow bg-clip-text text-transparent">
          EchoArachna
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground text-center mb-12 max-w-2xl">
          Conectando artistas e organizadores de eventos em uma teia de possibilidades
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button 
            variant="artist" 
            size="xl"
            onClick={() => navigate("/register?type=artist")}
            className="gap-3"
          >
            <Mic2 className="w-5 h-5" />
            Sou Artista
          </Button>
          
          <Button 
            variant="organizer" 
            size="xl"
            onClick={() => navigate("/register?type=organizer")}
            className="gap-3"
          >
            <Calendar className="w-5 h-5" />
            Sou Organizador
          </Button>
        </div>

        {/* Login Link */}
        <button
          onClick={() => navigate("/login")}
          className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          Já tem uma conta? Faça login
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-artist/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-organizer/10 rounded-full blur-3xl animate-pulse-glow" />
    </div>
  );
};

export default Landing;
