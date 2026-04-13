import type { Metadata } from "next";
import { productsApi } from "@jungle/api-client";
import { buildProductMetadata, productJsonLd, BASE_URL } from "@/lib/seo";
import { ProductDetailClient } from "./ProductDetailClient";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await productsApi.getProduct(Number(id));
    return buildProductMetadata(product);
  } catch {
    return { title: "Product | Jungle" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  let jsonLd = null;
  try {
    const product = await productsApi.getProduct(Number(id));
    jsonLd = productJsonLd({ ...product, url: `${BASE_URL}/marketplace/${id}` });
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient productId={Number(id)} />
    </>
  );
}
