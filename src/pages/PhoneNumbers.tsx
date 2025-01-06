import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PurchasePhoneNumberDialog } from "@/components/phone-numbers/PurchasePhoneNumberDialog";
import { DeletePhoneNumberDialog } from "@/components/phone-numbers/DeletePhoneNumberDialog";
import { PhoneNumberTable } from "@/components/phone-numbers/PhoneNumberTable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PhoneNumbers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { data: phoneNumbers, isLoading, refetch } = useQuery({
    queryKey: ["phoneNumbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select(`
          *,
          agent:agents (
            id,
            name
          )
        `);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching phone numbers",
          description: error.message,
        });
        throw error;
      }
      return data;
    },
  });

  const handleDeleteSuccess = () => {
    refetch();
    setSelectedPhoneNumberId(null);
  };

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Phone Numbers</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Phone Number
          </Button>
        </div>

        <PurchasePhoneNumberDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSuccess={refetch}
        />

        <DeletePhoneNumberDialog
          phoneNumberId={selectedPhoneNumberId}
          isOpen={!!selectedPhoneNumberId}
          onClose={() => setSelectedPhoneNumberId(null)}
          onSuccess={handleDeleteSuccess}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : phoneNumbers?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">No phone numbers found</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setIsDialogOpen(true)}
            >
              Add your first phone number
            </Button>
          </div>
        ) : (
          <PhoneNumberTable 
            phoneNumbers={phoneNumbers} 
            onDelete={setSelectedPhoneNumberId}
          />
        )}
      </div>
    </DashboardLayout>
  );
}