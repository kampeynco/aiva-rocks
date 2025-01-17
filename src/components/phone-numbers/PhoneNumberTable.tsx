import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { PhoneNumber } from "@/types/phone-numbers";

interface PhoneNumberTableProps {
  numbers: PhoneNumber[];
  selectedNumber: string;
  onNumberSelect: (number: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function PhoneNumberTable({
  numbers,
  selectedNumber,
  onNumberSelect,
  onSave,
  isSaving = false,
}: PhoneNumberTableProps) {
  // Filter out numbers with null locality to ensure consistent display
  const validNumbers = numbers.filter((number) => number.locality !== null);

  if (validNumbers.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No phone numbers available for the selected criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedNumber} onValueChange={onNumberSelect}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validNumbers.map((number) => (
              <TableRow key={number.phoneNumber}>
                <TableCell>
                  <RadioGroupItem
                    value={number.phoneNumber}
                    id={number.phoneNumber}
                    className="mt-1"
                  />
                </TableCell>
                <TableCell>{number.friendlyName}</TableCell>
                <TableCell>{`${number.locality}, ${number.region}`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RadioGroup>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={!selectedNumber || isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            selectedNumber && <Check className="mr-2 h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save Number"}
        </Button>
      </div>
    </div>
  );
}