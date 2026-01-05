"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { sepolia, ethereum } from "thirdweb/chains";
import type { ComponentProps } from "react";
import { AUTH_LOGIN_EVENT } from "@/contexts/auth-context";

type ConnectButtonProps = ComponentProps<typeof ConnectButton>;

interface AuthenticatedConnectButtonProps extends Omit<ConnectButtonProps, "client" | "auth"> {
  className?: string;
}

// Supported chains for the app
const supportedChains = [sepolia, ethereum];

/**
 * ConnectButton with SIWE authentication
 * Wraps Thirdweb's ConnectButton with our auth flow
 */
export function AuthenticatedConnectButton({
  className,
  theme = "dark",
  ...props
}: AuthenticatedConnectButtonProps) {
  return (
    <div className={className}>
      <ConnectButton
        client={client}
        theme={theme}
        chain={sepolia}
        chains={supportedChains}
        {...props}
        auth={{
          // Get login payload from our server
          getLoginPayload: async ({ address }) => {
            const res = await fetch(`/api/auth/login?address=${address}`);
            const data = await res.json();
            if (!data.success) {
              throw new Error(data.error?.message || "Failed to get login payload");
            }
            // Response format: { success: true, data: { payload: {...} } }
            return data.data.payload;
          },

          // Send signed payload to server for verification
          doLogin: async ({ payload, signature }) => {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payload, signature }),
            });
            const data = await res.json();
            if (!data.success) {
              throw new Error(data.error?.message || "Failed to login");
            }
            // Notify auth context with user data for immediate update
            window.dispatchEvent(new CustomEvent(AUTH_LOGIN_EVENT, {
              detail: { user: data.data.user }
            }));
          },

          // Check if user is logged in (must verify JWT matches connected wallet)
          isLoggedIn: async (address) => {
            try {
              // Include address as query param for mismatch detection
              const res = await fetch(`/api/auth/verify?address=${address}`);
              const data = await res.json();

              // Check if JWT is valid
              if (!data.success || !data.data?.loggedIn) {
                return false;
              }

              // CRITICAL: Verify JWT belongs to THIS wallet
              const jwtAddress = data.data.user?.walletAddress?.toLowerCase();
              const connectedAddress = address.toLowerCase();

              if (jwtAddress !== connectedAddress) {
                // JWT exists but for different wallet - clear it
                await fetch("/api/auth/logout", { method: "POST" });
                return false;
              }

              return true;
            } catch {
              return false;
            }
          },

          // Logout
          doLogout: async () => {
            await fetch("/api/auth/logout", { method: "POST" });
          },
        }}
      />
    </div>
  );
}
