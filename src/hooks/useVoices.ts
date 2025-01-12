import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type Voice } from "@/types/voice";

export function useVoices() {
  return useQuery({
    queryKey: ["voices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voices")
        .select("*")
        .order("name");

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