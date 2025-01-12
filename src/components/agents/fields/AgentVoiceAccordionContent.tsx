import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { useVoices } from "@/hooks/useVoices";
import { type AgentFormValues } from "../AgentFormSchema";

interface AgentVoiceAccordionContentProps {
  form: UseFormReturn<AgentFormValues>;
  onPlayVoice: (voiceId: string) => void;
  isPlaying: boolean;
  currentVoiceId: string | null;
}

export function AgentVoiceAccordionContent({
  form,
  onPlayVoice,
  isPlaying,
  currentVoiceId,
}: AgentVoiceAccordionContentProps) {
  const { data: voices, isLoading } = useVoices();
  const selectedLanguage = form.watch("language");
  const filteredVoices = voices?.filter(voice => voice.language === selectedLanguage) ?? [];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading voices...</p>;
  }

  if (!selectedLanguage) {
    return <p className="text-sm text-muted-foreground">Please select a language first</p>;
  }

  if (filteredVoices.length === 0) {
    return <p className="text-sm text-muted-foreground">No voices available for selected language</p>;
  }

  return (
    <div className="space-y-2">
      {filteredVoices.map((voice) => (
        <div key={voice.id} className="flex items-center justify-between p-2 rounded hover:bg-accent">
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={voice.id}
              checked={form.watch("voice_id") === voice.id}
              onClick={() => form.setValue("voice_id", voice.id)}
            />
            <Label>{voice.name}</Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPlayVoice(voice.id)}
          >
            {isPlaying && currentVoiceId === voice.id ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}