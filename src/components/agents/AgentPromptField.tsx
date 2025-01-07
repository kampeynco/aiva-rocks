import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { type AgentFormValues } from "./AgentFormSchema";

interface AgentPromptFieldProps {
  form: UseFormReturn<AgentFormValues>;
}

export function AgentPromptField({ form }: AgentPromptFieldProps) {
  return (
    <FormField
      control={form.control}
      name="prompt"
      render={({ field }) => (
        <FormItem className="h-full">
          <FormLabel>Prompt</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter the agent's prompt..."
              className="flex-1 h-[calc(100%-2rem)] min-h-[300px] resize-none"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}