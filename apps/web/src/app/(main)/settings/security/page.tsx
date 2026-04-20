"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Skeleton, Separator } from "@jungle/ui";
import { toast } from "sonner";
import { Shield, Smartphone, Key } from "lucide-react";

const passwordSchema = z.object({
  current_password: z.string().min(1, "Required"),
  new_password: z.string().min(8, "At least 8 characters"),
  confirm_password: z.string().min(1, "Required"),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

const setPasswordSchema = z.object({
  new_password: z.string().min(8, "At least 8 characters"),
  confirm_password: z.string().min(1, "Required"),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type SetPasswordForm = z.infer<typeof setPasswordSchema>;

export default function SecuritySettingsPage() {
  const { user, setUser } = useAuthStore();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading2FA, setLoading2FA] = useState(false);

  const hasPassword = (user as { has_password?: boolean } | null)?.has_password ?? true;

  const setPasswordForm = useForm<SetPasswordForm>({
    resolver: zodResolver(setPasswordSchema),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      setTwoFAEnabled((user as { two_factor_enabled?: boolean }).two_factor_enabled ?? false);
    }
  }, [user]);

  const onChangePassword = async (data: PasswordForm) => {
    try {
      await authApi.changePassword(data.current_password, data.new_password);
      toast.success("Password changed successfully");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password. Check your current password.");
    }
  };

  const onSetInitialPassword = async (data: SetPasswordForm) => {
    try {
      await authApi.setSocialPassword(data.new_password);
      toast.success("Password set. You can now sign in with your email and password.");
      setPasswordForm.reset();
      if (user) setUser({ ...user, has_password: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set password.");
    }
  };

  const handleEnable2FA = async () => {
    setLoading2FA(true);
    try {
      const res = await authApi.enable2FA();
      setQrCode(res.qr_code);
      toast.success("Scan the QR code with your authenticator app");
    } catch {
      toast.error("Failed to enable 2FA");
    } finally {
      setLoading2FA(false);
    }
  };

  const [disable2FACode, setDisable2FACode] = useState("");
  const [showDisable2FAInput, setShowDisable2FAInput] = useState(false);

  const handleDisable2FA = async () => {
    if (!disable2FACode.trim()) { setShowDisable2FAInput(true); return; }
    try {
      await authApi.disable2FA(disable2FACode);
      setTwoFAEnabled(false);
      setQrCode(null);
      setDisable2FACode("");
      setShowDisable2FAInput(false);
      toast.success("Two-factor authentication disabled");
    } catch {
      toast.error("Invalid code");
    }
  };

  const handleGetBackupCodes = async () => {
    try {
      const res = await authApi.getBackupCodes();
      setBackupCodes(res.codes);
    } catch {
      toast.error("Failed to get backup codes");
    }
  };

  return (
    <div className="space-y-4">
      {/* Password — change if one exists, otherwise set initial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> {hasPassword ? "Change Password" : "Set Password"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasPassword ? (
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <Input type="password" autoComplete="current-password" {...register("current_password")} />
                {errors.current_password && <p className="text-xs text-destructive">{errors.current_password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" autoComplete="new-password" {...register("new_password")} />
                {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" autoComplete="new-password" {...register("confirm_password")} />
                {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Changing…" : "Change Password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={setPasswordForm.handleSubmit(onSetInitialPassword)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your account was created through a social login and doesn’t
                have a password yet. Set one here to sign in with your email
                and password in addition to the original provider.
              </p>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" autoComplete="new-password" {...setPasswordForm.register("new_password")} />
                {setPasswordForm.formState.errors.new_password && (
                  <p className="text-xs text-destructive">{setPasswordForm.formState.errors.new_password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" autoComplete="new-password" {...setPasswordForm.register("confirm_password")} />
                {setPasswordForm.formState.errors.confirm_password && (
                  <p className="text-xs text-destructive">{setPasswordForm.formState.errors.confirm_password.message}</p>
                )}
              </div>
              <Button type="submit" disabled={setPasswordForm.formState.isSubmitting}>
                {setPasswordForm.formState.isSubmitting ? "Setting…" : "Set Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Auth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" /> Two-Factor Authentication
            <Badge variant={twoFAEnabled ? "default" : "secondary"}>
              {twoFAEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account by requiring a code from your authenticator app.
          </p>

          {qrCode && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Scan this QR code with your authenticator app:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border rounded" />
            </div>
          )}

          {backupCodes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Backup codes (save these somewhere safe):</p>
              <div className="grid grid-cols-2 gap-1">
                {backupCodes.map((code) => (
                  <code key={code} className="text-xs bg-muted px-2 py-1 rounded font-mono">{code}</code>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {showDisable2FAInput && (
              <div className="flex gap-2 items-center">
                <Input
                  value={disable2FACode}
                  onChange={(e) => setDisable2FACode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="max-w-[180px]"
                  autoComplete="one-time-code"
                />
                <Button variant="destructive" onClick={handleDisable2FA} disabled={disable2FACode.length < 6}>
                  Confirm
                </Button>
                <Button variant="ghost" onClick={() => { setShowDisable2FAInput(false); setDisable2FACode(""); }}>
                  Cancel
                </Button>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {!twoFAEnabled ? (
                <Button onClick={handleEnable2FA} disabled={loading2FA}>
                  <Shield className="h-4 w-4 mr-2" />
                  {loading2FA ? "Setting up…" : "Enable 2FA"}
                </Button>
              ) : (
                <>
                  {!showDisable2FAInput && (
                    <Button variant="destructive" onClick={() => setShowDisable2FAInput(true)}>
                      Disable 2FA
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleGetBackupCodes}>View Backup Codes</Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
