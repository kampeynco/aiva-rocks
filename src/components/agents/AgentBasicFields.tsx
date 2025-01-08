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
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as +# (###) ###-####
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
  }
  
  return phoneNumber; // Return original if format doesn't match
};

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

  return (
    <div className="space-y-6">
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