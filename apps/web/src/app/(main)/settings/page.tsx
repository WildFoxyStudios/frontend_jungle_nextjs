"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import type { User } from "@jungle/api-client";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@jungle/hooks";
import {
  Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator,
} from "@jungle/ui";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type ProfileForm = Pick<User, "first_name" | "last_name" | "about" | "gender" | "birthday" | "website" | "location">;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const t = useTranslations("settings");
  const tp = useTranslations("profile");
  const ta = useTranslations("auth");
  const tc = useTranslations("common");
  const te = useTranslations("settings_extra");
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProfileForm>();

  useEffect(() => {
    usersApi.getMe().then((me) => {
      setProfile(me);
      reset({
        first_name: me.first_name,
        last_name: me.last_name,
        about: me.about ?? "",
        gender: me.gender ?? "",
        birthday: me.birthday ?? "",
        website: me.website ?? "",
        location: me.location ?? "",
      });
    }).catch(() => { /* non-critical: failure is silent */ });
  }, [reset]);

  const watchGender = watch("gender");

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const updated = await usersApi.updateMe(data);
      setProfile(updated);
      if (user) {
        setUser({ 
           ...user, 
           first_name: updated.first_name, 
           last_name: updated.last_name, 
           name: `${updated.first_name} ${updated.last_name}`.trim() 
        });
      }
      toast.success(tp("profileUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      
      <Card>
        <CardHeader><CardTitle>{tp("editProfile")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{ta("firstName")}</Label>
                <Input {...register("first_name", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>{ta("lastName")}</Label>
                <Input {...register("last_name", { required: true })} />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label>{tp("about")}</Label>
              <Textarea {...register("about")} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{tp("gender")}</Label>
                <Select value={watchGender ?? ""} onValueChange={(v) => setValue("gender", v)}>
                  <SelectTrigger><SelectValue placeholder={te("gender.select")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{te("gender.male")}</SelectItem>
                    <SelectItem value="female">{te("gender.female")}</SelectItem>
                    <SelectItem value="other">{te("gender.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{tp("birthday")}</Label>
                <Input type="date" {...register("birthday")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{tp("location")}</Label>
              <Input {...register("location")} placeholder={te("locationPlaceholder")} />
            </div>

            <div className="space-y-1">
              <Label>{tp("website")}</Label>
              <Input {...register("website")} type="url" placeholder="https://example.com" />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? tc("loading") : tc("save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Export data */}
      <Card>
        <CardHeader><CardTitle className="text-base">{te("exportData")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {te("exportDesc")}
          </p>
          <Separator />
          <Button
            variant="outline"
            className="gap-2"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const res = await usersApi.downloadMyInfo();
                if (res.download_url) {
                  window.open(res.download_url, "_blank");
                } else {
                  toast.success(te("exportPrepared"));
                }
              } catch {
                toast.error(te("exportFailed"));
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download className="h-4 w-4" />
            {exporting ? te("requesting") : te("downloadMyData")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
