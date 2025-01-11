import * as z from "zod";

export const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  prompt: z.string().min(1, "Prompt is required"),
  voice_id: z.string().min(1, "Voice is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  initial_message_type: z.enum(["caller_initiates", "ai_initiates_dynamic", "ai_initiates_custom"]),
  custom_initial_message: z.string().optional(),
  llm_model: z.enum(["ultravox_realtime_70b", "ultravox_realtime_8b"]),
  language: z.string().min(1, "Language is required"),
});

export type AgentFormValues = z.infer<typeof formSchema>;