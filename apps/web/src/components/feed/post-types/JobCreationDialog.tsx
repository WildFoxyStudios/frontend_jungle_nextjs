"use client";

import { useState } from "react";
import { Button, Input, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { postsApi } from "@jungle/api-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface JobCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function JobCreationDialog({ open, onOpenChange, onSuccess }: JobCreationDialogProps) {
  const t = useTranslations("jobs");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    salary_min: 0,
    salary_max: 0,
    salary_period: "monthly",
    job_type: "full_time",
    currency: "USD",
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.location) {
      toast.error("Please fill in title and location");
      return;
    }
    setLoading(true);
    try {
      await postsApi.createJob(formData);
      toast.success("Job post created successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create job post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid gap-2">
            <Label htmlFor="title">{t("jobTitle")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t("titlePlaceholder")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">{t("location")}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t("locationPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t("minSalary")}</Label>
              <Input
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("maxSalary")}</Label>
              <Input
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t("period")}</Label>
              <Select value={formData.salary_period} onValueChange={(v) => setFormData({ ...formData, salary_period: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">{t("hourly")}</SelectItem>
                  <SelectItem value="daily">{t("daily")}</SelectItem>
                  <SelectItem value="weekly">{t("weekly")}</SelectItem>
                  <SelectItem value="monthly">{t("monthly")}</SelectItem>
                  <SelectItem value="yearly">{t("yearly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("type")}</Label>
              <Select value={formData.job_type} onValueChange={(v) => setFormData({ ...formData, job_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">{t("fullTime")}</SelectItem>
                  <SelectItem value="part_time">{t("partTime")}</SelectItem>
                  <SelectItem value="internship">{t("internship")}</SelectItem>
                  <SelectItem value="volunteer">{t("volunteer")}</SelectItem>
                  <SelectItem value="contract">{t("contract")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? tc("saving") : tc("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
