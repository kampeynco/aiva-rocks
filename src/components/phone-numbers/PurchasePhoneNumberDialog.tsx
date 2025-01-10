import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);

    if (!validateAreaCode(areaCode)) {
      setError("Please enter a valid 3-digit area code (e.g., 415)");
      return;
    }

    setIsProcessing(true);
    try {
      // First, search for available numbers
      const { data: searchData, error: searchError } = await supabase.functions
        .invoke("twilio-search-numbers", {
          body: { areaCode },
        });

      if (searchError) {
        console.error("Search error:", searchError);
        throw new Error("Failed to search for phone numbers");
      }

      if (!searchData?.numbers?.length) {
        throw new Error(
          searchData?.error || 
          "No phone numbers available for this area code. Please try a different area code."
        );
      }

      const selectedNumber = searchData.numbers[0];
      console.log("Selected number for purchase:", selectedNumber);

      // Then purchase the selected number
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to purchase a number");

      const { data: purchaseData, error: purchaseError } = await supabase.functions
        .invoke("twilio-purchase-number", {
          body: { 
            phoneNumber: selectedNumber.phoneNumber,
            userId: user.id
          },
        });

      if (purchaseError) {
        console.error("Purchase error:", purchaseError);
        throw purchaseError;
      }

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
      
      // Handle specific error cases
      if (error.message.includes("No phone numbers available")) {
        errorMessage = "No phone numbers available for this area code. Please try a different one.";
      } else if (error.code === "NUMBER_UNAVAILABLE") {
        errorMessage = "This phone number is no longer available. Please try again with a different area code.";
      } else if (error.code === 21404) {
        errorMessage = "This phone number is no longer available. Please try a different area code.";
      } else if (error.message.includes("must be logged in")) {
        errorMessage = "You must be logged in to purchase a number. Please sign in and try again.";
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset error when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
      setAreaCode("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <>
                This number incurs a monthly fee of {formattedFee}
                <Alert className="mt-4">
                  <AlertDescription>
                    Only local numbers with voice, SMS, and MMS capabilities will be available for purchase.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              "Unable to retrieve fee information"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter area code (e.g., 415)"
                value={areaCode}
                onChange={(e) => {
                  setError(null);
                  setAreaCode(e.target.value);
                }}
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