import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Headphones, Phone } from "lucide-react";

export function AgentSettingsAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="voice-settings">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            <span>Voice Settings</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 py-2">
            {/* Voice settings content will be added in future updates */}
            <p className="text-sm text-muted-foreground">Voice settings coming soon</p>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="call-settings">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>Call Settings</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 py-2">
            {/* Call settings content will be added in future updates */}
            <p className="text-sm text-muted-foreground">Call settings coming soon</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}