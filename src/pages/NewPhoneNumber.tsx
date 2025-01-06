import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PhoneNumberTable } from "@/components/phone-numbers/PhoneNumberTable";
import { supabase } from "@/integrations/supabase/client";
import { PhoneNumber } from "@/types/phone-numbers";

export default function NewPhoneNumber() {
  const [areaCode, setAreaCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string>("");
  const navigate = useNavigate();
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

  const handleSearch = async () => {
    if (!areaCode) {
      toast({
        title: "Error",
        description: "Please enter an area code",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("twilio-search-numbers", {
        body: { areaCode },
      });

      if (error) throw error;
      if (!data?.numbers) throw new Error("No numbers found");

      setAvailableNumbers(data.numbers);
      console.log("Available numbers:", data.numbers);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to search for phone numbers",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveNumber = async () => {
    if (!selectedNumber) {
      toast({
        title: "Error",
        description: "Please select a phone number",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("twilio-purchase-number", {
        body: { phoneNumber: selectedNumber },
      });

      if (error) throw error;

      // Check for specific error responses from the edge function
      if (data?.error) {
        if (data.code === 'NUMBER_UNAVAILABLE') {
          toast({
            title: "Error",
            description: "This number is no longer available. Please try selecting a different number.",
            variant: "destructive",
          });
          setSelectedNumber(""); // Reset selection
          await handleSearch(); // Refresh the list
          return;
        }
        throw new Error(data.error);
      }

      if (!data?.sid) throw new Error("Failed to purchase number");

      toast({
        title: "Success",
        description: "Phone number purchased and saved successfully",
      });
      navigate("/phone-numbers");
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to purchase and save phone number",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">New Phone Number</h1>
          <Button variant="outline" onClick={() => navigate("/phone-numbers")}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Available Numbers</CardTitle>
            <CardDescription>
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
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Enter area code (e.g., 415)"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                className="max-w-[200px]"
              />
              <Button onClick={handleSearch} disabled={!areaCode || isSearching}>
                {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search Numbers
              </Button>
            </div>

            {availableNumbers.length > 0 && (
              <PhoneNumberTable
                numbers={availableNumbers}
                selectedNumber={selectedNumber}
                onNumberSelect={setSelectedNumber}
                onSave={handleSaveNumber}
                isSaving={isSaving}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}