"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { productsApi } from "@jungle/api-client";
import {
	Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea,
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge,
} from "@jungle/ui";
import { useMediaUpload, useLookups } from "@jungle/hooks";
import { toast } from "sonner";
import { PlacesAutocomplete } from "@/components/shared/PlacesAutocomplete";
import { useTranslations } from "next-intl";
import { ImagePlus, X } from "lucide-react";

export default function CreateProductPage() {
	const router = useRouter();
	const fileRef = useRef<HTMLInputElement>(null);
	const { uploadImage, isUploading } = useMediaUpload();
	const { data: conditions } = useLookups("condition");
	const { data: currencies } = useLookups("currency");
	const [form, setForm] = useState({
		name: "", description: "", price: "", currency: "USD",
		category: "", location: "", condition: "",
	});
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

	const t = useTranslations("marketplace");

	useEffect(() => {
		productsApi.getCategories().then(setCategories).catch(() => {});
	}, []);

	const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

	const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const media = await uploadImage(file, "product");
		if (media) setImageUrls((prev) => [...prev, media.url]);
		e.target.value = "";
	};

	const removeImage = (index: number) => {
		setImageUrls((prev) => prev.filter((_, i) => i !== index));
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const price = parseFloat(form.price);
		if (!form.name.trim() || isNaN(price)) return;
		setIsLoading(true);
		try {
			const fd = new FormData();
			fd.append("name", form.name);
			fd.append("description", form.description);
			fd.append("price", String(price));
			fd.append("currency", form.currency);
			fd.append("category", form.category);
			if (form.location) fd.append("location", form.location);
			if (form.condition) fd.append("condition", form.condition);
			imageUrls.forEach((url) => fd.append("image_urls[]", url));
			const product = await productsApi.createProduct(fd);
			router.push("/marketplace/" + product.id);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="mx-auto max-w-2xl px-3 py-6 sm:px-4">
			<Card>
				<CardHeader>
					<CardTitle>Create Listing</CardTitle>
					<p className="text-sm text-muted-foreground">List your item on the marketplace</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="space-y-5">
						<div className="space-y-1.5">
							<Label>Title *</Label>
							<Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="What are you selling?" />
						</div>

						<div className="space-y-1.5">
							<Label>Description</Label>
							<Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} placeholder="Describe your item..." />
						</div>

						{/* Photos */}
						<div className="space-y-1.5">
							<Label>Photos</Label>
							<div className="flex flex-wrap gap-2">
								{imageUrls.map((url, i) => (
									<div key={url} className="relative h-20 w-20 rounded-lg border overflow-hidden">
										<img src={url} alt="" className="h-full w-full object-cover" />
										<button
											type="button"
											onClick={() => removeImage(i)}
											className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white hover:bg-black/80"
										>
											<X className="h-3 w-3" />
										</button>
									</div>
								))}
								<button
									type="button"
									onClick={() => fileRef.current?.click()}
									disabled={isUploading}
									className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
								>
									<ImagePlus className="h-5 w-5" />
									<span className="text-[9px] font-medium">Add</span>
								</button>
							</div>
							<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label>Price *</Label>
								<Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" />
							</div>
							<div className="space-y-1.5">
								<Label>Currency</Label>
								<Select value={form.currency} onValueChange={(v) => update("currency", v)}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										{["USD", "EUR", "GBP", "CAD", "AUD", "MXN"].map((c) => (
											<SelectItem key={c} value={c}>{c}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label>Category</Label>
							<Select value={form.category} onValueChange={(v) => update("category", v)}>
								<SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
								<SelectContent>
									{categories.map((c) => (
										<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label>{t("condition")}</Label>
							<Select value={form.condition} onValueChange={(v) => update("condition", v)}>
								<SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
								<SelectContent>
									<SelectItem value=" ">Not specified</SelectItem>
									{conditions.map((c) => (
										<SelectItem key={c.value} value={c.value}>{t(c.label_key)}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label>{t("location") ?? "Location"}</Label>
							<PlacesAutocomplete value={form.location} onChange={(v) => update("location", v)} />
						</div>

						<Button type="submit" disabled={isLoading || !form.name.trim() || !form.price} className="w-full" size="lg">
							{isLoading ? "Creating..." : "Create listing"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
