"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import type { ComponentProps } from "react";

type ConnectButtonProps = ComponentProps<typeof ConnectButton>;

interface AuthenticatedConnectButtonProps extends Omit<ConnectButtonProps, "client" | "auth"> {
  className?: string;
}

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
        {...props}
        auth={{
          // Get login payload from our server
          getLoginPayload: async ({ address }) => {
            const res = await fetch(`/api/auth/login?address=${address}`);
            const data = await res.json();
            if (!data.success) {
              throw new Error(data.error || "Failed to get login payload");
            }
            return data.payload;
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
              throw new Error(data.error || "Failed to login");
            }
            // The server sets an httpOnly cookie, so we're done
          },

          // Check if user is logged in
          isLoggedIn: async () => {
            const res = await fetch("/api/auth/verify");
            const data = await res.json();
            return data.success && data.loggedIn;
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
