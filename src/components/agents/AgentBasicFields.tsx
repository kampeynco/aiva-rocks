import { UseFormReturn } from "react-hook-form";
import { type AgentFormValues } from "./AgentFormSchema";
import { AgentNameField } from "./fields/AgentNameField";

interface AgentBasicFieldsProps {
  form: UseFormReturn<AgentFormValues>;
  phoneNumbers?: any[];
  isLoadingPhoneNumbers?: boolean;
  onPhoneNumberChange?: (value: string) => void;
}

export function AgentBasicFields({ 
  form,
  phoneNumbers,
  isLoadingPhoneNumbers,
  onPhoneNumberChange 
}: AgentBasicFieldsProps) {
  return (
    <div className="space-y-6">
      <AgentNameField form={form} />
    </div>
  );
}