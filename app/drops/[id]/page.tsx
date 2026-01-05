"use client";

import { useParams } from "next/navigation";
import { DropsProjectDetail } from "@/components/drops-project-detail";

export default function DropsProjectPage() {
  const params = useParams();
  const id = params.id as string;

  return <DropsProjectDetail projectId={id} />;
}
