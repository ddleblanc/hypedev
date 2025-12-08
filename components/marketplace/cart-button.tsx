"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShoppingCart } from "@/contexts/shopping-cart-context";
import { cn } from "@/lib/utils";

interface CartButtonProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  showLabel?: boolean;
}

export function CartButton({ className, variant = "ghost", showLabel = false }: CartButtonProps) {
  const { toggleCart, totalItems, state } = useShoppingCart();

  return (
    <Button
      variant={variant}
      size={showLabel ? "default" : "icon"}
      className={cn(
        "relative",
        totalItems > 0 && "text-[rgb(163,255,18)]",
        className
      )}
      onClick={toggleCart}
    >
      <ShoppingCart className={cn("w-5 h-5", showLabel && "mr-2")} />
      {showLabel && <span>Cart</span>}

      {totalItems > 0 && (
        <Badge
          className={cn(
            "absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs font-bold",
            "bg-[rgb(163,255,18)] text-black border-0",
            state.isProcessing && "animate-pulse"
          )}
        >
          {totalItems}
        </Badge>
      )}
    </Button>
  );
}
