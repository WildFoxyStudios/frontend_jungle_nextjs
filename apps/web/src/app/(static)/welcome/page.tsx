import Link from "next/link";
import { Button } from "@jungle/ui";
import { api } from "@jungle/api-client";
import type { PublicConfig } from "@jungle/api-client";

async function getPublicConfig(): Promise<PublicConfig | null> {
  try {
    return await api.get<PublicConfig>("/v1/config/public");
  } catch {
    return null;
  }
}

export default async function WelcomePage() {
  const config = await getPublicConfig();

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold">{config?.site_name ?? "Jungle"}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {config?.site_description ?? "Connect with friends and the world around you."}
        </p>
      </div>
      <div className="flex gap-4 justify-center">
        <Button size="lg" asChild><Link href="/register">Get started</Link></Button>
        <Button size="lg" variant="outline" asChild><Link href="/login">Sign in</Link></Button>
      </div>
      {config?.features && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {Object.entries(config.features).filter(([, v]) => v).slice(0, 8).map(([key]) => (
            <div key={key} className="p-4 border rounded-lg text-sm capitalize">
              {key.replace(/_/g, " ")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
