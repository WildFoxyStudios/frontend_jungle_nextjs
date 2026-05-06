import type { Metadata } from "next";
import { JobClient } from "./JobClient";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	return {
		title: `Job #${id} | Jungle`,
		description: "View job details and apply on Jungle",
	};
}

export default async function JobDetailPage({ params }: Props) {
	const { id } = await params;
	return <JobClient id={id} />;
}
