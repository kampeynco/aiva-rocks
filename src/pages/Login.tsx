import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { session, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        sessionStorage.setItem('authSession', JSON.stringify(session));
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('authSession');
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      } else if (event === 'USER_UPDATED') {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      } else if (event === 'PASSWORD_RECOVERY') {
        toast({
          title: "Password recovery",
          description: "Check your email for password reset instructions.",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  useEffect(() => {
    // Redirect authenticated admin users to dashboard
    if (session && isAdmin) {
      navigate("/");
    }
  }, [session, isAdmin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">AIVA Builder Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#2563eb",
                    brandAccent: "#1d4ed8",
                  },
                },
              },
              className: {
                input: "relative",
                password: "pr-10", // Add padding for the eye icon
              },
              extend: {
                password: {
                  togglePassword: {
                    base: "absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700",
                    show: Eye,
                    hide: EyeOff,
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin}
            localization={{
              variables: {
                sign_in: {
                  email_label: "Email address",
                  password_label: "Password",
                },
                sign_up: {
                  email_label: "Email address",
                  password_label: "Password",
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;