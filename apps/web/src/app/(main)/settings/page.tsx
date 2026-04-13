"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import type { User } from "@jungle/api-client";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@jungle/hooks";
import {
  Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@jungle/ui";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type ProfileForm = Pick<User, "first_name" | "last_name" | "about" | "gender" | "birthday" | "website" | "location">;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("settings");
  const tp = useTranslations("profile");
  const ta = useTranslations("auth");
  const tc = useTranslations("common");
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProfileForm>();

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        about: user.about ?? "",
        gender: user.gender ?? "",
        birthday: user.birthday ?? "",
        website: user.website ?? "",
        location: user.location ?? "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const updated = await usersApi.updateMe(data);
      setUser(updated);
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
                <Select value={watch("gender") ?? ""} onValueChange={(v) => setValue("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
              <Input {...register("location")} placeholder="City, Country" />
            </div>
            <div className="space-y-1">
              <Label>{tp("website")}</Label>
              <Input {...register("website")} type="url" placeholder="https://example.com" />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? `${tc("loading")}` : tc("save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
