import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface PhoneNumberTableProps {
  phoneNumbers: (Tables<"phone_numbers"> & {
    agent: Tables<"agents"> | null;
  })[];
  onDelete: (id: string) => void;
}

export function PhoneNumberTable({ phoneNumbers, onDelete }: PhoneNumberTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone Number</TableHead>
            <TableHead>Friendly Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned Agent</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {phoneNumbers.map((number) => (
            <TableRow key={number.id}>
              <TableCell>{number.phone_number}</TableCell>
              <TableCell>{number.friendly_name || '-'}</TableCell>
              <TableCell>{number.status}</TableCell>
              <TableCell>{number.agent?.name || 'Unassigned'}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(number.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}