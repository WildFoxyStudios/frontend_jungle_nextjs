"use client";

import { use, useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import { Skeleton } from "@jungle/ui";

interface Props { params: Promise<{ username: string }> }

export default function CommonPage({ params }: Props) {
  const { username } = use(params);
  const [common, setCommon] = useState<{ friends: import("@jungle/api-client").PublicUser[]; groups: unknown[]; pages: unknown[] } | null>(null);

  useEffect(() => {
    usersApi.getCommonThings(username).then(setCommon).catch(() => {});
  }, [username]);

  if (!common) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Common with @{username}</h1>
      <p className="text-sm text-muted-foreground">{common.friends?.length ?? 0} mutual friends</p>
      <p className="text-sm text-muted-foreground">{common.groups?.length ?? 0} mutual groups</p>
      <p className="text-sm text-muted-foreground">{common.pages?.length ?? 0} mutual pages</p>
    </div>
  );
}
