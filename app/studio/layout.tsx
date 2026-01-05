import { StudioGuard } from "@/components/studio/studio-guard";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudioGuard>{children}</StudioGuard>;
}
