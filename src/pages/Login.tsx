import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const Login = () => {
  const navigate = useNavigate();
  const { session, isAdmin } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

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
              style: {
                input: {
                  borderRadius: '0.375rem',
                  padding: '0.5rem 0.75rem',
                },
                button: {
                  borderRadius: '0.375rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                },
                container: {
                  position: 'relative',
                },
                anchor: {
                  color: '#2563eb',
                },
              },
              className: {
                input: cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                  "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "pr-10" // Add padding for the eye icon
                ),
                button: "bg-primary text-primary-foreground hover:bg-primary/90",
                container: "relative",
                anchor: "text-primary hover:text-primary/80 transition-colors",
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
            view="sign_in"
            transformComponents={({ PasswordInput }) => ({
              PasswordInput: (props) => {
                return (
                  <div className="relative">
                    <PasswordInput {...props} type={showPassword ? "text" : "password"} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                );
              },
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
