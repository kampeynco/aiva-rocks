import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Voice {
  id: string;
  name: string;
  description?: string;
  preview_url?: string;
  storage_path?: string;
}

export const useVoices = () => {
  return useQuery({
    queryKey: ["voices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voices')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Voice[];
    },
  });
};