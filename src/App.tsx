import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Bundles from "./pages/Bundles";
import StockIn from "./pages/StockIn";
import StockOut from "./pages/StockOut";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";
import AdminPermissions from "./pages/AdminPermissions";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />

            {/* Products - Admin & Owner */}
            <Route
              path="/products"
              element={
                <ProtectedRoute allowedRoles={["admin", "owner"]} requiredPermission="products">
                  <Products />
                </ProtectedRoute>
              }
            />

            {/* Bundles - Admin & Owner */}
            <Route
              path="/bundles"
              element={
                <ProtectedRoute allowedRoles={["admin", "owner"]} requiredPermission="bundles">
                  <Bundles />
                </ProtectedRoute>
              }
            />

            {/* Stock In - Admin & Owner */}
            <Route
              path="/stock-in"
              element={
                <ProtectedRoute allowedRoles={["admin", "owner"]} requiredPermission="stock_in">
                  <StockIn />
                </ProtectedRoute>
              }
            />

            {/* Stock Out - Admin & Owner */}
            <Route
              path="/stock-out"
              element={
                <ProtectedRoute allowedRoles={["admin", "owner"]} requiredPermission="stock_out">
                  <StockOut />
                </ProtectedRoute>
              }
            />

            {/* Reports - Owner only (or Admin with permission) */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={["admin", "owner"]} requiredPermission="reports">
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* History - Owner only (or Admin with permission) */}
            <Route
              path="/history"
              element={
                <ProtectedRoute allowedRoles={["admin", "owner"]} requiredPermission="history">
                  <History />
                </ProtectedRoute>
              }
            />

            {/* Suppliers - Owner only (or Admin with permission) */}
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute allowedRoles={["admin", "owner"]} requiredPermission="suppliers">
                  <Suppliers />
                </ProtectedRoute>
              }
            />

            {/* Users - Owner only */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Admin Permissions - Owner only */}
            <Route
              path="/admin-permissions"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <AdminPermissions />
                </ProtectedRoute>
              }
            />

            {/* Settings - All authenticated users */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
