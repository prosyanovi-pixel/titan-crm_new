// frontend/src/modules/profile/components/ProfileAppearanceTab.tsx
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, Type, MoveVertical, Layout, Monitor } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { accentColors } from "@/lib/settings-data";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ProfileAppearanceTab() {
  const { t } = useTranslation();
  const { 
    theme, setTheme, 
    accentColor, setAccentColor,
    density, setDensity,
    tableFontSize, setTableFontSize 
  } = useSettings();

  const themes = [
    { id: "light",  icon: Layout,  bg: "bg-white border-border",        label: t("components.label.light") },
    { id: "dark",   icon: Layout,  bg: "bg-slate-950 border-slate-800", label: t("components.label.dark") },
    { id: "system", icon: Monitor, bg: "bg-gradient-to-br from-white to-slate-950", label: "Системная" },
  ];

  const densities = [
    { id: 'comfortable', label: 'Уютный', desc: 'Стандартные отступы' },
    { id: 'compact',     label: 'Компактный', desc: 'Для небольших экранов' },
    { id: 'high',        label: 'Плотный', desc: 'Максимум информации' },
  ];

  const fontSizes = [
    { id: 'small',  label: 'Мелкий',  px: '12px' },
    { id: 'medium', label: 'Средний', px: '14px' },
    { id: 'large',  label: 'Крупный', px: '16px' },
  ];

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle>{t("components.card.title.appearance")}</CardTitle>
        <CardDescription>{t("components.card.description.appearance")}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-8">
        
        {/* Theme */}
        <div className="space-y-4">
          <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
            <Layout className="w-3.5 h-3.5" /> {t("components.label.theme")}
          </Label>
          <div className="flex flex-wrap gap-3">
            {themes.map(({ id, bg, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id as any)}
                className={cn(
                  "flex-1 min-w-[120px] flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  theme === id ? "border-primary bg-primary/[0.03]" : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <div className={cn("w-full h-12 rounded-lg border shadow-sm flex items-center justify-center", bg)}>
                   <Icon className={cn("w-5 h-5", id === 'light' ? 'text-slate-400' : 'text-slate-500')} />
                </div>
                <span className="font-bold text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accents */}
        <div className="space-y-4">
          <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-primary" /> {t("components.label.accent_color")}
          </Label>
          <div className="flex flex-wrap gap-2">
            {accentColors.map((color) => (
              <button
                key={color.id}
                onClick={() => setAccentColor(color.id)}
                title={t(color.name)}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center",
                  accentColor === color.id ? "border-primary scale-110 shadow-md" : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: `hsl(${color.primary})` }}
              >
                {accentColor === color.id && <Check className="w-5 h-5 text-white drop-shadow-md" />}
              </button>
            ))}
          </div>
        </div>

        {/* Density & Font Size */}
        <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-dashed">
          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
              <MoveVertical className="w-3.5 h-3.5" /> Плотность таблиц
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {densities.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDensity(d.id as any)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all",
                    density === d.id ? "border-primary bg-primary/[0.03]" : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <div className="text-left">
                    <p className="font-bold text-sm">{d.label}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{d.desc}</p>
                  </div>
                  {density === d.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
              <Type className="w-3.5 h-3.5" /> Размер шрифта
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {fontSizes.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTableFontSize(f.id as any)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all",
                    tableFontSize === f.id ? "border-primary bg-primary/[0.03]" : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm">{f.label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono" style={{ fontSize: f.px }}>Aa</span>
                  </div>
                  {tableFontSize === f.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
