import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@jungle/ui";
import { Home } from "lucide-react";

export default function NotFound() {
 const t = useTranslations("errors");

 return (
 <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
 <div className="border bg-secondary px-6 py-3 shadow-md">
 <p className="text-6xl font-semibold text-secondary-foreground">404</p>
 </div>
 <p className="max-w-md text-lg font-semibold text-foreground">{t("notFoundDescription")}</p>
 <Button asChild>
 <Link href="/feed">
 <Home className="h-4 w-4" /> {t("goHome")}
 </Link>
 </Button>
 </div>
 );
}
