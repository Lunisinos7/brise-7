import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Palette, Monitor, Moon, Leaf, Heart, Crown, Plug, Zap, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SmartThingsConfig } from "@/components/settings/SmartThingsConfig";
import { BriseConfig } from "@/components/settings/BriseConfig";
import { EnergyRateConfig } from "@/components/settings/EnergyRateConfig";
import LanguageSelector from "@/components/settings/LanguageSelector";

type Theme = 'default' | 'dark' | 'green-light' | 'green-dark' | 'red' | 'red-dark' | 'purple' | 'purple-dark';

interface ThemeOption {
  id: Theme;
  nameKey: string;
  icon: React.ComponentType<{ className?: string }>;
  preview: string;
}

const lightThemes: ThemeOption[] = [
  {
    id: 'default',
    nameKey: 'settings.themeNames.default',
    icon: Monitor,
    preview: 'bg-gradient-to-r from-blue-400 to-cyan-300'
  },
  {
    id: 'green-light',
    nameKey: 'settings.themeNames.greenLight',
    icon: Leaf,
    preview: 'bg-gradient-to-r from-green-400 to-emerald-300'
  },
  {
    id: 'red',
    nameKey: 'settings.themeNames.red',
    icon: Heart,
    preview: 'bg-gradient-to-r from-red-400 to-pink-400'
  },
  {
    id: 'purple',
    nameKey: 'settings.themeNames.purple',
    icon: Crown,
    preview: 'bg-gradient-to-r from-purple-400 to-indigo-400'
  }
];

const darkThemes: ThemeOption[] = [
  {
    id: 'dark',
    nameKey: 'settings.themeNames.dark',
    icon: Moon,
    preview: 'bg-gradient-to-r from-blue-700 to-slate-800'
  },
  {
    id: 'green-dark',
    nameKey: 'settings.themeNames.greenDark',
    icon: Leaf,
    preview: 'bg-gradient-to-r from-green-600 to-green-800'
  },
  {
    id: 'red-dark',
    nameKey: 'settings.themeNames.redDark',
    icon: Heart,
    preview: 'bg-gradient-to-r from-red-600 to-red-900'
  },
  {
    id: 'purple-dark',
    nameKey: 'settings.themeNames.purpleDark',
    icon: Crown,
    preview: 'bg-gradient-to-r from-purple-600 to-indigo-900'
  }
];

const Settings = () => {
  const [selectedTheme, setSelectedTheme] = useState<Theme>('default');
  const { t } = useTranslation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('hvac-theme') as Theme;
    if (savedTheme) {
      setSelectedTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove(
      'theme-dark', 
      'theme-green-light', 
      'theme-green-dark', 
      'theme-red', 
      'theme-red-dark', 
      'theme-purple', 
      'theme-purple-dark'
    );
    
    // Apply new theme class
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setSelectedTheme(theme);
    applyTheme(theme);
    localStorage.setItem('hvac-theme', theme);
  };

  const renderThemeOption = (theme: ThemeOption) => (
    <div key={theme.id} className="flex items-center space-x-3">
      <RadioGroupItem value={theme.id} id={theme.id} />
      <Label 
        htmlFor={theme.id}
        className="flex-1 cursor-pointer"
      >
        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors">
          <theme.icon className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium flex-1">{t(theme.nameKey)}</span>
          <div className={`w-6 h-6 rounded-full ${theme.preview}`} />
        </div>
      </Label>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language Selector */}
      <LanguageSelector />

      {/* Energy Rate Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{t('settings.energyRate')}</h2>
        </div>
        
        <EnergyRateConfig />
      </div>

      {/* Integrations Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{t('settings.integrations')}</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <BriseConfig />
          <SmartThingsConfig />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('settings.themes')}
          </CardTitle>
          <CardDescription>
            {t('settings.themesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedTheme} 
            onValueChange={handleThemeChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Light Themes Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm text-muted-foreground">{t('settings.lightThemes')}</span>
              </div>
              <div className="space-y-2">
                {lightThemes.map(renderThemeOption)}
              </div>
            </div>

            {/* Dark Themes Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Moon className="h-4 w-4 text-indigo-400" />
                <span className="font-medium text-sm text-muted-foreground">{t('settings.darkThemes')}</span>
              </div>
              <div className="space-y-2">
                {darkThemes.map(renderThemeOption)}
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.about')}</CardTitle>
          <CardDescription>
            {t('settings.aboutDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('settings.version')}:</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('settings.lastUpdate')}:</span>
              <span>22/12/2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('settings.developedBy')}:</span>
              <span>HVAC Smart Team</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;