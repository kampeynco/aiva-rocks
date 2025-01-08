import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PurchaseButtonProps {
  isProcessing: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function PurchaseButton({ isProcessing, disabled, onClick }: PurchaseButtonProps) {
  return (
    <Button 
      onClick={onClick} 
      disabled={disabled || isProcessing}
      className="w-32 px-4"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Buying...
        </>
      ) : (
        "Buy Number"
      )}
    </Button>
  );
}