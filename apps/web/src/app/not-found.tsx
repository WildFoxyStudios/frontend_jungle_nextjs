import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@jungle/ui";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-muted p-4">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-bold text-muted-foreground">404</h1>
        <p className="text-lg text-muted-foreground">{t("notFoundDescription")}</p>
      </div>
      <Button asChild className="gap-2">
        <Link href="/feed"><Home className="h-4 w-4" /> {t("goHome")}</Link>
      </Button>
    </div>
  );
}
