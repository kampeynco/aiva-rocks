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
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="initial_message_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Initial Message</FormLabel>
            <FormControl>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...field}
              >
                <option value="caller_initiates">Caller initiates</option>
                <option value="ai_initiates_dynamic">AI initiates (dynamic)</option>
                <option value="ai_initiates_custom">AI initiates (custom)</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("initial_message_type") === "ai_initiates_custom" && (
        <FormField
          control={form.control}
          name="custom_initial_message"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Enter custom initial message..."
                  className="min-h-[100px] resize-none"
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
        name="prompt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>System Prompt</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter the agent's system prompt..."
                className="min-h-[300px] resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}