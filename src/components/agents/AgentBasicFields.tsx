import { UseFormReturn } from "react-hook-form";
import { type AgentFormValues } from "./AgentFormSchema";
import { AgentNameField } from "./fields/AgentNameField";
import { AgentModelField } from "./fields/AgentModelField";
import { AgentLanguageField } from "./fields/AgentLanguageField";
import { AgentVoiceField } from "./fields/AgentVoiceField";

interface AgentBasicFieldsProps {
  form: UseFormReturn<AgentFormValues>;
  onPlayVoice: (voiceId: string) => void;
  isPlaying: boolean;
  currentVoiceId: string | null;
}

export function AgentBasicFields({
  form,
  onPlayVoice,
  isPlaying,
  currentVoiceId,
}: AgentBasicFieldsProps) {
  return (
    <div className="space-y-6">
      <AgentNameField form={form} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AgentModelField form={form} />
        <AgentLanguageField form={form} />
        <AgentVoiceField
          form={form}
          onPlayVoice={onPlayVoice}
          isPlaying={isPlaying}
          currentVoiceId={currentVoiceId}
        />
      </div>
    </div>
  );
}