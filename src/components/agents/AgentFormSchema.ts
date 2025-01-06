import * as z from "zod";

export const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  prompt: z.string().min(1, "Prompt is required"),
  voice_id: z.string().min(1, "Voice is required"),
  phone_number: z.string().min(1, "Phone number is required"),
});