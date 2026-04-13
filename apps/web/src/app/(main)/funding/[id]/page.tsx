import type { Metadata } from "next";
import { commerceApi } from "@jungle/api-client";
import { buildFundingMetadata } from "@/lib/seo";
import { FundingClient } from "./FundingClient";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const campaign = await commerceApi.getFundingCampaign(Number(id));
    return buildFundingMetadata(campaign);
  } catch {
    return { title: "Funding | Jungle" };
  }
}

export default async function FundingDetailPage({ params }: Props) {
  const { id } = await params;
  return <FundingClient id={id} />;
}
