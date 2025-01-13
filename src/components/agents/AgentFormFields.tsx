import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AgentBasicFields } from "./AgentBasicFields";
import { AgentPromptField } from "./AgentPromptField";
import { AgentSettingsAccordion } from "./AgentSettingsAccordion";
import { type AgentFormValues } from "./AgentFormSchema";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function for audio resources
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsPlaying(false);
      setCurrentVoiceId(null);
    };
  }, []);

  // Watch for language changes to reset voice if needed
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'language') {
        const currentVoiceId = form.getValues('voice_id');
        if (currentVoiceId) {
          // Reset voice selection when language changes
          form.setValue('voice_id', '', { shouldValidate: true });
          toast({
            title: "Voice Reset",
            description: "Voice selection has been reset due to language change",
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, toast]);

  const handlePlayVoice = async (voiceId: string) => {
    if (!voiceId) return;

    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Stop current playback if playing the same voice
      if (isPlaying && currentVoiceId === voiceId) {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          setCurrentVoiceId(null);
        }
        return;
      }

      setIsLoadingPreview(true);
      abortControllerRef.current = new AbortController();

      const { data: voice, error: voiceError } = await supabase
        .from("voices")
        .select("*")
        .eq("id", voiceId)
        .single();

      if (voiceError || !voice) {
        throw new Error(voiceError?.message || "Voice not found");
      }

      if (!voice.storage_path && !voice.preview_url) {
        throw new Error("No preview available for this voice");
      }

      const previewUrl = voice.preview_url || (voice.storage_path ? 
        supabase.storage
          .from("voice-previews")
          .getPublicUrl(voice.storage_path).data.publicUrl : null);

      if (!previewUrl) {
        throw new Error("Could not load voice preview");
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        
        const response = await fetch(previewUrl, {
          signal: abortControllerRef.current.signal
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch audio preview");
        }

        audioRef.current.src = previewUrl;
        await audioRef.current.play();
        setIsPlaying(true);
        setCurrentVoiceId(voiceId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore abort errors
      }
      console.error("Error playing voice preview:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to play voice preview",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentVoiceId(null);
  };

  return (
    <ErrorBoundary>
      <div className="container flex flex-col space-y-6">
        <AgentBasicFields 
          form={form} 
          phoneNumbers={phoneNumbers}
          isLoadingPhoneNumbers={isLoadingPhoneNumbers}
          onPhoneNumberChange={onPhoneNumberChange}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-6">
          <div>
            <AgentSettingsAccordion
              form={form}
              onPlayVoice={handlePlayVoice}
              isPlaying={isPlaying}
              currentVoiceId={currentVoiceId}
              isLoadingPreview={isLoadingPreview}
            />
          </div>

          <div>
            <AgentPromptField form={form} />
          </div>
        </div>

        <audio
          ref={audioRef}
          onEnded={handleAudioEnded}
          onError={() => {
            setIsPlaying(false);
            setCurrentVoiceId(null);
            setIsLoadingPreview(false);
            toast({
              title: "Error",
              description: "Failed to play voice preview",
              variant: "destructive",
            });
          }}
        />
      </div>
    </ErrorBoundary>
  );
}