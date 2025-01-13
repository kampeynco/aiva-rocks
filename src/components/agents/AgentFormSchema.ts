import * as z from "zod";

export const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  prompt: z.string().min(1, "Prompt is required"),
  voice_id: z.string().min(1, "Voice is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  initial_message_type: z.enum(["caller_initiates", "ai_initiates_dynamic", "ai_initiates_custom"]),
  custom_initial_message: z.string().optional()
    .superRefine((val, ctx) => {
      const parentForm = ctx.path[0] as keyof z.infer<typeof formSchema>;
      const messageType = (ctx as any).parent?.initial_message_type;
      
      if (messageType === "ai_initiates_custom") {
        if (!val || val.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Custom initial message is required when AI initiates with custom message"
          });
        }
      }
    }),
  llm_model: z.enum(["ultravox_realtime_70b", "ultravox_realtime_8b"]),
  language: z.string().min(1, "Language is required"),
  temperature: z.number()
    .min(0, "Temperature must be at least 0")
    .max(1, "Temperature must be at most 1")
    .transform(val => Number(val.toFixed(2))), // Ensure 2 decimal places
  end_call_silence_duration: z.number()
    .int("End call silence duration must be a whole number")
    .min(10, "End call silence duration must be at least 10 seconds")
    .max(1800, "End call silence duration must be at most 1800 seconds")
    .default(30),
  max_call_duration: z.number()
    .int("Maximum call duration must be a whole number")
    .min(60, "Maximum call duration must be at least 60 seconds")
    .max(7200, "Maximum call duration must be at most 7200 seconds")
    .default(3600),
  pause_before_speaking: z.number()
    .int("Pause before speaking must be a whole number")
    .min(0, "Pause before speaking must be at least 0 milliseconds")
    .max(5000, "Pause before speaking must be at most 5000 milliseconds")
    .default(0),
  enable_transcriptions: z.boolean().default(false),
  enable_recordings: z.boolean().default(false),
});

export type AgentFormValues = z.infer<typeof formSchema>;