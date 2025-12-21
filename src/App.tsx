import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EnvironmentProvider } from "./contexts/EnvironmentContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Equipments from "./pages/Equipments";
import Automations from "./pages/Automations";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Alarms from "./pages/Alarms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EnvironmentProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="equipments" element={<Equipments />} />
              <Route path="automations" element={<Automations />} />
              <Route path="reports" element={<Reports />} />
              <Route path="alarms" element={<Alarms />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </EnvironmentProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
