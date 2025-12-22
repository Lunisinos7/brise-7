import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Wind, Settings, BarChart3, AlertCircle, Zap, Users, LogOut } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import WorkspaceSelector from "@/components/workspace/WorkspaceSelector";

const Navigation = () => {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuthContext();
  const { t } = useTranslation();

  const navigation = [
    {
      name: t('navigation.dashboard'),
      href: "/",
      icon: LayoutDashboard
    },
    {
      name: t('navigation.equipments'),
      href: "/equipments",
      icon: Wind
    },
    {
      name: t('navigation.automations'),
      href: "/automations",
      icon: Zap
    },
    {
      name: t('navigation.reports'),
      href: "/reports",
      icon: BarChart3
    },
    {
      name: t('navigation.alarms'),
      href: "/alarms",
      icon: AlertCircle
    },
    {
      name: t('navigation.users'),
      href: "/users",
      icon: Users,
      adminOnly: false
    },
    {
      name: t('navigation.settings'),
      href: "/settings",
      icon: Settings
    }
  ];

  const filteredNavigation = navigation.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="bg-card border-r border-border min-h-screen w-64 p-6 flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-cooling bg-clip-text text-transparent">{t('brand.name')}</h1>
        <p className="text-sm text-muted-foreground mb-4">
          {t('brand.tagline')}
        </p>
        <WorkspaceSelector />
      </div>

      <div className="space-y-2 flex-1">
        {filteredNavigation.map(item => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-cooling text-white shadow-cool"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {user && (
        <div className="pt-4 border-t border-border mt-4">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            {t('navigation.signOut')}
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
