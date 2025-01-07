import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Play, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVoices } from "@/hooks/useVoices";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
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
import { Textarea } from "@/components/ui/textarea";
import { formSchema, type AgentFormValues } from "./AgentFormSchema";

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
  onPhoneNumberChange 
}: AgentFormFieldsProps) {
  const { toast } = useToast();
  const { data: voices, isLoading: isLoadingVoices } = useVoices();
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
      const voice = voices?.find((v) => v.id === voiceId);
      if (!voice?.storage_path) {
        toast({
          title: "Error",
          description: "No preview available for this voice",
          variant: "destructive",
        });
        return;
      }

      if (isPlaying && currentVoiceId === voiceId) {
        audioRef.current?.pause();
        setIsPlaying(false);
        return;
      }

      const { data } = supabase.storage
        .from("voice-previews")
        .getPublicUrl(voice.storage_path);

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
    <>
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
        name="prompt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Prompt</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter the agent's prompt..."
                className="min-h-[100px]"
                {...field}
              />
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
                    {voices?.map((voice) => (
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
                onClick={() => handlePlayVoice(field.value!)}
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

      <FormField
        control={form.control}
        name="phone_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Select
                disabled={isLoadingPhoneNumbers}
                onValueChange={(value) => {
                  field.onChange(value);
                  onPhoneNumberChange?.(value);
                }}
                value={field.value}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a phone number" />
                </SelectTrigger>
                <SelectContent>
                  {phoneNumbers?.map((number) => (
                    <SelectItem key={number.id} value={number.phone_number}>
                      {number.phone_number}
                    </SelectItem>
                  ))}
                  <SelectItem value="buy">+ Buy new number</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
    </>
  );
}