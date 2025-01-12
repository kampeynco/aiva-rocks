import { UseFormReturn } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Brain, 
  Languages, 
  Headphones, 
  PhoneCall,
  FileText,
  Mic,
  Webhook,
  Wrench,
  BookOpen,
  GitBranch
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { type AgentFormValues } from "./AgentFormSchema";
import { AgentLanguageAccordionContent } from "./fields/AgentLanguageAccordionContent";
import { AgentVoiceAccordionContent } from "./fields/AgentVoiceAccordionContent";

interface AgentSettingsAccordionProps {
  form: UseFormReturn<AgentFormValues>;
  onPlayVoice: (voiceId: string) => void;
  isPlaying: boolean;
  currentVoiceId: string | null;
}

export function AgentSettingsAccordion({
  form,
  onPlayVoice,
  isPlaying,
  currentVoiceId,
}: AgentSettingsAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="llm-settings">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span>LLM Settings</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <RadioGroup
                value={form.watch("llm_model")}
                onValueChange={(value: "ultravox_realtime_70b" | "ultravox_realtime_8b") => 
                  form.setValue("llm_model", value)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ultravox_realtime_8b" id="8b" />
                  <Label htmlFor="8b">Ultravox Realtime 8B</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ultravox_realtime_70b" id="70b" />
                  <Label htmlFor="70b">Ultravox Realtime 70B</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Temperature ({form.watch("temperature")})</Label>
              <Slider
                value={[form.watch("temperature")]}
                onValueChange={([value]) => form.setValue("temperature", value)}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="language-settings">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <span>Language Settings</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <AgentLanguageAccordionContent form={form} />
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
          <AgentVoiceAccordionContent
            form={form}
            onPlayVoice={onPlayVoice}
            isPlaying={isPlaying}
            currentVoiceId={currentVoiceId}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="call-settings">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4" />
            <span>Call Settings</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>End Call on Silence ({form.watch("end_call_silence_duration")} seconds)</Label>
              <Slider
                value={[form.watch("end_call_silence_duration")]}
                onValueChange={([value]) => form.setValue("end_call_silence_duration", value)}
                min={10}
                max={1800}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Call Duration ({Math.floor(form.watch("max_call_duration") / 60)} minutes)</Label>
              <Slider
                value={[form.watch("max_call_duration")]}
                onValueChange={([value]) => form.setValue("max_call_duration", value)}
                min={60}
                max={7200}
                step={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Pause Before Speaking ({form.watch("pause_before_speaking")} ms)</Label>
              <Slider
                value={[form.watch("pause_before_speaking")]}
                onValueChange={([value]) => form.setValue("pause_before_speaking", value)}
                min={0}
                max={5000}
                step={100}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="transcriptions">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Transcriptions</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex items-center justify-between">
            <Label>Enable Transcriptions</Label>
            <Switch
              checked={form.watch("enable_transcriptions")}
              onCheckedChange={(checked) => form.setValue("enable_transcriptions", checked)}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="recordings">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span>Recordings</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Recordings</Label>
                <p className="text-sm text-muted-foreground">Additional cost of $0.001 per recording</p>
              </div>
              <Switch
                checked={form.watch("enable_recordings")}
                onCheckedChange={(checked) => form.setValue("enable_recordings", checked)}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Coming Soon Sections */}
      {[
        { value: "webhooks", icon: Webhook, label: "Webhooks" },
        { value: "tools", icon: Wrench, label: "Tools" },
        { value: "knowledgebase", icon: BookOpen, label: "Knowledgebase" },
        { value: "stages", icon: GitBranch, label: "Stages" }
      ].map(({ value, icon: Icon, label }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">Coming Soon</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}