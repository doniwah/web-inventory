import { useAuth, UserRole, UserPermissions } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: keyof UserPermissions;
}

export function ProtectedRoute({ children, allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Owner always has full access
  if (user.role === 'owner') {
    return <>{children}</>;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground mb-6">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <a href="/dashboard" className="text-primary hover:underline">
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Check permission for admin users
  if (requiredPermission && user.role === 'admin') {
    const hasPermission = user.permissions?.[requiredPermission] ?? false;
    
    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <div className="rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Akses Terbatas</h2>
            <p className="text-muted-foreground mb-6">
              Anda tidak memiliki izin untuk mengakses fitur ini. Hubungi Owner untuk mendapatkan akses.
            </p>
            <a href="/dashboard" className="text-primary hover:underline">
              Kembali ke Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
