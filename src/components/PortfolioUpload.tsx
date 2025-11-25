import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface PortfolioUploadProps {
  userId: string;
  currentItems: string[];
  onUploadComplete: (items: string[]) => void;
}

export const PortfolioUpload = ({ userId, currentItems, onUploadComplete }: PortfolioUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const files = Array.from(event.target.files);
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('portfolio').getPublicUrl(filePath);
        return data.publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      const updatedItems = [...currentItems, ...newUrls];

      const { error: updateError } = await supabase
        .from('artist_profiles')
        .update({ 
          portfolio_items: updatedItems.map(url => ({ url, type: 'image' }))
        })
        .eq('profile_id', userId);

      if (updateError) throw updateError;

      onUploadComplete(updatedItems);
      toast.success("Imagens adicionadas ao portfólio!");
    } catch (error) {
      console.error('Error uploading portfolio:', error);
      toast.error("Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (urlToRemove: string) => {
    try {
      const updatedItems = currentItems.filter(url => url !== urlToRemove);

      const { error } = await supabase
        .from('artist_profiles')
        .update({ 
          portfolio_items: updatedItems.map(url => ({ url, type: 'image' }))
        })
        .eq('profile_id', userId);

      if (error) throw error;

      onUploadComplete(updatedItems);
      toast.success("Imagem removida!");
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error("Erro ao remover imagem");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {currentItems.map((url, index) => (
          <div key={index} className="relative group aspect-square">
            <img 
              src={url} 
              alt={`Portfolio ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => handleRemove(url)}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      
      <label htmlFor="portfolio-upload">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="w-full"
          onClick={() => document.getElementById('portfolio-upload')?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Enviando..." : "Adicionar Imagens"}
        </Button>
        <input
          id="portfolio-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>
  );
};
