import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type AgentFormValues } from "../AgentFormSchema";

interface AgentModelFieldProps {
  form: UseFormReturn<AgentFormValues>;
}

export function AgentModelField({ form }: AgentModelFieldProps) {
  return (
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
  );
}