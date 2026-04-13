import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@jungle/ui";

export default function DevelopersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Developer Portal</h1>
      <Card>
        <CardHeader><CardTitle>Build with Jungle</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Create OAuth apps and integrate with the Jungle API.</p>
          <Button asChild><Link href="/developers/apps">My Apps</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
