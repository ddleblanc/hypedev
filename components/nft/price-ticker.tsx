"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceTickerProps {
  basePrice: number;
  onChange?: (price: number, change: number) => void;
}

export function PriceTicker({ basePrice, onChange }: PriceTickerProps) {
  const [currentPrice, setCurrentPrice] = useState(basePrice);
  const [priceChange, setPriceChange] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate realistic price fluctuation (±0.5%)
      const fluctuation = (Math.random() - 0.5) * 0.01 * basePrice;
      const newPrice = Math.max(0.001, basePrice + fluctuation);
      const change = ((newPrice - currentPrice) / currentPrice) * 100;
      
      setCurrentPrice(newPrice);
      setPriceChange(change);
      setIsAnimating(true);
      
      onChange?.(newPrice, change);
      
      setTimeout(() => setIsAnimating(false), 300);
    }, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, [basePrice, currentPrice, onChange]);

  return (
    <div className="flex items-center gap-2">
      <div className={`transition-all duration-300 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
        <span className="text-2xl font-bold">
          {currentPrice.toFixed(4)} ETH
        </span>
      </div>
      {Math.abs(priceChange) > 0.001 && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
          priceChange > 0 
            ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' 
            : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
        } ${isAnimating ? 'scale-110' : 'scale-100'}`}>
          {priceChange > 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {Math.abs(priceChange).toFixed(2)}%
        </div>
      )}
    </div>
  );
}