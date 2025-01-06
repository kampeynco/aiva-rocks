import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PurchasePhoneNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PurchasePhoneNumberDialog({
  open,
  onOpenChange,
  onSuccess,
}: PurchasePhoneNumberDialogProps) {
  const [areaCode, setAreaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/twilio/purchase-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ areaCode }),
      });

      if (!response.ok) {
        throw new Error("Failed to purchase phone number");
      }

      const data = await response.json();
      
      // Save the phone number to Supabase
      const { error: supabaseError } = await supabase
        .from("phone_numbers")
        .insert({
          phone_number: data.phoneNumber,
          friendly_name: data.friendlyName,
          country_code: "US",
          area_code: areaCode,
          twilio_sid: data.sid,
        });

      if (supabaseError) throw supabaseError;

      toast({
        title: "Success",
        description: "Phone number purchased successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error purchasing phone number:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to purchase phone number. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Purchase Phone Number</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="areaCode">Area Code</Label>
            <Input
              id="areaCode"
              placeholder="Enter area code (e.g., 415)"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              pattern="[0-9]{3}"
              maxLength={3}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Purchasing..." : "Purchase Number"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}