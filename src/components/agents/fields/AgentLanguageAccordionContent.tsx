import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useVoices } from "@/hooks/useVoices";
import { type AgentFormValues } from "../AgentFormSchema";

interface AgentLanguageAccordionContentProps {
  form: UseFormReturn<AgentFormValues>;
}

export function AgentLanguageAccordionContent({
  form,
}: AgentLanguageAccordionContentProps) {
  const { data: voices, isLoading } = useVoices();
  
  // Get unique languages from voices
  const languages = [...new Set(voices?.map(voice => voice.language))].filter(Boolean);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading languages...</p>;
  }

  return (
    <RadioGroup
      value={form.watch("language")}
      onValueChange={(value) => {
        form.setValue("language", value);
        form.setValue("voice_id", ""); // Reset voice selection when language changes
      }}
    >
      {languages.map((language) => (
        <div key={language} className="flex items-center space-x-2">
          <RadioGroupItem value={language!} id={language!} />
          <Label htmlFor={language!}>{language}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}