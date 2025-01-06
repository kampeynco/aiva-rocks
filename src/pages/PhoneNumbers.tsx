import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

export default function PhoneNumbers() {
  const navigate = useNavigate();
  
  const { data: phoneNumbers, isLoading } = useQuery({
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
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Phone Numbers</h1>
          <Button onClick={() => navigate("/phone-numbers/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Phone Number
          </Button>
        </div>

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
              onClick={() => navigate("/phone-numbers/new")}
            >
              Add your first phone number
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Phone Number</th>
                  <th className="p-4 text-left font-medium">Friendly Name</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Assigned Agent</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {phoneNumbers.map((number) => (
                  <tr key={number.id} className="border-b">
                    <td className="p-4">{number.phone_number}</td>
                    <td className="p-4">{number.friendly_name || '-'}</td>
                    <td className="p-4">{number.status}</td>
                    <td className="p-4">{number.agent?.name || 'Unassigned'}</td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/phone-numbers/${number.id}`)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}