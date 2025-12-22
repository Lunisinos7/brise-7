import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import { languages } from '@/lib/i18n';

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('settings.language')}
        </CardTitle>
        <CardDescription>
          {t('settings.languageDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={i18n.language}
          onValueChange={handleLanguageChange}
          className="space-y-2"
        >
          {languages.map((lang) => (
            <div key={lang.code} className="flex items-center space-x-3">
              <RadioGroupItem value={lang.code} id={lang.code} />
              <Label
                htmlFor={lang.code}
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors">
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default LanguageSelector;
