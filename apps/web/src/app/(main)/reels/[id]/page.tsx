import { notFound } from "next/navigation";
import ReelDeepLinkClient from "./ReelDeepLinkClient";

type Props = { params: Promise<{ id: string }> };

export default async function ReelByIdPage({ params }: Props) {
 const { id } = await params;
 const n = Number(id);
 if (!Number.isFinite(n) || n <= 0) notFound();
 return <ReelDeepLinkClient firstId={n} />;
}
