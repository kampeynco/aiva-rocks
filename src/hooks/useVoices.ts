import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Voice {
  id: string;
  name: string;
  description?: string;
}

export const useVoices = () => {
  return useQuery({
    queryKey: ["voices"],
    queryFn: async () => {
      const { data: { voices } } = await (await fetch("https://api.ultravox.ai/v1/voices", {
        headers: {
          Authorization: `Bearer ${process.env.ULTRAVOX_API_KEY}`,
        },
      })).json();
      
      return voices as Voice[];
    },
  });
};