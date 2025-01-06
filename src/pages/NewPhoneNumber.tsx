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
import { supabase } from "@/integrations/supabase/client";

export default function NewPhoneNumber() {
  const [areaCode, setAreaCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user's subscription plan and fee
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

      if (error) {
        console.error("Function error:", error);
        throw error;
      }

      if (!data?.numbers) {
        throw new Error("No numbers found");
      }

      console.log("Available numbers:", data.numbers);
      // Handle the phone numbers data here
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

  const monthlyFee = subscriptionData?.plan?.phone_number_fee;
  const formattedFee = monthlyFee ? `$${monthlyFee.toFixed(2)}` : null;

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">New Phone Number</h1>
          <Button
            variant="outline"
            onClick={() => navigate("/phone-numbers")}
          >
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
            <div className="flex gap-4">
              <Input
                placeholder="Enter area code (e.g., 415)"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                className="max-w-[200px]"
              />
              <Button
                onClick={handleSearch}
                disabled={!areaCode || isSearching}
              >
                {isSearching && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Search Numbers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}