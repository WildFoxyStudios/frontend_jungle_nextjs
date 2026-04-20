import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventSettingsPage({ params }: Props) {
  const { id } = await params;
  redirect(`/events/${id}/settings/general`);
}
