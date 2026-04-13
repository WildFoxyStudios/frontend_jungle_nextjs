"use client";

import { useTheme } from "next-themes";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@jungle/ui";

export default function DesignSettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <CardHeader><CardTitle>Design & Theme</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>Light</Button>
          <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>Dark</Button>
          <Button variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")}>System</Button>
        </div>
      </CardContent>
    </Card>
  );
}
