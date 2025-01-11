import { UseFormReturn } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Headphones, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { type AgentFormValues } from "./AgentFormSchema";
import { Loader2 } from "lucide-react";

interface AgentSettingsAccordionProps {
  form: UseFormReturn<AgentFormValues>;
  phoneNumbers?: any[];
  isLoadingPhoneNumbers?: boolean;
  onPhoneNumberChange?: (value: string) => void;
}

const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
  }
  return phoneNumber;
};

export function AgentSettingsAccordion({
  form,
  phoneNumbers,
  isLoadingPhoneNumbers,
  onPhoneNumberChange,
}: AgentSettingsAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="phone-number">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>Phone Number</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {isLoadingPhoneNumbers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : phoneNumbers && phoneNumbers.length > 0 ? (
            <RadioGroup
              value={form.watch("phone_number")}
              onValueChange={(value) => {
                form.setValue("phone_number", value);
                onPhoneNumberChange?.(value);
              }}
              className="space-y-2"
            >
              {phoneNumbers.map((number) => (
                <div key={number.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={number.phone_number} id={number.phone_number} />
                  <Label htmlFor={number.phone_number}>
                    {formatPhoneNumber(number.phone_number)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No phone numbers available</p>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="voice-settings">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            <span>Voice Settings</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Voice settings coming soon</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}