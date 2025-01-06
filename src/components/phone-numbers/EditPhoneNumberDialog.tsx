import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditPhoneNumberDialogProps {
  phoneNumberId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPhoneNumberDialog({
  phoneNumberId,
  isOpen,
  onClose,
  onSuccess,
}: EditPhoneNumberDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch available agents for the dropdown
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch current phone number details
  const { data: phoneNumber } = useQuery({
    queryKey: ['phone-number', phoneNumberId],
    queryFn: async () => {
      if (!phoneNumberId) return null;
      
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('id', phoneNumberId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!phoneNumberId,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const agentId = formData.get('agent_id') as string;

      const { error } = await supabase
        .from('phone_numbers')
        .update({ agent_id: agentId || null })
        .eq('id', phoneNumberId);

      if (error) throw error;

      toast({
        title: "Phone number updated",
        description: "The phone number has been successfully updated.",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating phone number",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Phone Number</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="phone_number" className="text-sm font-medium">
              Phone Number
            </label>
            <input
              id="phone_number"
              type="text"
              value={phoneNumber?.phone_number || ''}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-muted"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="agent_id" className="text-sm font-medium">
              Assigned Agent
            </label>
            <select
              id="agent_id"
              name="agent_id"
              defaultValue={phoneNumber?.agent_id || ''}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Unassigned</option>
              {agents?.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}