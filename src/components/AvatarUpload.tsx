import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string;
  onUploadComplete: (url: string) => void;
}

export const AvatarUpload = ({ userId, currentAvatarUrl, onUploadComplete }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onUploadComplete(data.publicUrl);
      toast.success("Avatar atualizado!");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Erro ao fazer upload do avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32">
        <AvatarImage src={currentAvatarUrl} />
        <AvatarFallback className="bg-primary/20 text-primary text-2xl">
          ?
        </AvatarFallback>
      </Avatar>
      <label htmlFor="avatar-upload">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="cursor-pointer"
          onClick={() => document.getElementById('avatar-upload')?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Enviando..." : "Upload Avatar"}
        </Button>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>
  );
};
