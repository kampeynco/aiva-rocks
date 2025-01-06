import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PurchasePhoneNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchasePhoneNumberDialog({ open, onOpenChange }: PurchasePhoneNumberDialogProps) {
  const [areaCode, setAreaCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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
      // Search for available numbers
      const { data: searchData, error: searchError } = await supabase.functions
        .invoke("twilio-search-numbers", {
          body: { areaCode },
        });

      if (searchError) throw searchError;
      if (!searchData?.numbers?.length) {
        throw new Error("No phone numbers available for this area code");
      }

      // Select the first available number
      const selectedNumber = searchData.numbers[0];

      // Purchase the selected number
      const { data: purchaseData, error: purchaseError } = await supabase.functions
        .invoke("twilio-purchase-number", {
          body: { phoneNumber: selectedNumber.phoneNumber },
        });

      if (purchaseError) {
        if (purchaseError.code === 'NUMBER_UNAVAILABLE') {
          throw new Error("The selected number is no longer available. Please try again.");
        }
        throw purchaseError;
      }
      
      if (!purchaseData?.sid) throw new Error("Failed to purchase number");

      toast({
        title: "Success",
        description: "Phone number purchased and saved successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to purchase phone number",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Purchase Phone Number</DialogTitle>
          <DialogDescription className="pt-2">
            {isLoadingSubscription ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading subscription details...
              </span>
            ) : formattedFee ? (
              `This number incurs a monthly fee of ${formattedFee}`
            ) : (
              "Unable to retrieve fee information"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter area code (e.g., 415)"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                maxLength={3}
                className="h-10"
              />
              <Button 
                onClick={handlePurchase} 
                disabled={!areaCode || isProcessing}
                className="w-32 px-4"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buying...
                  </>
                ) : (
                  "Buy Number"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}