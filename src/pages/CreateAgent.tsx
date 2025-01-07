import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AgentFormFields } from "@/components/agents/AgentFormFields";
import { formSchema } from "@/components/agents/AgentFormSchema";
import * as z from "zod";

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
      voice_id: "",
      phone_number: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
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
      <div className="container flex flex-col h-[calc(100vh-4rem)] py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create New Agent</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="flex-1">
              <AgentFormFields
                form={form}
                phoneNumbers={phoneNumbers}
                isLoadingPhoneNumbers={isLoadingPhoneNumbers}
                onPhoneNumberChange={handlePhoneNumberChange}
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
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