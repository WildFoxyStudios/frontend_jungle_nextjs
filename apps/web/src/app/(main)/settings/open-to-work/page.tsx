"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea, Skeleton, Separator, Badge } from "@jungle/ui";
import { BriefcaseBusiness, Wrench, X, Plus } from "lucide-react";
import { toast } from "sonner";

export default function OpenToWorkPage() {
  const [loading, setLoading] = useState(true);
  const [openToWork, setOpenToWork] = useState<{ title: string; skills: string[] } | null>(null);
  const [providingService, setProvidingService] = useState<{ title: string; description: string } | null>(null);

  const [otwTitle, setOtwTitle] = useState("");
  const [otwSkills, setOtwSkills] = useState<string[]>([]);
  const [otwSkillInput, setOtwSkillInput] = useState("");

  const [psTitle, setPsTitle] = useState("");
  const [psDesc, setPsDesc] = useState("");

  const [savingOtw, setSavingOtw] = useState(false);
  const [savingPs, setSavingPs] = useState(false);

  useEffect(() => {
    usersApi.getMe()
      .then((u) => {
        const otw = (u as { open_to_work?: { title: string; skills: string[] } | null }).open_to_work;
        const ps = (u as { providing_service?: { title: string; description: string } | null }).providing_service;
        if (otw) {
          setOpenToWork(otw);
          setOtwTitle(otw.title);
          setOtwSkills(otw.skills ?? []);
        }
        if (ps) {
          setProvidingService(ps);
          setPsTitle(ps.title);
          setPsDesc(ps.description);
        }
      })
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const addSkill = () => {
    const s = otwSkillInput.trim();
    if (s && !otwSkills.includes(s)) setOtwSkills((prev) => [...prev, s]);
    setOtwSkillInput("");
  };

  const handleSaveOtw = async () => {
    if (!otwTitle.trim()) { toast.error("Title is required"); return; }
    setSavingOtw(true);
    try {
      await usersApi.setOpenToWork({ title: otwTitle, skills: otwSkills });
      setOpenToWork({ title: otwTitle, skills: otwSkills });
      toast.success("Open to Work status saved");
    } catch { toast.error("Failed to save"); }
    finally { setSavingOtw(false); }
  };

  const handleRemoveOtw = async () => {
    setSavingOtw(true);
    try {
      await usersApi.unsetOpenToWork();
      setOpenToWork(null);
      setOtwTitle(""); setOtwSkills([]);
      toast.success("Open to Work removed");
    } catch { toast.error("Failed to remove"); }
    finally { setSavingOtw(false); }
  };

  const handleSavePs = async () => {
    if (!psTitle.trim()) { toast.error("Title is required"); return; }
    setSavingPs(true);
    try {
      await usersApi.setProvidingService({ title: psTitle, description: psDesc });
      setProvidingService({ title: psTitle, description: psDesc });
      toast.success("Providing Service status saved");
    } catch { toast.error("Failed to save"); }
    finally { setSavingPs(false); }
  };

  const handleRemovePs = async () => {
    setSavingPs(true);
    try {
      await usersApi.unsetProvidingService();
      setProvidingService(null);
      setPsTitle(""); setPsDesc("");
      toast.success("Providing Service removed");
    } catch { toast.error("Failed to remove"); }
    finally { setSavingPs(false); }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      {/* Open to Work */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-green-600" /> Open to Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {openToWork && (
            <div className="flex items-start justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div>
                <p className="font-medium text-sm text-green-800 dark:text-green-200">{openToWork.title}</p>
                {openToWork.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {openToWork.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemoveOtw} disabled={savingOtw}>
                Remove
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Job Title / Role *</Label>
              <Input value={otwTitle} onChange={(e) => setOtwTitle(e.target.value)} placeholder="e.g. Frontend Developer, Product Manager" />
            </div>
            <div className="space-y-1.5">
              <Label>Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={otwSkillInput}
                  onChange={(e) => setOtwSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="Add a skill and press Enter"
                />
                <Button type="button" variant="outline" size="icon" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
              </div>
              {otwSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {otwSkills.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1">
                      {s}
                      <button onClick={() => setOtwSkills((prev) => prev.filter((x) => x !== s))}><X className="h-2.5 w-2.5" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSaveOtw} disabled={savingOtw || !otwTitle.trim()} className="w-full">
              {savingOtw ? "Saving…" : openToWork ? "Update Open to Work" : "Enable Open to Work"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Providing Service */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" /> Providing a Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {providingService && (
            <div className="flex items-start justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div>
                <p className="font-medium text-sm text-blue-800 dark:text-blue-200">{providingService.title}</p>
                {providingService.description && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{providingService.description}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemovePs} disabled={savingPs}>
                Remove
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Service Title *</Label>
              <Input value={psTitle} onChange={(e) => setPsTitle(e.target.value)} placeholder="e.g. Web Design, Consulting, Tutoring" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={psDesc}
                onChange={(e) => setPsDesc(e.target.value)}
                placeholder="Briefly describe the service you offer…"
                rows={3}
              />
            </div>
            <Button onClick={handleSavePs} disabled={savingPs || !psTitle.trim()} className="w-full">
              {savingPs ? "Saving…" : providingService ? "Update Service" : "Enable Providing Service"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
