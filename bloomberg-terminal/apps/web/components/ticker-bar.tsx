'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketStore } from '@/stores/market-store';
import { cn } from '@/lib/utils';
import { formatPrice, formatPercent } from '@/lib/format';

interface TickerItem {
  symbol: string;
  price: number;
  change24h: number;
  previousPrice?: number;
}

export function TickerBar() {
  const { topAssets, subscribeToTicker } = useMarketStore();
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    // Subscribe to real-time ticker updates
    const unsubscribe = subscribeToTicker((data) => {
      setTickerItems(data);
    });

    return unsubscribe;
  }, [subscribeToTicker]);

  return (
    <div className="h-full flex items-center bg-bloomberg-darker overflow-hidden">
      {/* Bloomberg Logo/Time */}
      <div className="flex-shrink-0 px-6 flex items-center gap-4 border-r border-bloomberg-border">
        <span className="text-bloomberg-amber font-bold text-lg">ALPHA</span>
        <span className="text-bloomberg-gray text-sm">
          {new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })}
        </span>
      </div>

      {/* Scrolling Ticker */}
      <div className="flex-1 relative overflow-hidden">
        <motion.div
          className="flex items-center gap-8 absolute whitespace-nowrap"
          animate={{
            x: [0, -2000],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 60,
              ease: "linear",
            },
          }}
        >
          {/* Duplicate ticker items for seamless loop */}
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <TickerItem key={`${item.symbol}-${index}`} item={item} />
          ))}
        </motion.div>
      </div>

      {/* Market Status */}
      <div className="flex-shrink-0 px-6 flex items-center gap-2 border-l border-bloomberg-border">
        <div className="w-2 h-2 rounded-full bg-bloomberg-green animate-pulse" />
        <span className="text-bloomberg-gray text-sm">MARKET OPEN</span>
      </div>
    </div>
  );
}

function TickerItem({ item }: { item: TickerItem }) {
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);
  
  useEffect(() => {
    if (item.previousPrice && item.price !== item.previousPrice) {
      setFlash(item.price > item.previousPrice ? 'green' : 'red');
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    }
  }, [item.price, item.previousPrice]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-white font-semibold">{item.symbol}</span>
      <span 
        className={cn(
          "font-mono",
          flash === 'green' && "price-flash-green",
          flash === 'red' && "price-flash-red"
        )}
      >
        {formatPrice(item.price)}
      </span>
      <span 
        className={cn(
          "font-mono text-sm",
          item.change24h >= 0 ? "text-bloomberg-green" : "text-bloomberg-red"
        )}
      >
        {item.change24h >= 0 ? '+' : ''}{formatPercent(item.change24h)}
      </span>
    </div>
  );
}