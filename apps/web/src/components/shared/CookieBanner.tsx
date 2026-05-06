"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardContent, Switch, Label } from "@jungle/ui";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface CookiePreferences {
 essential: boolean;
 analytics: boolean;
 advertising: boolean;
}

const STORAGE_KEY = "jungle_cookie_prefs";

export function CookieBanner() {
 const t = useTranslations("cookie");
 const [visible, setVisible] = useState(false);
 const [showDetails, setShowDetails] = useState(false);
 const [prefs, setPrefs] = useState<CookiePreferences>({
 essential: true,
 analytics: true,
 advertising: false,
 });

 useEffect(() => {
 const stored = localStorage.getItem(STORAGE_KEY);
 if (!stored) {
 setVisible(true);
 }
 }, []);

 const acceptAll = () => {
 const all: CookiePreferences = { essential: true, analytics: true, advertising: true };
 localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
 setVisible(false);
 };

 const acceptSelected = () => {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
 setVisible(false);
 };

 const rejectOptional = () => {
 const minimal: CookiePreferences = { essential: true, analytics: false, advertising: false };
 localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
 setVisible(false);
 };

 if (!visible) return null;

 return (
 <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl">
 <div className="max-w-4xl mx-auto">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1 space-y-2">
 <h3 className="font-semibold text-base">{t("title")}</h3>
 <p className="text-sm text-muted-foreground">
 {t("description")}
 </p>
 </div>
 <Button variant="ghost" size="icon-sm" onClick={() => setVisible(false)} aria-label={t("close")}>
 <X className="h-4 w-4" />
 </Button>
 </div>

 {showDetails && (
 <div className="mt-4 space-y-3">
 <div className="flex items-center justify-between py-2">
 <div>
 <Label>{t("essential")}</Label>
 <p className="text-xs text-muted-foreground">{t("essentialDesc")}</p>
 </div>
 <Switch checked disabled />
 </div>
 <div className="flex items-center justify-between py-2">
 <div>
 <Label>{t("analytics")}</Label>
 <p className="text-xs text-muted-foreground">{t("analyticsDesc")}</p>
 </div>
 <Switch checked={prefs.analytics} onCheckedChange={(v) => setPrefs({ ...prefs, analytics: v })} />
 </div>
 <div className="flex items-center justify-between py-2">
 <div>
 <Label>{t("advertising")}</Label>
 <p className="text-xs text-muted-foreground">{t("advertisingDesc")}</p>
 </div>
 <Switch checked={prefs.advertising} onCheckedChange={(v) => setPrefs({ ...prefs, advertising: v })} />
 </div>
 </div>
 )}

 <div className="flex flex-wrap gap-2 mt-4">
 <Button size="sm" onClick={acceptAll}>{t("acceptAll")}</Button>
 <Button size="sm" variant="outline" onClick={acceptSelected}>{t("acceptSelected")}</Button>
 <Button size="sm" variant="outline" onClick={rejectOptional}>{t("rejectOptional")}</Button>
 <Button size="sm" variant="ghost" onClick={() => setShowDetails(!showDetails)}>
 {showDetails ? t("hide") : t("customize")}
 </Button>
 </div>
 </div>
 </div>
 );
}