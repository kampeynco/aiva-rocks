import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type AgentFormValues } from "../AgentFormSchema";

interface AgentNameFieldProps {
  form: UseFormReturn<AgentFormValues>;
}

export function AgentNameField({ form }: AgentNameFieldProps) {
  return (
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
  );
}