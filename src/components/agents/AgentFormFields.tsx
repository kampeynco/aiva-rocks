import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AgentBasicFields } from "./AgentBasicFields";
import { AgentPromptField } from "./AgentPromptField";
import { AgentSettingsAccordion } from "./AgentSettingsAccordion";
import { type AgentFormValues } from "./AgentFormSchema";

interface AgentFormFieldsProps {
  form: UseFormReturn<AgentFormValues>;
  phoneNumbers?: any[];
  isLoadingPhoneNumbers?: boolean;
  onPhoneNumberChange?: (value: string) => void;
}

export function AgentFormFields({
  form,
  phoneNumbers,
  isLoadingPhoneNumbers,
  onPhoneNumberChange,
}: AgentFormFieldsProps) {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVoiceId, setCurrentVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayVoice = async (voiceId: string) => {
    if (!voiceId) return;

    try {
      if (isPlaying && currentVoiceId === voiceId) {
        audioRef.current?.pause();
        setIsPlaying(false);
        return;
      }

      const { data: voices } = await supabase
        .from("voices")
        .select("*")
        .eq("id", voiceId)
        .single();

      if (!voices?.storage_path) {
        toast({
          title: "Error",
          description: "No preview available for this voice",
          variant: "destructive",
        });
        return;
      }

      const { data } = supabase.storage
        .from("voice-previews")
        .getPublicUrl(voices.storage_path);

      if (!data?.publicUrl) {
        toast({
          title: "Error",
          description: "Could not load voice preview",
          variant: "destructive",
        });
        return;
      }

      if (audioRef.current) {
        audioRef.current.src = data.publicUrl;
        await audioRef.current.play();
        setIsPlaying(true);
        setCurrentVoiceId(voiceId);
      }
    } catch (error) {
      console.error("Error playing voice preview:", error);
      toast({
        title: "Error",
        description: "Failed to play voice preview",
        variant: "destructive",
      });
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentVoiceId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-6 h-full">
      <div className="space-y-6">
        <AgentBasicFields
          form={form}
          phoneNumbers={phoneNumbers}
          isLoadingPhoneNumbers={isLoadingPhoneNumbers}
          onPhoneNumberChange={onPhoneNumberChange}
          onPlayVoice={handlePlayVoice}
          isPlaying={isPlaying}
          currentVoiceId={currentVoiceId}
        />
        <AgentSettingsAccordion />
      </div>

      <div className="h-full">
        <AgentPromptField form={form} />
      </div>

      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={() => {
          setIsPlaying(false);
          setCurrentVoiceId(null);
          toast({
            title: "Error",
            description: "Failed to play voice preview",
            variant: "destructive",
          });
        }}
      />
    </div>
  );
}