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
  phoneNumbers?: any[];
  isLoadingPhoneNumbers?: boolean;
  onPhoneNumberChange?: (value: string) => void;
  onPlayVoice: (voiceId: string) => void;
  isPlaying: boolean;
  currentVoiceId: string | null;
}

const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
  }
  return phoneNumber;
};

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
];

export function AgentBasicFields({
  form,
  phoneNumbers,
  isLoadingPhoneNumbers,
  onPhoneNumberChange,
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

  const showCustomMessageInput = form.watch("initial_message_type") === "ai_initiates_custom";

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

      <FormField
        control={form.control}
        name="initial_message_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Initial Message</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select initial message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caller_initiates">Caller initiates</SelectItem>
                  <SelectItem value="ai_initiates_dynamic">AI initiates (dynamic)</SelectItem>
                  <SelectItem value="ai_initiates_custom">AI initiates (custom)</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {showCustomMessageInput && (
        <FormField
          control={form.control}
          name="custom_initial_message"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Enter custom initial message"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

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
                      {formatPhoneNumber(number.phone_number)}
                    </SelectItem>
                  ))}
                  <SelectItem value="buy" className="text-primary font-medium">
                    + Buy new number
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}