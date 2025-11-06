import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PersistentBackground } from "@/components/persistent-background";
import { AppNavigationProvider } from "@/contexts/app-navigation-context";
import { StudioProvider } from "@/contexts/studio-context";
import { BackgroundCarouselProvider } from "@/contexts/background-carousel-context";
import { P2PHeaderProvider } from "@/contexts/p2p-header-context";
import { P2PSelectionFlowProvider } from "@/contexts/p2p-selection-flow-context";
import { FloatingTransactionPill } from "@/components/transaction/floating-transaction-pill";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HYPERCHAINX - Ultimate Gaming NFT Marketplace",
  description: "Experience the future of gaming assets. Trade, collect, and dominate in the most advanced NFT ecosystem ever created.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <BackgroundCarouselProvider>
            <AppNavigationProvider>
              <StudioProvider>
                <P2PHeaderProvider>
                  <P2PSelectionFlowProvider>
                    <PersistentBackground>
                      <LayoutWrapper>
                        {children}
                      </LayoutWrapper>
                    </PersistentBackground>
                  </P2PSelectionFlowProvider>
                </P2PHeaderProvider>
              </StudioProvider>
            </AppNavigationProvider>
          </BackgroundCarouselProvider>
          <FloatingTransactionPill />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}