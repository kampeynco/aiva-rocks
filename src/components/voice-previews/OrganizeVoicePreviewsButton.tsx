import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { organizeVoicePreviews } from "@/utils/organizeVoicePreviews";

export function OrganizeVoicePreviewsButton() {
  const { toast } = useToast();
  const [isOrganizing, setIsOrganizing] = useState(false);

  const handleOrganize = async () => {
    try {
      setIsOrganizing(true);
      const result = await organizeVoicePreviews();
      
      const successCount = result.results.filter((r: any) => r.success).length;
      const failureCount = result.results.filter((r: any) => !r.success).length;
      
      toast({
        title: "Organization Complete",
        description: `Successfully organized ${successCount} files. ${failureCount} files failed.`,
        variant: failureCount > 0 ? "destructive" : "default",
      });

      // Log detailed results for debugging
      console.log("Organization results:", result);
      
    } catch (error) {
      console.error("Failed to organize voice previews:", error);
      toast({
        title: "Organization Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsOrganizing(false);
    }
  };

  return (
    <Button 
      onClick={handleOrganize} 
      disabled={isOrganizing}
    >
      {isOrganizing ? "Organizing..." : "Organize Voice Previews"}
    </Button>
  );
}