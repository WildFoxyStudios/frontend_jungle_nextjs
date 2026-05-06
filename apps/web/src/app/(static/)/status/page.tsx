import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from "@jungle/ui";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
 title: "System Status — Jungle",
 description: "Current operational status of Jungle services.",
};

const SERVICES = [
 { name: "Web App", status: "operational" },
 { name: "API", status: "operational" },
 { name: "Messaging", status: "operational" },
 { name: "Live Streaming", status: "operational" },
 { name: "Payments", status: "operational" },
 { name: "Media Upload", status: "operational" },
 { name: "Notifications", status: "operational" },
];

export default async function StatusPage() {
 const allOperational = SERVICES.every((s) => s.status === "operational");

 return (
 <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
 <div className="text-center space-y-2">
 <h1 className="text-3xl font-bold">System Status</h1>
 <div className="flex items-center justify-center gap-2">
 {allOperational ? (
 <>
 <CheckCircle2 className="h-5 w-5 text-emerald-500" />
 <span className="text-emerald-600 font-medium">All Systems Operational</span>
 </>
 ) : (
 <>
 <AlertTriangle className="h-5 w-5 text-amber-500" />
 <span className="text-amber-600 font-medium">Some systems experiencing issues</span>
 </>
 )}
 </div>
 </div>

 <Card>
 <CardHeader>
 <CardTitle>Services</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 {SERVICES.map((svc) => (
 <div key={svc.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
 <span className="font-medium">{svc.name}</span>
 <Badge variant={svc.status === "operational" ? "soft-success" : "soft-warning"}>
 {svc.status === "operational" ? "Operational" : "Degraded"}
 </Badge>
 </div>
 ))}
 </CardContent>
 </Card>

 <p className="text-center text-sm text-muted-foreground">
 Last updated: {new Date().toLocaleString()}
 </p>
 </div>
 );
}
