import { AuthContext, UserRole, UserPermissions } from "@/contexts/AuthContext";
import { useContext } from "react";

export type { UserRole, UserPermissions };

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
