import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !session) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to access this page.",
      });
    } else if (!isLoading && session && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You don't have permission to access this page.",
      });
    }
  }, [isLoading, session, isAdmin, toast]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-xl mx-auto space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;