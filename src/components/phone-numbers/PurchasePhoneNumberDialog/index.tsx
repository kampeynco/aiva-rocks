import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogHeader } from "./DialogHeader";
import { AreaCodeInput } from "./AreaCodeInput";
import { PurchaseButton } from "./PurchaseButton";

interface PurchasePhoneNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PurchasePhoneNumberDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: PurchasePhoneNumberDialogProps) {
  const [areaCode, setAreaCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["userSubscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          plan:subscription_plans (
            phone_number_fee
          )
        `)
        .eq("user_id", user.id)
        .single();

      return subscription;
    },
  });

  const formattedFee = subscriptionData?.plan?.phone_number_fee
    ? `$${subscriptionData.plan.phone_number_fee.toFixed(2)}/month`
    : null;

  const validateAreaCode = (code: string) => {
    const areaCodeRegex = /^[2-9]\d{2}$/;
    return areaCodeRegex.test(code);
  };

  const handlePurchase = async () => {
    if (!validateAreaCode(areaCode)) {
      toast({
        title: "Invalid Area Code",
        description: "Please enter a valid 3-digit area code (e.g., 415)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: searchData, error: searchError } = await supabase.functions
        .invoke("twilio-search-numbers", {
          body: { areaCode },
        });

      if (searchError) throw searchError;

      if (!searchData?.numbers?.length) {
        throw new Error(
          searchData?.error || 
          "No phone numbers available for this area code. Please try a different area code."
        );
      }

      const selectedNumber = searchData.numbers[0];
      console.log("Selected number for purchase:", selectedNumber);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to purchase a number");

      const { data: purchaseData, error: purchaseError } = await supabase.functions
        .invoke("twilio-purchase-number", {
          body: { 
            phoneNumber: selectedNumber.phoneNumber,
            userId: user.id
          },
        });

      if (purchaseError) throw purchaseError;

      if (!purchaseData?.sid) {
        throw new Error("Failed to purchase number");
      }

      toast({
        title: "Success",
        description: "Phone number purchased successfully",
      });
      
      onOpenChange(false);
      onSuccess?.();
      
      await queryClient.invalidateQueries({ queryKey: ["phone-numbers"] });
    } catch (error: any) {
      console.error("Purchase error:", error);
      
      let errorMessage = "Failed to purchase phone number";
      if (error.message.includes("No phone numbers available")) {
        errorMessage = "No phone numbers available for this area code. Please try a different one.";
      } else if (error.code === "NUMBER_UNAVAILABLE") {
        errorMessage = "This phone number is no longer available. Please try again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader 
          isLoadingSubscription={isLoadingSubscription}
          formattedFee={formattedFee}
        />

        <div className="grid gap-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <AreaCodeInput
                value={areaCode}
                onChange={setAreaCode}
                disabled={isProcessing}
              />
              <PurchaseButton
                isProcessing={isProcessing}
                disabled={!areaCode}
                onClick={handlePurchase}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}