"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@jungle/api-client";
import type { UserCertification } from "@jungle/api-client";
import { Card, CardContent, Button, Input, Label, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2, Award, ExternalLink } from "lucide-react";

const certSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  issue_date: z.string().min(1, "Issue date is required"),
  expiry_date: z.string().optional(),
  credential_id: z.string().optional(),
  credential_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type CertForm = z.infer<typeof certSchema>;

export default function CertificationsPage() {
  const [certs, setCerts] = useState<UserCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CertForm>({
    resolver: zodResolver(certSchema),
  });

  useEffect(() => {
    usersApi.getCertifications()
      .then(setCerts)
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: CertForm) => {
    try {
      const created = await usersApi.addCertification(data);
      setCerts((prev) => [...prev, created]);
      reset();
      setShowForm(false);
      toast.success("Certification added");
    } catch {
      toast.error("Failed to add certification");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await usersApi.deleteCertification(id);
      setCerts((prev) => prev.filter((c) => c.id !== id));
      toast.success("Certification removed");
    } catch {
      toast.error("Failed to remove certification");
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Certifications</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Add Certification
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Certification Name *</Label>
                <Input {...register("name")} placeholder="e.g. AWS Solutions Architect" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Issuing Organization *</Label>
                <Input {...register("issuer")} placeholder="e.g. Amazon Web Services" />
                {errors.issuer && <p className="text-xs text-destructive">{errors.issuer.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Issue Date *</Label>
                  <Input type="month" {...register("issue_date")} />
                  {errors.issue_date && <p className="text-xs text-destructive">{errors.issue_date.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <Input type="month" {...register("expiry_date")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Credential ID</Label>
                <Input {...register("credential_id")} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label>Credential URL</Label>
                <Input type="url" {...register("credential_url")} placeholder="https://..." />
                {errors.credential_url && <p className="text-xs text-destructive">{errors.credential_url.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {certs.length === 0 && !showForm && (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No certifications added yet.</CardContent></Card>
      )}

      {certs.map((cert) => (
        <Card key={cert.id}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg shrink-0">
              <Award className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="font-semibold">{cert.name}</p>
              <p className="text-sm text-muted-foreground">{cert.issuer}</p>
              <p className="text-xs text-muted-foreground">
                Issued {cert.issue_date}{cert.expiry_date ? ` · Expires ${cert.expiry_date}` : ""}
              </p>
              {cert.credential_id && <p className="text-xs text-muted-foreground">ID: {cert.credential_id}</p>}
              {cert.credential_url && (
                <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-3 w-3" /> View Credential
                </a>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDelete(cert.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
