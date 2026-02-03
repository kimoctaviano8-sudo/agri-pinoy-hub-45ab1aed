import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

/**
 * Route guard component that ensures only admin users can access protected routes.
 * Shows a loading spinner while verifying permissions, then either renders children
 * or redirects non-admin users to the home page.
 */
export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;
    
    // If no user or role is still loading (null), wait
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    
    // If role is loaded and not admin, redirect
    if (userRole !== null && userRole !== "admin") {
      navigate("/", { replace: true });
    }
  }, [user, userRole, isLoading, navigate]);

  // Show loading while checking auth
  if (isLoading || !user || userRole === null) {
    return (
      <div className="min-h-screen bg-gradient-earth flex items-center justify-center pb-20">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">Verifying Permissions</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not admin (redirect will happen via useEffect)
  if (userRole !== "admin") {
    return null;
  }

  // Render protected content for admin users
  return <>{children}</>;
};
