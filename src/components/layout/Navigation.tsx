import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Wind, Settings, BarChart3, AlertCircle, Zap } from "lucide-react";
const Navigation = () => {
  const location = useLocation();
  const navigation = [{
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard
  }, {
    name: "Equipamentos",
    href: "/equipments",
    icon: Wind
  }, {
    name: "Automações",
    href: "/automations",
    icon: Zap
  }, {
    name: "Relatórios",
    href: "/reports",
    icon: BarChart3
  }, {
    name: "Alarmes",
    href: "/alarms",
    icon: AlertCircle
  }, {
    name: "Configurações",
    href: "/settings",
    icon: Settings
  }];
  return <nav className="bg-card border-r border-border min-h-screen w-64 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-cooling bg-clip-text text-transparent">Brise Cloud</h1>
        <p className="text-sm text-muted-foreground">
          Gestão Inteligente de Climatização
        </p>
      </div>

      <div className="space-y-2">
        {navigation.map(item => {
        const isActive = location.pathname === item.href;
        return <Link key={item.name} to={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200", isActive ? "bg-gradient-cooling text-white shadow-cool" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>;
      })}
      </div>
    </nav>;
};
export default Navigation;