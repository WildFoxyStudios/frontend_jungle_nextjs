"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@jungle/ui";
import { StoryRing } from "@/components/stories/StoryRing";
import { StoryCreator } from "@/components/stories/StoryCreator";

export default function StoriesPage() {
 const t = useTranslations("stories_page");
 const [showCreator, setShowCreator] = useState(false);
 const [refreshKey, setRefreshKey] = useState(0);

 return (
 <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
 <div className="flex items-center justify-between gap-4">
 <h1 className="text-2xl font-bold">{t("title")}</h1>
 <Button onClick={() => setShowCreator(!showCreator)}>{t("addStory")}</Button>
 </div>
 <StoryRing
 refreshKey={refreshKey}
 onCreateClick={() => setShowCreator((value) => !value)}
 />
 {showCreator && (
 <Card>
 <CardHeader>
 <CardTitle>{t("createCardTitle")}</CardTitle>
 </CardHeader>
 <CardContent>
 <StoryCreator
 onSuccess={() => {
 setShowCreator(false);
 setRefreshKey((value) => value + 1);
 }}
 />
 </CardContent>
 </Card>
 )}
 </div>
 );
}
