import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { navItems } from "./nav-items";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminOrders } from "./pages/AdminOrders";
import { AdminReports } from "./pages/AdminReports";
import { AdminCustomers } from "./pages/AdminCustomers";
import { AdminProducts } from "./pages/AdminProducts";
import { AdminUserManagement } from "./pages/AdminUserManagement";
import { AdminLoginHistory } from "./pages/AdminLoginHistory";
import { AdminSMTPTests } from "./pages/AdminSMTPTests";
import { AdminSMTPConfig } from "./pages/AdminSMTPConfig";
import { AdminSSLConfig } from "./pages/AdminSSLConfig";
import { AdminNotifications } from "./pages/AdminNotifications";
import { AdminCourierManagement } from "./pages/AdminCourierManagement";
import { AdminLayout } from "./components/admin/AdminLayout";
import { PaymentError } from "./pages/PaymentError";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
          <Routes>
          {navItems.map(({ to, page }) => (
            <Route key={to} path={to} element={page} />
          ))}
          
          {/* Payment Error Route */}
          <Route path="/payment-error" element={<PaymentError />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/superadmin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="courier-management" element={<AdminCourierManagement />} />
            <Route path="login-history" element={<AdminLoginHistory />} />
            <Route path="notifications" element={<AdminNotifications />} />

            <Route path="smtp-config" element={<AdminSMTPConfig />} />
            <Route path="ssl-config" element={<AdminSSLConfig />} />
          </Route>
          
          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
