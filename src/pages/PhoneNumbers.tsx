import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database } from "@/integrations/supabase/types";

type PhoneNumber = Database['public']['Tables']['phone_numbers']['Row'];

const searchFormSchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  areaCode: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

export default function PhoneNumbers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      countryCode: "US",
      areaCode: "",
    },
  });

  const { data: phoneNumbers, isLoading } = useQuery({
    queryKey: ["phone-numbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PhoneNumber[];
    },
  });

  const searchNumbers = async (values: SearchFormValues) => {
    setIsSearching(true);
    try {
      const response = await fetch("/api/twilio/search-numbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          countryCode: values.countryCode,
          areaCode: values.areaCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch phone numbers");
      }

      const data = await response.json();
      setAvailableNumbers(data.numbers);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch available phone numbers",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const purchaseMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch("/api/twilio/purchase-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error("Failed to purchase phone number");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-numbers"] });
      toast({
        title: "Success",
        description: "Phone number purchased successfully",
      });
      setIsSearchModalOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to purchase phone number",
      });
    },
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Phone Numbers</h1>
        <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
          <DialogTrigger asChild>
            <Button>Buy Phone Number</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Search Phone Numbers</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(searchNumbers)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="areaCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area Code (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 415" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSearching}>
                  {isSearching && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Search Numbers
                </Button>
              </form>
            </Form>

            {availableNumbers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Available Numbers</h3>
                <div className="space-y-2">
                  {availableNumbers.map((number) => (
                    <div
                      key={number.phoneNumber}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {number.phoneNumber}
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          purchaseMutation.mutate(number.phoneNumber)
                        }
                        disabled={purchaseMutation.isPending}
                      >
                        {purchaseMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Buy
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone Number</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Agent</TableHead>
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
                  No phone numbers found. Buy your first phone number to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              phoneNumbers?.map((number) => (
                <TableRow key={number.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {number.phone_number}
                    </div>
                  </TableCell>
                  <TableCell>{number.country_code}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        number.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {number.status}
                    </span>
                  </TableCell>
                  <TableCell>{number.agent_id || "Unassigned"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}