import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DialogHeader as BaseDialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DialogHeaderProps {
  isLoadingSubscription: boolean;
  formattedFee: string | null;
}

export function DialogHeader({ isLoadingSubscription, formattedFee }: DialogHeaderProps) {
  return (
    <BaseDialogHeader>
      <DialogTitle className="text-xl font-semibold">Purchase Phone Number</DialogTitle>
      <DialogDescription className="pt-2">
        {isLoadingSubscription ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading subscription details...
          </span>
        ) : formattedFee ? (
          <>
            This number incurs a monthly fee of {formattedFee}
            <Alert className="mt-4">
              <AlertDescription>
                Only local numbers with voice, SMS, and MMS capabilities will be available for purchase.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          "Unable to retrieve fee information"
        )}
      </DialogDescription>
    </BaseDialogHeader>
  );
}