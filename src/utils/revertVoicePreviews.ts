import { supabase } from "@/integrations/supabase/client";

export async function revertVoicePreviews() {
  const { data: result, error } = await supabase.functions.invoke('revert-voice-previews');
  
  if (error) {
    throw error;
  }
  
  return result;
}