import { UseFormReturn } from "react-hook-form";
import { Play, Square } from "lucide-react";
import { useVoices } from "@/hooks/useVoices";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type AgentFormValues } from "./AgentFormSchema";
import { useMemo } from "react";

interface AgentBasicFieldsProps {
  form: UseFormReturn<AgentFormValues>;
  onPlayVoice: (voiceId: string) => void;
  isPlaying: boolean;
  currentVoiceId: string | null;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
];

export function AgentBasicFields({
  form,
  onPlayVoice,
  isPlaying,
  currentVoiceId,
}: AgentBasicFieldsProps) {
  const { data: voices, isLoading: isLoadingVoices } = useVoices();
  const selectedLanguage = form.watch("language");

  const filteredVoices = useMemo(() => {
    if (!voices) return [];
    return voices.filter(voice => voice.language === selectedLanguage);
  }, [voices, selectedLanguage]);

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder="Agent name" {...field} className="text-2xl font-semibold" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="llm_model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LLM Model</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ultravox_realtime_70b">Ultravox Realtime 70B</SelectItem>
                    <SelectItem value="ultravox_realtime_8b">Ultravox Realtime 8B</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
      </div>
    </div>
  );
}