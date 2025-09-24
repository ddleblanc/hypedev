"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { TransactionProvider } from "@/contexts/transaction-context";
import { AuthProvider } from "@/contexts/auth-context";
import { BackgroundCarouselProvider } from "@/contexts/background-carousel-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <BackgroundCarouselProvider>
        <AuthProvider>
          <TransactionProvider>
            {children}
          </TransactionProvider>
        </AuthProvider>
      </BackgroundCarouselProvider>
    </ThirdwebProvider>
  );
}