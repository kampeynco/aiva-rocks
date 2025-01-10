import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { revertVoicePreviews } from "@/utils/revertVoicePreviews";

export function RevertVoicePreviewsButton() {
  const { toast } = useToast();
  const [isReverting, setIsReverting] = useState(false);

  const handleRevert = async () => {
    try {
      setIsReverting(true);
      const result = await revertVoicePreviews();
      
      const successCount = result.results.filter((r: any) => r.success).length;
      const failureCount = result.results.filter((r: any) => !r.success).length;
      
      toast({
        title: "Reversion Complete",
        description: `Successfully reverted ${successCount} files. ${failureCount} files failed.`,
        variant: failureCount > 0 ? "destructive" : "default",
      });

      // Log detailed results for debugging
      console.log("Reversion results:", result);
      
    } catch (error) {
      console.error("Failed to revert voice previews:", error);
      toast({
        title: "Reversion Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <Button 
      onClick={handleRevert} 
      disabled={isReverting}
      variant="destructive"
    >
      {isReverting ? "Reverting..." : "Revert Voice Previews"}
    </Button>
  );
}