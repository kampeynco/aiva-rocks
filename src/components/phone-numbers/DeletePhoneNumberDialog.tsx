import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface DeletePhoneNumberDialogProps {
  phoneNumberId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeletePhoneNumberDialog({
  phoneNumberId,
  isOpen,
  onClose,
  onSuccess,
}: DeletePhoneNumberDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!phoneNumberId) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('phone_numbers')
        .delete()
        .eq('id', phoneNumberId);

      if (error) throw error;

      toast({
        title: "Phone number deleted",
        description: "The phone number has been successfully deleted.",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting phone number",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Phone Number</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this phone number? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}