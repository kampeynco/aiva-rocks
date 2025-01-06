import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface AuthNavLinksProps {
  type: "login" | "register" | "forgot-password";
}

export const AuthNavLinks = ({ type }: AuthNavLinksProps) => {
  return (
    <div className="mt-4 text-center space-y-2">
      {type !== "login" && (
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline inline-flex items-center"
          >
            Sign In
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </p>
      )}
      {type !== "register" && (
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary hover:underline inline-flex items-center"
          >
            Sign Up
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </p>
      )}
      {type === "login" && (
        <p className="text-sm text-muted-foreground">
          <Link
            to="/forgot-password"
            className="text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      )}
    </div>
  );
};