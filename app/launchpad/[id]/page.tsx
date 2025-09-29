"use client";

import { useParams } from "next/navigation";
import { LaunchpadProjectDetail } from "@/components/launchpad-project-detail";

export default function LaunchpadProjectPage() {
  const params = useParams();
  const id = params.id as string;

  return <LaunchpadProjectDetail projectId={id} />;
}