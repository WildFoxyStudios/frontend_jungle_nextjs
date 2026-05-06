"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { authApi } from "@jungle/api-client";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@jungle/ui";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
 const [sent, setSent] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const { register, handleSubmit } = useForm<{ email: string }>();

 const onSubmit = async ({ email }: { email: string }) => {
 setIsLoading(true);
 try {
 await authApi.forgotPassword(email);
 setSent(true);
 } catch (err) {
 const msg = err instanceof Error ? err.message : "Failed to send reset email";
 setError(msg);
 toast.error(msg);
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <Card>
 <CardHeader>
 <CardTitle>Forgot password</CardTitle>
 <CardDescription>Enter your email to receive a reset link</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {sent ? (
 <div className="px-4 py-6 text-center text-[15px] font-semibold text-muted-foreground">
 Check your email for a password reset link.
 </div>
 ) : (
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 <div className="space-y-1">
 <Label htmlFor="email">Email</Label>
 <Input id="email" type="email" {...register("email", { required: true })} />
 </div>
 {error && (
 <p className="border bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground">
 {error}
 </p>
 )}
 <Button type="submit" className="w-full" disabled={isLoading}>
 {isLoading ? "Sending…" : "Send reset link"}
 </Button>
 </form>
 )}
 <p className="text-center text-sm">
 <Link href="/login" className="font-medium text-primary hover:underline">
 Back to login
 </Link>
 </p>
 </CardContent>
 </Card>
 );
}
