import { UseFormReturn } from "react-hook-form";
import { type AgentFormValues } from "./AgentFormSchema";
import { AgentNameField } from "./fields/AgentNameField";

interface AgentBasicFieldsProps {
  form: UseFormReturn<AgentFormValues>;
}

export function AgentBasicFields({ form }: AgentBasicFieldsProps) {
  return (
    <div className="space-y-6">
      <AgentNameField form={form} />
    </div>
  );
}