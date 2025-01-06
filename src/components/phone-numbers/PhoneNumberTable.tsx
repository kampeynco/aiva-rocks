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
import { Check } from "lucide-react";
import { PhoneNumber } from "@/types/phone-numbers";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useState } from "react";

interface PhoneNumberTableProps {
  numbers: PhoneNumber[];
  selectedNumber: string;
  onNumberSelect: (number: string) => void;
  onSave: () => void;
}

export function PhoneNumberTable({
  numbers,
  selectedNumber,
  onNumberSelect,
  onSave,
}: PhoneNumberTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const validNumbers = numbers.filter((number) => number.locality !== null);
  const totalPages = Math.ceil(validNumbers.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNumbers = validNumbers.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

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
            {currentNumbers.map((number) => (
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

      {totalPages > 1 && (
        <Pagination className="justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={!selectedNumber}>
          {selectedNumber && <Check className="mr-2 h-4 w-4" />}
          Save Number
        </Button>
      </div>
    </div>
  );
}