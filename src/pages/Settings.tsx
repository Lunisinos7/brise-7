import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Palette, Monitor, Moon, Leaf, Heart, Crown, Plug } from "lucide-react";
import { useState, useEffect } from "react";
import { SmartThingsConfig } from "@/components/settings/SmartThingsConfig";

type Theme = 'default' | 'dark' | 'green-light' | 'green-dark' | 'red' | 'purple';

const Settings = () => {
  const [selectedTheme, setSelectedTheme] = useState<Theme>('default');

  const themes = [
    {
      id: 'default' as Theme,
      name: 'Tema Padrão (Azul)',
      description: 'Tema padrão com cores azuis para HVAC',
      icon: Monitor,
      preview: 'bg-gradient-to-r from-blue-400 to-cyan-300'
    },
    {
      id: 'dark' as Theme,
      name: 'Tema Escuro',
      description: 'Tema escuro para melhor visualização noturna',
      icon: Moon,
      preview: 'bg-gradient-to-r from-gray-800 to-gray-600'
    },
    {
      id: 'green-light' as Theme,
      name: 'Verde Claro',
      description: 'Tema verde claro focado em eficiência energética',
      icon: Leaf,
      preview: 'bg-gradient-to-r from-green-400 to-emerald-300'
    },
    {
      id: 'green-dark' as Theme,
      name: 'Verde Escuro',
      description: 'Tema verde escuro profissional',
      icon: Leaf,
      preview: 'bg-gradient-to-r from-green-600 to-green-800'
    },
    {
      id: 'red' as Theme,
      name: 'Tema Vermelho',
      description: 'Tema vermelho energético para aquecimento',
      icon: Heart,
      preview: 'bg-gradient-to-r from-red-400 to-pink-400'
    },
    {
      id: 'purple' as Theme,
      name: 'Tema Roxo',
      description: 'Tema roxo premium e elegante',
      icon: Crown,
      preview: 'bg-gradient-to-r from-purple-400 to-indigo-400'
    }
  ];

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
    root.classList.remove('theme-dark', 'theme-green-light', 'theme-green-dark', 'theme-red', 'theme-purple');
    
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Personalize a aparência e comportamento do sistema HVAC Smart
        </p>
      </div>

      {/* Integrations Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Integrações</h2>
        </div>
        
        <SmartThingsConfig />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Temas de Aparência
          </CardTitle>
          <CardDescription>
            Escolha um tema que combina com seu ambiente de trabalho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedTheme} 
            onValueChange={handleThemeChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {themes.map((theme) => (
              <div key={theme.id} className="flex items-center space-x-3">
                <RadioGroupItem value={theme.id} id={theme.id} />
                <Label 
                  htmlFor={theme.id}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors">
                    <theme.icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{theme.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {theme.description}
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full ${theme.preview}`} />
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sobre o Sistema</CardTitle>
          <CardDescription>
            Informações do sistema HVAC Smart
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versão:</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última atualização:</span>
              <span>23/09/2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desenvolvido por:</span>
              <span>HVAC Smart Team</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
