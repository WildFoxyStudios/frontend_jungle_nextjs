"use client";

import { useState } from "react";
import { Button, Input, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label } from "@jungle/ui";
import { postsApi } from "@jungle/api-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface FundingCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FundingCreationDialog({ open, onOpenChange, onSuccess }: FundingCreationDialogProps) {
  const t = useTranslations("funding");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal_amount: 0,
    image: "",
  });

  const handleSubmit = async () => {
    if (!formData.title || formData.goal_amount <= 0) {
      toast.error("Please fill in title and a valid goal amount");
      return;
    }
    setLoading(true);
    try {
      await postsApi.createFunding(formData);
      toast.success("Funding campaign created successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create funding campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">{t("name")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t("namePlaceholder")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">{t("amount")}</Label>
            <Input
              id="amount"
              type="number"
              value={formData.goal_amount}
              onChange={(e) => setFormData({ ...formData, goal_amount: Number(e.target.value) })}
              placeholder="0.00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("descriptionPlaceholder")}
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
