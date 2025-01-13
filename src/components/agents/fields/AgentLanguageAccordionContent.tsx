import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useVoices } from "@/hooks/useVoices";
import { type AgentFormValues } from "../AgentFormSchema";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AgentLanguageAccordionContentProps {
  form: UseFormReturn<AgentFormValues>;
}

export function AgentLanguageAccordionContent({
  form,
}: AgentLanguageAccordionContentProps) {
  const { data: voices, isLoading, error } = useVoices();
  
  // Get unique languages from voices, filter out null/undefined, and sort alphabetically
  const languages = [...new Set(voices?.map(voice => voice.language))]
    .filter((lang): lang is string => Boolean(lang))
    .sort((a, b) => a.localeCompare(b));

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load languages. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-28" />
      </div>
    );
  }

  if (!languages.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No languages available at the moment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <RadioGroup
      value={form.watch("language")}
      onValueChange={(value) => {
        form.setValue("language", value);
        // Reset voice selection when language changes
        form.setValue("voice_id", "");
      }}
      className="space-y-2"
    >
      {languages.map((language) => (
        <div 
          key={language} 
          className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={language} id={language} />
            <Label 
              htmlFor={language}
              className="cursor-pointer flex-grow"
            >
              {language}
            </Label>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}