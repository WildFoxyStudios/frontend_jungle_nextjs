"use client";

import { useState } from "react";
import { 
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, Label, Textarea, Separator, Checkbox
} from "@jungle/ui";
import { jobsApi } from "@jungle/api-client";
import type { Job } from "@jungle/api-client";
import { toast } from "sonner";
import { Briefcase, MapPin, Phone, Mail, User } from "lucide-react";

interface JobApplyModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JobApplyModal({ job, isOpen, onClose, onSuccess }: JobApplyModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Basic Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");

  // Experience
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().getFullYear().toString());
  const [endDate, setEndDate] = useState(new Date().getFullYear().toString());
  const [currentlyWork, setCurrentlyWork] = useState(false);

  // Custom Questions
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleApply = async () => {
    // Validation
    const missingRequired = job.questions.filter((q) => q.required && !answers[q.id]?.trim());
    if (missingRequired.length > 0) {
      toast.error("Please answer all required questions");
      return;
    }

    if (!name || !email) {
      toast.error("Name and Email are required");
      return;
    }

    setLoading(true);
    try {
      // Formulating a rich cover letter from the experience and contact info 
      // since the current API only supports answers and cover_letter
      const experienceSection = position ? `
EXPERIENCE:
Position: ${position} at ${company}
Period: ${startDate} - ${currentlyWork ? "Present" : endDate}
Description: ${expDescription}
` : "";

      const contactSection = `
CONTACT INFO:
Name: ${name}
Phone: ${phone}
Location: ${location}
Email: ${email}
`;

      const fullCoverLetter = `${contactSection}\n${experienceSection}`;

      await jobsApi.applyToJob(job.id, {
        answers: Object.entries(answers).map(([qId, answer]) => ({ question_id: Number(qId), answer })),
        cover_letter: fullCoverLetter,
      });

      toast.success("Application submitted successfully!");
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Apply for {job.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <User className="h-4 w-4" /> Personal Information
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="app-name">Full Name *</Label>
                <Input id="app-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-phone">Phone Number</Label>
                <Input id="app-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-location">Location</Label>
                <Input id="app-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-email">Email Address *</Label>
                <Input id="app-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Experience */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Briefcase className="h-4 w-4" /> Experience
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="app-pos">Position</Label>
                <Input id="app-pos" value={position} onChange={(e) => setPosition(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-company">Where did you work?</Label>
                <Input id="app-company" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app-exp-desc">Description</Label>
              <Textarea id="app-exp-desc" value={expDescription} onChange={(e) => setExpDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <select className="w-full bg-background border rounded-md h-9 px-3 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <select className="w-full bg-background border rounded-md h-9 px-3 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={currentlyWork}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2 pb-2">
                <Checkbox id="cur-work" checked={currentlyWork} onCheckedChange={(v) => setCurrentlyWork(!!v)} />
                <Label htmlFor="cur-work" className="text-xs">I currently work here</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Custom Questions */}
          {job.questions.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Requirements</div>
              {job.questions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <Label className="text-sm">
                    {q.question} {q.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    rows={2}
                    placeholder="Your answer…"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply} disabled={loading} className="gap-2">
            {loading ? "Submitting..." : "Send Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
