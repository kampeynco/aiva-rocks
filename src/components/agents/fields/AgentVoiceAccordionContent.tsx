import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Play, Square, AlertCircle, Loader2 } from "lucide-react";
import { useVoices } from "@/hooks/useVoices";
import { type AgentFormValues } from "../AgentFormSchema";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface AgentVoiceAccordionContentProps {
  form: UseFormReturn<AgentFormValues>;
  onPlayVoice: (voiceId: string) => void;
  isPlaying: boolean;
  currentVoiceId: string | null;
  isLoadingPreview: boolean;
}

export function AgentVoiceAccordionContent({
  form,
  onPlayVoice,
  isPlaying,
  currentVoiceId,
  isLoadingPreview,
}: AgentVoiceAccordionContentProps) {
  const { data: voices, isLoading, error } = useVoices();
  const selectedLanguage = form.watch("language");
  const { toast } = useToast();
  
  const filteredVoices = voices?.filter(voice => voice.language === selectedLanguage) ?? [];

  useEffect(() => {
    const currentVoiceId = form.getValues("voice_id");
    if (currentVoiceId && !filteredVoices.some(voice => voice.id === currentVoiceId)) {
      form.setValue("voice_id", "", { shouldValidate: true });
      toast({
        title: "Voice Reset",
        description: "Voice selection has been reset due to language change",
      });
    }
  }, [selectedLanguage, filteredVoices, form, toast]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load voices. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!selectedLanguage) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a language first
        </AlertDescription>
      </Alert>
    );
  }

  if (filteredVoices.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No voices available for {selectedLanguage}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <RadioGroup
      value={form.watch("voice_id")}
      onValueChange={(value) => form.setValue("voice_id", value, { shouldValidate: true })}
      className="space-y-2"
    >
      {filteredVoices.map((voice) => (
        <div 
          key={voice.id} 
          className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={voice.id} id={voice.id} />
            <Label htmlFor={voice.id} className="cursor-pointer">
              {voice.name}
              {voice.description && (
                <span className="block text-sm text-muted-foreground">
                  {voice.description}
                </span>
              )}
            </Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPlayVoice(voice.id)}
            className={isPlaying && currentVoiceId === voice.id ? 'bg-accent' : ''}
            disabled={isLoadingPreview}
          >
            {isLoadingPreview && currentVoiceId === voice.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying && currentVoiceId === voice.id ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </RadioGroup>
  );
}