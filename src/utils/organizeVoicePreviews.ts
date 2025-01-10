import { supabase } from "@/integrations/supabase/client";

export async function organizeVoicePreviews() {
  const { data, error } = await supabase.functions.invoke('organize-voice-previews');
  
  if (error) {
    console.error('Error organizing voice previews:', error);
    throw error;
  }
  
  return data;
}