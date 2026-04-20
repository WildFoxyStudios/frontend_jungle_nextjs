"use client";

import { useQuery } from "@tanstack/react-query";
import { contentApi } from "@jungle/api-client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@jungle/ui";
import {
  Copy,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AiWriterPage() {
  const { data: wordBalance, refetch: refetchWords } = useQuery({
    queryKey: ["ai", "balance", "words"],
    queryFn: () => contentApi.aiGetWordBalance(),
  });
  const { data: imageBalance, refetch: refetchImages } = useQuery({
    queryKey: ["ai", "balance", "images"],
    queryFn: () => contentApi.aiGetImageBalance(),
  });

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" /> AI Writer
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate posts, blog articles, or images with AI. Credits reset
            monthly based on your plan.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <BalanceCard
          title="Words"
          remaining={wordBalance?.remaining ?? 0}
          limit={wordBalance?.limit ?? 0}
          plan={wordBalance?.plan ?? "free"}
          resetAt={wordBalance?.reset_at}
        />
        <BalanceCard
          title="Images"
          remaining={imageBalance?.remaining ?? 0}
          limit={imageBalance?.limit ?? 0}
          plan={imageBalance?.plan ?? "free"}
          resetAt={imageBalance?.reset_at}
        />
      </div>

      <Tabs defaultValue="post">
        <TabsList className="w-full">
          <TabsTrigger value="post" className="flex-1">
            <Wand2 className="h-4 w-4 mr-1.5" /> Post
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex-1">
            <Wand2 className="h-4 w-4 mr-1.5" /> Blog
          </TabsTrigger>
          <TabsTrigger value="image" className="flex-1">
            <ImageIcon className="h-4 w-4 mr-1.5" /> Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="post" className="mt-4">
          <GeneratePostCard onDone={() => refetchWords()} />
        </TabsContent>
        <TabsContent value="blog" className="mt-4">
          <GenerateBlogCard onDone={() => refetchWords()} />
        </TabsContent>
        <TabsContent value="image" className="mt-4">
          <GenerateImageCard onDone={() => refetchImages()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BalanceCard({
  title,
  remaining,
  limit,
  plan,
  resetAt,
}: {
  title: string;
  remaining: number;
  limit: number;
  plan: string;
  resetAt?: string;
}) {
  const pct = limit > 0 ? (remaining / limit) * 100 : 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title} balance</CardTitle>
        <CardDescription>
          Plan: <span className="font-medium">{plan}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            <span className="font-bold text-2xl">{remaining.toLocaleString()}</span>
            <span className="text-muted-foreground"> / {limit.toLocaleString()}</span>
          </span>
          {resetAt && (
            <span className="text-xs text-muted-foreground self-end">
              Resets {new Date(resetAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <Progress value={pct} />
      </CardContent>
    </Card>
  );
}

function GeneratePostCard({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("casual");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error("Topic required");
    setLoading(true);
    setResult("");
    try {
      const res = await contentApi.aiGeneratePost({ topic, tone, maxTokens: 400 });
      setResult(res.content);
      toast.success(`Generated via ${res.provider}`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate a social post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="topic">Topic</Label>
          <Textarea
            id="topic"
            rows={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. A Monday motivation quote, the latest JavaScript framework, my new product launch…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
                <SelectItem value="inspirational">Inspirational</SelectItem>
                <SelectItem value="informative">Informative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </div>
        </div>
        {result && <ResultBlock text={result} />}
      </CardContent>
    </Card>
  );
}

function GenerateBlogCard({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("informative");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error("Topic required");
    setLoading(true);
    setResult(null);
    try {
      const res = await contentApi.aiGenerateBlog({
        topic,
        keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
        tone,
        length,
      });
      setResult({ title: res.title, content: res.content });
      toast.success(`Generated via ${res.provider}`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate a blog article</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="blog-topic">Topic</Label>
          <Input
            id="blog-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How to bake sourdough at home"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="keywords">Keywords (comma-separated, optional)</Label>
          <Input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="bread, starter, fermentation"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="informative">Informative</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="storytelling">Storytelling</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Length</Label>
            <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (~600w)</SelectItem>
                <SelectItem value="medium">Medium (~1200w)</SelectItem>
                <SelectItem value="long">Long (~2000w)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-2 pt-2 border-t">
            <h3 className="font-bold text-lg">{result.title}</h3>
            <ResultBlock text={result.content} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GenerateImageCard({ onDone }: { onDone: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(1);
  const [size, setSize] = useState("1024x1024");
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Prompt required");
    setLoading(true);
    setUrls([]);
    try {
      const res = await contentApi.aiGenerateImages({ prompt, n: count, size });
      setUrls(res.urls);
      toast.success(`Generated ${res.urls.length} image(s)`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="img-prompt">Describe the image</Label>
          <Textarea
            id="img-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cyberpunk cat with neon glasses, photorealistic…"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Count</Label>
            <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">Square (1024²)</SelectItem>
                <SelectItem value="1024x1792">Portrait</SelectItem>
                <SelectItem value="1792x1024">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </div>
        </div>
        {urls.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {urls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`AI generated ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResultBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-lg border bg-muted/30 p-4">
      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={handleCopy}
      >
        <Copy className="h-4 w-4 mr-1" />
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
