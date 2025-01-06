import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PhoneNumberTable } from "@/components/phone-numbers/PhoneNumberTable";
import { PhoneNumber } from "@/types/phone-numbers";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  prompt: z.string().min(1, "Prompt is required"),
  voice_id: z.string().optional(),
  phone_number: z.string().min(1, "Phone number is required"),
});

export default function CreateAgent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      prompt: "",
      voice_id: undefined,
      phone_number: "",
    },
  });

  // Fetch available phone numbers
  const { data: phoneNumbers, isLoading: isLoadingPhoneNumbers } = useQuery({
    queryKey: ["phone-numbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select("*")
        .is("agent_id", null)
        .eq("status", "active");

      if (error) throw error;

      return data.map((number) => ({
        phoneNumber: number.phone_number,
        friendlyName: number.friendly_name || number.phone_number,
        locality: number.area_code,
        region: number.country_code,
      })) as PhoneNumber[];
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // First create the agent
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .insert([
          {
            name: values.name,
            prompt: values.prompt,
            voice_id: values.voice_id,
            status: "inactive",
          },
        ])
        .select()
        .single();

      if (agentError) throw agentError;

      // Then update the phone number to associate it with the agent
      const { error: phoneError } = await supabase
        .from("phone_numbers")
        .update({ agent_id: agent.id })
        .eq("phone_number", values.phone_number);

      if (phoneError) throw phoneError;

      toast({
        title: "Success",
        description: "Agent created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["phone-numbers"] });
      navigate("/agents");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive",
      });
    }
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create New Agent</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a voice" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="voice1">Voice 1</SelectItem>
                          <SelectItem value="voice2">Voice 2</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem className="h-full">
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the agent's conversation prompt..."
                        className="h-[calc(100%-2rem)] min-h-[150px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    {isLoadingPhoneNumbers ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : phoneNumbers && phoneNumbers.length > 0 ? (
                      <PhoneNumberTable
                        numbers={phoneNumbers}
                        selectedNumber={field.value}
                        onNumberSelect={field.onChange}
                        onSave={form.handleSubmit(onSubmit)}
                      />
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No phone numbers available. Please purchase a new number first.
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/agents")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Agent
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}