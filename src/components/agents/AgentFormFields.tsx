import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useVoices } from "@/hooks/useVoices";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { formSchema } from "./AgentFormSchema";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AgentFormFieldsProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  phoneNumbers?: { id: string; phone_number: string; friendly_name?: string }[];
  isLoadingPhoneNumbers: boolean;
  onPhoneNumberChange: (value: string) => void;
}

export const AgentFormFields = ({
  form,
  phoneNumbers,
  isLoadingPhoneNumbers,
  onPhoneNumberChange,
}: AgentFormFieldsProps) => {
  const { data: voices, isLoading: isLoadingVoices } = useVoices();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const playPreview = async (voiceId: string) => {
    const voice = voices?.find(v => v.id === voiceId);
    if (!voice?.storage_path) return;

    // Stop current audio if playing
    if (currentlyPlaying) {
      const audio = document.getElementById(currentlyPlaying) as HTMLAudioElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }

    // Get public URL for the preview
    const { data: { publicUrl } } = supabase.storage
      .from('voice-previews')
      .getPublicUrl(voice.storage_path);

    // Create or get audio element
    let audio = document.getElementById(voiceId) as HTMLAudioElement;
    if (!audio) {
      audio = new Audio(publicUrl);
      audio.id = voiceId;
      audio.addEventListener('ended', () => setCurrentlyPlaying(null));
    }

    if (currentlyPlaying === voiceId) {
      setCurrentlyPlaying(null);
    } else {
      audio.play();
      setCurrentlyPlaying(voiceId);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Agent name" {...field} />
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingVoices ? "Loading voices..." : "Select a voice"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {voices?.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        {voice.name}
                        {voice.description && (
                          <span className="text-sm text-muted-foreground ml-2">
                            {voice.description}
                          </span>
                        )}
                      </div>
                      {voice.storage_path && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={(e) => {
                            e.preventDefault();
                            playPreview(voice.id);
                          }}
                        >
                          <Play className={`h-4 w-4 ${currentlyPlaying === voice.id ? 'text-primary' : ''}`} />
                        </Button>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <Select
                onValueChange={onPhoneNumberChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingPhoneNumbers ? "Loading..." : "Select a phone number"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {phoneNumbers?.length === 0 && (
                    <SelectItem value="buy">Buy a Phone Number</SelectItem>
                  )}
                  {phoneNumbers?.map((number) => (
                    <SelectItem key={number.id} value={number.phone_number}>
                      {number.friendly_name || number.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="prompt"
        render={({ field }) => (
          <FormItem className="h-full">
            <FormLabel>Prompt</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter the agent's conversation prompt..."
                className="h-[calc(100%-2rem)] min-h-[150px] resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};