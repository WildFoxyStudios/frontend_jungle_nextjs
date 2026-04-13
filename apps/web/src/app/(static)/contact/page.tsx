"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@jungle/api-client";
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from "@jungle/ui";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    try {
      await api.post("/v1/contact", data);
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card>
        <CardHeader><CardTitle>Contact Us</CardTitle></CardHeader>
        <CardContent>
          {sent ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-lg font-semibold">Message sent!</p>
              <p className="text-muted-foreground text-sm">We&apos;ll get back to you within 24–48 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input {...register("subject")} />
                {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Message</Label>
                <Textarea {...register("message")} rows={5} />
                {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
