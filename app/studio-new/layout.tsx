import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio | HPX',
  description: 'Create and manage your NFT collections',
};

export default function StudioNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
