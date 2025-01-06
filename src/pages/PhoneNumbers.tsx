import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, Edit, Trash } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EditPhoneNumberDialog } from "@/components/phone-numbers/EditPhoneNumberDialog";
import { DeletePhoneNumberDialog } from "@/components/phone-numbers/DeletePhoneNumberDialog";

export default function PhoneNumbers() {
  const { toast } = useToast();
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: phoneNumbers, isLoading, refetch } = useQuery({
    queryKey: ['phone-numbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*, agents(name)')
        .order('created_at', { ascending: false });
      
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

  const handleEdit = (id: string) => {
    setSelectedPhoneNumberId(id);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSelectedPhoneNumberId(id);
    setIsDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Phone Numbers</h1>
        <Button asChild>
          <Link to="/phone-numbers/new">New Phone Number</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone Number</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : phoneNumbers?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No phone numbers found. Add your first phone number to get started.
                </TableCell>
              </TableRow>
            ) : (
              phoneNumbers?.map((number) => (
                <TableRow key={number.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {number.phone_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    {number.agents?.name ? (
                      <Link 
                        to={`/agents/${number.agent_id}`}
                        className="text-primary hover:underline"
                      >
                        {number.agents.name}
                      </Link>
                    ) : (
                      "Unassigned"
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      number.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {number.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(number.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(number.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditPhoneNumberDialog
        phoneNumberId={selectedPhoneNumberId}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedPhoneNumberId(null);
        }}
        onSuccess={refetch}
      />

      <DeletePhoneNumberDialog
        phoneNumberId={selectedPhoneNumberId}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedPhoneNumberId(null);
        }}
        onSuccess={refetch}
      />
    </DashboardLayout>
  );
}