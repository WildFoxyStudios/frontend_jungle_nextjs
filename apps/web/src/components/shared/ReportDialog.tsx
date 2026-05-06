"use client";

import { useState } from "react";
import {
 Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
 Label, RadioGroup, RadioGroupItem, Textarea,
} from "@jungle/ui";
import { useLookups } from "@jungle/hooks";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ReportDialogProps {
 onReport: (reason: string, details?: string) => Promise<void>;
 children: React.ReactNode;
 title?: string;
}

export function ReportDialog({ onReport, children, title }: ReportDialogProps) {
 const [open, setOpen] = useState(false);
 const [reason, setReason] = useState("");
 const [details, setDetails] = useState("");
 const [loading, setLoading] = useState(false);
 const t = useTranslations("feed");
 const tc = useTranslations("common");
 const { data: reportReasons } = useLookups("report_reason");

 const handleSubmit = async () => {
 if (!reason) {
 toast.error(t("pleaseSelectReason"));
 return;
 }
 setLoading(true);
 try {
 await onReport(reason, details || undefined);
 toast.success(t("reportSubmitted"));
 setOpen(false);
 setReason("");
 setDetails("");
 } catch {
 toast.error(tc("error"));
 } finally {
 setLoading(false);
 }
 };

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>{children}</DialogTrigger>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Flag className="h-4 w-4" /> {title || t("report")}
 </DialogTitle>
 <DialogDescription>
 {t("reportDescription")}
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4">
 <RadioGroup value={reason} onValueChange={setReason}>
 {reportReasons.map((r) => (
 <div key={r.value} className="flex items-center space-x-2">
 <RadioGroupItem value={r.value} id={`report-${r.value}`} />
 <Label htmlFor={`report-${r.value}`} className="text-sm cursor-pointer">
 {t(r.label_key)}
 </Label>
 </div>
 ))}
 </RadioGroup>

 <div className="space-y-1">
 <Label className="text-xs text-muted-foreground">{t("additionalDetailsOptional")}</Label>
 <Textarea
 value={details}
 onChange={(e) => setDetails(e.target.value)}
 placeholder={t("describeIssue")}
 rows={3}
 className="resize-none text-sm"
 />
 </div>
 </div>

 <DialogFooter>
 <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>{tc("cancel")}</Button>
 <Button onClick={handleSubmit} disabled={loading || !reason} variant="destructive">
 {loading ? t("submitting") : t("submitReport")}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
