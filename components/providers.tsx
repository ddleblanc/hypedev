"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { TransactionProvider } from "@/contexts/transaction-context";
import { AuthProvider } from "@/contexts/auth-context";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { ModalCleanupProvider } from "@/components/providers/modal-cleanup-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <TRPCProvider>
        <AuthProvider>
          <TransactionProvider>
            <ModalCleanupProvider>
              {children}
            </ModalCleanupProvider>
          </TransactionProvider>
        </AuthProvider>
      </TRPCProvider>
    </ThirdwebProvider>
  );
}