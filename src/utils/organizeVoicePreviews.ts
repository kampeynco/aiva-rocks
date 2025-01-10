import { supabase } from "@/integrations/supabase/client";

export async function organizeVoicePreviews() {
  const { data: result, error } = await supabase.functions.invoke('organize-voice-previews');
  
  if (error) {
    throw error;
  }
  
  return result;
}