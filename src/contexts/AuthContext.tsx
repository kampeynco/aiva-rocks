import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      navigate("/login");
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  // Handle user activity
  const updateLastActivity = () => {
    setLastActivity(Date.now());
  };

  // Check for inactivity
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      if (session && now - lastActivity > INACTIVITY_TIMEOUT) {
        handleSignOut();
        toast({
          title: "Session expired",
          description: "You have been signed out due to inactivity.",
        });
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [session, lastActivity]);

  // Setup activity listeners
  useEffect(() => {
    if (session) {
      window.addEventListener("mousemove", updateLastActivity);
      window.addEventListener("keydown", updateLastActivity);
      window.addEventListener("click", updateLastActivity);
      window.addEventListener("scroll", updateLastActivity);
    }

    return () => {
      window.removeEventListener("mousemove", updateLastActivity);
      window.removeEventListener("keydown", updateLastActivity);
      window.removeEventListener("click", updateLastActivity);
      window.removeEventListener("scroll", updateLastActivity);
    };
  }, [session]);

  // Handle tab/window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking admin status:", error);
      return;
    }

    setIsAdmin(data.is_admin);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isLoading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};