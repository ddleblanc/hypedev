"use client";

import { useParams } from "next/navigation";
import { CollectionDetailPage } from "@/components/collection-detail-page";

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <CollectionDetailPage slug={slug} />;
}