"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Separator } from "@jungle/ui";
import { Sun, Moon, Monitor, Check } from "lucide-react";

const ACCENT_COLORS = [
  { name: "Default", value: "default", bg: "bg-primary" },
  { name: "Blue", value: "blue", bg: "bg-blue-500" },
  { name: "Green", value: "green", bg: "bg-green-500" },
  { name: "Purple", value: "purple", bg: "bg-purple-500" },
  { name: "Orange", value: "orange", bg: "bg-orange-500" },
  { name: "Rose", value: "rose", bg: "bg-rose-500" },
];

const FONT_SIZES = [
  { label: "Small", value: "sm", preview: "text-sm" },
  { label: "Default", value: "base", preview: "text-base" },
  { label: "Large", value: "lg", preview: "text-lg" },
];

export default function DesignSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState("default");
  const [fontSize, setFontSize] = useState("base");
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    setAccentColor(localStorage.getItem("jungle-accent") ?? "default");
    setFontSize(localStorage.getItem("jungle-font-size") ?? "base");
    setCompact(localStorage.getItem("jungle-compact") === "true");
  }, []);

  const handleAccent = (value: string) => {
    setAccentColor(value);
    localStorage.setItem("jungle-accent", value);
    document.documentElement.setAttribute("data-accent", value);
  };

  const handleFontSize = (value: string) => {
    setFontSize(value);
    localStorage.setItem("jungle-font-size", value);
    document.documentElement.setAttribute("data-font-size", value);
  };

  const handleCompact = (value: boolean) => {
    setCompact(value);
    localStorage.setItem("jungle-compact", String(value));
    document.documentElement.classList.toggle("compact", value);
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card>
        <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "light", label: "Light", icon: Sun, preview: "bg-white border" },
              { key: "dark", label: "Dark", icon: Moon, preview: "bg-zinc-900 border-zinc-700" },
              { key: "system", label: "System", icon: Monitor, preview: "bg-gradient-to-r from-white to-zinc-900 border" },
            ].map(({ key, label, icon: Icon, preview }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  theme === key ? "border-primary bg-primary/5" : "border-transparent hover:border-muted"
                }`}
              >
                <div className={`w-full h-16 rounded ${preview}`} />
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                {theme === key && <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accent color */}
      <Card>
        <CardHeader><CardTitle>Accent Color</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccent(color.value)}
                className="flex flex-col items-center gap-1.5"
                title={color.name}
              >
                <div className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center ring-2 ring-offset-2 ${
                  accentColor === color.value ? "ring-foreground" : "ring-transparent"
                }`}>
                  {accentColor === color.value && <Check className="h-4 w-4 text-white" />}
                </div>
                <span className="text-xs text-muted-foreground">{color.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Font size */}
      <Card>
        <CardHeader><CardTitle>Font Size</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {FONT_SIZES.map((size) => (
              <Button
                key={size.value}
                variant={fontSize === size.value ? "default" : "outline"}
                onClick={() => handleFontSize(size.value)}
                className="flex-1"
              >
                <span className={size.preview}>{size.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader><CardTitle>Layout</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Compact Mode</Label>
              <p className="text-xs text-muted-foreground">Reduce spacing between elements for a denser layout.</p>
            </div>
            <Button
              variant={compact ? "default" : "outline"}
              size="sm"
              onClick={() => handleCompact(!compact)}
            >
              {compact ? "On" : "Off"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
