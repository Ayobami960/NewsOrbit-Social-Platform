
import PageLoader from "./PageLoader";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";
import type { Role } from "../types";
import { Navigate } from "react-router";


type ProtectedRouteProps = {
  children: ReactNode;
  roles?: Role[];
};

type PublicRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // Already logged in → redirect to home/dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export { ProtectedRoute, PublicRoute };