import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
import { useToast } from "@/components/ui/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

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

  const { data: phoneNumbers, isLoading: isLoadingPhoneNumbers } = useQuery({
    queryKey: ["phone-numbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select("*")
        .eq("status", "active")
        .is("agent_id", null);

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      prompt: "",
      voice_id: undefined,
      phone_number: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Create the agent
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

      // Update the phone number with the agent ID
      const { error: phoneNumberError } = await supabase
        .from("phone_numbers")
        .update({ agent_id: agent.id })
        .eq("phone_number", values.phone_number);

      if (phoneNumberError) throw phoneNumberError;

      toast({
        title: "Success",
        description: "Agent created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["agents"] });
      navigate("/agents");
    } catch (error) {
      console.error("Error creating agent:", error);
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive",
      });
    }
  }

  const handlePhoneNumberChange = (value: string) => {
    if (value === "buy") {
      navigate("/phone-numbers/new");
      return;
    }
    form.setValue("phone_number", value);
  };

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

                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <Select
                        onValueChange={handlePhoneNumberChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingPhoneNumbers ? "Loading..." : "Select a phone number"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {phoneNumbers?.length === 0 && (
                            <SelectItem value="buy">Buy a Phone Number</SelectItem>
                          )}
                          {phoneNumbers?.map((number) => (
                            <SelectItem key={number.id} value={number.phone_number}>
                              {number.friendly_name || number.phone_number}
                            </SelectItem>
                          ))}
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

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/agents")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.formState.isValid}
              >
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