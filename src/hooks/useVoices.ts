import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Voice {
  id: string;
  name: string;
  description?: string;
  preview_url?: string;
}

export function useVoices() {
  return useQuery({
    queryKey: ["voices"],
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("No active session");
      }

      const { data, error } = await supabase.functions.invoke("sync-voices", {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });
      
      if (error) {
        toast.error("Failed to fetch voices");
        throw error;
      }

      return data as Voice[];
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}