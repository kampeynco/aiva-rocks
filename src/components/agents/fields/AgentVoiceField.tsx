import { UseFormReturn } from "react-hook-form";
import { Play, Square } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { type AgentFormValues } from "../AgentFormSchema";
import { useVoices } from "@/hooks/useVoices";

interface AgentVoiceFieldProps {
  form: UseFormReturn<AgentFormValues>;
  onPlayVoice: (voiceId: string) => void;
  isPlaying: boolean;
  currentVoiceId: string | null;
}

export function AgentVoiceField({
  form,
  onPlayVoice,
  isPlaying,
  currentVoiceId,
}: AgentVoiceFieldProps) {
  const { data: voices, isLoading: isLoadingVoices } = useVoices();
  const selectedLanguage = form.watch("language");

  const filteredVoices = voices?.filter(voice => voice.language === selectedLanguage) ?? [];

  return (
    <FormField
      control={form.control}
      name="voice_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Voice</FormLabel>
          <div className="flex gap-2 items-center">
            <FormControl>
              <Select
                disabled={isLoadingVoices}
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!field.value}
              onClick={() => onPlayVoice(field.value!)}
            >
              {isPlaying && currentVoiceId === field.value ? (
                <Square className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}