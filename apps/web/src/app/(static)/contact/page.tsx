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
		<div className="mx-auto max-w-2xl px-4 py-12">
			<Card>
				<CardHeader>
					<CardTitle>Contact Us</CardTitle>
				</CardHeader>
				<CardContent>
					{sent ? (
						<div className="space-y-2 py-8 text-center">
							<p className="text-lg font-semibold">Message sent!</p>
							<p className="text-[15px] font-semibold text-muted-foreground">
								We&apos;ll get back to you within 24–48 hours.
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="space-y-1">
									<Label htmlFor="contact-name">Name</Label>
									<Input id="contact-name" {...register("name")} />
									{errors.name && (
										<p className="text-[13px] font-medium text-destructive">{errors.name.message}</p>
									)}
								</div>
								<div className="space-y-1">
									<Label htmlFor="contact-email">Email</Label>
									<Input id="contact-email" type="email" {...register("email")} />
									{errors.email && (
										<p className="text-[13px] font-medium text-destructive">{errors.email.message}</p>
									)}
								</div>
							</div>
							<div className="space-y-1">
								<Label htmlFor="contact-subject">Subject</Label>
								<Input id="contact-subject" {...register("subject")} />
								{errors.subject && (
									<p className="text-[13px] font-medium text-destructive">{errors.subject.message}</p>
								)}
							</div>
							<div className="space-y-1">
								<Label htmlFor="contact-message">Message</Label>
								<Textarea id="contact-message" {...register("message")} rows={5} />
								{errors.message && (
									<p className="text-[13px] font-medium text-destructive">{errors.message.message}</p>
								)}
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
