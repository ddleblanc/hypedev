import { ReactNode } from "react";

export default function CollectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Collection routes are standalone and don't use the persistent background
  // or progressive UI. They render directly without any special wrappers.
  return <>{children}</>;
}