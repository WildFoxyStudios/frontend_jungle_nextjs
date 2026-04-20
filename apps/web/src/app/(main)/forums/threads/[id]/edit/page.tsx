"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { contentApi } from "@jungle/api-client";
import type { ForumThread } from "@jungle/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Label,
  Skeleton,
} from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

interface Props { params: Promise<{ id: string }> }

export default function EditForumThreadPage({ params }: Props) {
  const { id } = use(params);
  const threadId = Number(id);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState<ForumThread | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    contentApi.getForumThread(threadId)
      .then((t) => {
        setThread(t);
        reset({ title: t.title, content: t.content });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load thread"))
      .finally(() => setLoading(false));
  }, [threadId, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await contentApi.updateForumThread(threadId, data);
      toast.success("Thread updated");
      router.push(`/forums/threads/${threadId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update thread");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-muted-foreground">
        Thread not found.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/forums/threads/${threadId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Edit Thread</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit your thread</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input {...register("title")} placeholder="Thread title" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Content *</Label>
              <Textarea {...register("content")} rows={8} placeholder="Thread content…" />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/forums/threads/${threadId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
