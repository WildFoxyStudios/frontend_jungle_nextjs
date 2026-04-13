import type { Metadata } from "next";
import { usersApi } from "@jungle/api-client";
import { buildProfileMetadata, personJsonLd } from "@/lib/seo";
import { ProfileClient } from "./ProfileClient";

interface Props { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { username } = await params;
    const user = await usersApi.getUser(username);
    return buildProfileMetadata(user);
  } catch {
    return { title: "Profile | Jungle" };
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  let jsonLd = null;
  try {
    const user = await usersApi.getUser(username);
    jsonLd = personJsonLd(user);
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProfileClient username={username} />
    </>
  );
}
