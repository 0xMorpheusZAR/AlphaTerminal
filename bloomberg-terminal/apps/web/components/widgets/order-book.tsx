'use client';

import { useEffect, useState, useRef } from 'react';
import { useMarketStore } from '@/stores/market-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { formatPrice, formatVolume } from '@/lib/format';
import { ArrowUp, ArrowDown, Activity, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
  percentage: number;
}

interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercentage: number;
  midPrice: number;
  lastUpdate: number;
}

const DEPTH_LEVELS = [10, 25, 50, 100];

export function OrderBookWidget() {
  const { selectedSymbol, orderBooks } = useMarketStore();
  const [depth, setDepth] = useState(25);
  const [grouping, setGrouping] = useState(0.01);
  const [view, setView] = useState<'all' | 'bids' | 'asks'>('all');
  const [highlightThreshold, setHighlightThreshold] = useState(10000);

  const orderBook = orderBooks.get(selectedSymbol);

  // Process order book data
  const processedData: OrderBookData | null = orderBook ? {
    bids: orderBook.bids.slice(0, depth).map((bid, index) => {
      const total = orderBook.bids.slice(0, index + 1).reduce((sum, b) => sum + b[1], 0);
      const maxBidQuantity = Math.max(...orderBook.bids.map(b => b[1]));
      return {
        price: bid[0],
        quantity: bid[1],
        total,
        percentage: (bid[1] / maxBidQuantity) * 100,
      };
    }),
    asks: orderBook.asks.slice(0, depth).map((ask, index) => {
      const total = orderBook.asks.slice(0, index + 1).reduce((sum, a) => sum + a[1], 0);
      const maxAskQuantity = Math.max(...orderBook.asks.map(a => a[1]));
      return {
        price: ask[0],
        quantity: ask[1],
        total,
        percentage: (ask[1] / maxAskQuantity) * 100,
      };
    }),
    spread: orderBook.asks[0]?.[0] - orderBook.bids[0]?.[0] || 0,
    spreadPercentage: ((orderBook.asks[0]?.[0] - orderBook.bids[0]?.[0]) / orderBook.bids[0]?.[0]) * 100 || 0,
    midPrice: (orderBook.asks[0]?.[0] + orderBook.bids[0]?.[0]) / 2 || 0,
    lastUpdate: orderBook.timestamp,
  } : null;

  const OrderBookRow = ({ 
    entry, 
    type, 
    isLarge 
  }: { 
    entry: OrderBookEntry; 
    type: 'bid' | 'ask';
    isLarge: boolean;
  }) => {
    const [flash, setFlash] = useState(false);

    useEffect(() => {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(timer);
    }, [entry.quantity]);

    return (
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "group cursor-pointer transition-colors",
          "hover:bg-bloomberg-dark/50",
          flash && (type === 'bid' ? 'price-flash-green' : 'price-flash-red'),
          isLarge && "font-semibold"
        )}
      >
        <td className="py-1 px-2 text-right">
          <div className="relative">
            {/* Background bar */}
            <div
              className={cn(
                "absolute inset-0 opacity-20",
                type === 'bid' ? "bg-bloomberg-green" : "bg-bloomberg-red"
              )}
              style={{ width: `${entry.percentage}%` }}
            />
            <span className={cn(
              "relative font-mono text-xs",
              type === 'bid' ? "text-bloomberg-green" : "text-bloomberg-red"
            )}>
              {formatPrice(entry.price)}
            </span>
          </div>
        </td>
        <td className="py-1 px-2 text-right font-mono text-xs text-white">
          {formatVolume(entry.quantity)}
        </td>
        <td className="py-1 px-2 text-right font-mono text-xs text-bloomberg-gray">
          {formatVolume(entry.total)}
        </td>
      </motion.tr>
    );
  };

  return (
    <Card className="h-full bg-bloomberg-black border-bloomberg-border overflow-hidden flex flex-col">
      <CardHeader className="border-b border-bloomberg-border pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-bloomberg-amber text-sm font-semibold tracking-wider">
              ORDER BOOK
            </CardTitle>
            <Badge variant="outline" className="text-xs border-bloomberg-green text-bloomberg-green">
              LIVE
            </Badge>
          </div>
          <div className="text-xs text-bloomberg-gray">
            {selectedSymbol}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Spread indicator */}
        {processedData && (
          <div className="p-3 border-b border-bloomberg-border bg-bloomberg-dark/50">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-bloomberg-gray">SPREAD:</span>
                  <span className="text-white ml-2 font-mono">
                    {formatPrice(processedData.spread)}
                  </span>
                  <span className="text-bloomberg-amber ml-1">
                    ({processedData.spreadPercentage.toFixed(3)}%)
                  </span>
                </div>
                <div>
                  <span className="text-bloomberg-gray">MID:</span>
                  <span className="text-white ml-2 font-mono">
                    {formatPrice(processedData.midPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-3 border-b border-bloomberg-border">
          <div className="flex items-center justify-between gap-3">
            {/* View toggle */}
            <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-7 bg-bloomberg-dark">
                <TabsTrigger value="all" className="text-xs">ALL</TabsTrigger>
                <TabsTrigger value="bids" className="text-xs">BIDS</TabsTrigger>
                <TabsTrigger value="asks" className="text-xs">ASKS</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Depth selector */}
            <div className="flex gap-1">
              {DEPTH_LEVELS.map((level) => (
                <Button
                  key={level}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs",
                    depth === level
                      ? "bg-bloomberg-amber text-bloomberg-black"
                      : "text-bloomberg-gray hover:text-bloomberg-amber"
                  )}
                  onClick={() => setDepth(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Order book table */}
        <div className="flex-1 overflow-hidden">
          {processedData ? (
            <div className="h-full flex flex-col">
              {/* Asks table */}
              {(view === 'all' || view === 'asks') && (
                <div className={cn(
                  "overflow-y-auto",
                  view === 'all' ? "max-h-[50%]" : "h-full"
                )}>
                  <table className="w-full">
                    <thead className="sticky top-0 bg-bloomberg-black border-b border-bloomberg-border">
                      <tr className="text-xs text-bloomberg-gray">
                        <th className="py-2 px-2 text-right font-normal">PRICE</th>
                        <th className="py-2 px-2 text-right font-normal">SIZE</th>
                        <th className="py-2 px-2 text-right font-normal">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {[...processedData.asks].reverse().map((ask, index) => (
                          <OrderBookRow
                            key={`ask-${ask.price}`}
                            entry={ask}
                            type="ask"
                            isLarge={ask.quantity * ask.price > highlightThreshold}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mid price divider */}
              {view === 'all' && (
                <div className="py-2 px-3 bg-bloomberg-dark border-y border-bloomberg-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-bloomberg-gray">MID PRICE</span>
                    <span className="font-mono text-bloomberg-amber font-semibold">
                      {formatPrice(processedData.midPrice)}
                    </span>
                  </div>
                </div>
              )}

              {/* Bids table */}
              {(view === 'all' || view === 'bids') && (
                <div className={cn(
                  "overflow-y-auto",
                  view === 'all' ? "max-h-[50%]" : "h-full"
                )}>
                  <table className="w-full">
                    {view === 'bids' && (
                      <thead className="sticky top-0 bg-bloomberg-black border-b border-bloomberg-border">
                        <tr className="text-xs text-bloomberg-gray">
                          <th className="py-2 px-2 text-right font-normal">PRICE</th>
                          <th className="py-2 px-2 text-right font-normal">SIZE</th>
                          <th className="py-2 px-2 text-right font-normal">TOTAL</th>
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      <AnimatePresence>
                        {processedData.bids.map((bid, index) => (
                          <OrderBookRow
                            key={`bid-${bid.price}`}
                            entry={bid}
                            type="bid"
                            isLarge={bid.quantity * bid.price > highlightThreshold}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-bloomberg-gray text-sm">
                <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                Waiting for order book data...
              </div>
            </div>
          )}
        </div>

        {/* Footer stats */}
        {processedData && (
          <div className="p-3 border-t border-bloomberg-border bg-bloomberg-dark/50">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-bloomberg-gray">BID VOL:</span>
                <span className="text-bloomberg-green ml-2 font-mono">
                  {formatVolume(processedData.bids.reduce((sum, b) => sum + b.quantity, 0))}
                </span>
              </div>
              <div className="text-right">
                <span className="text-bloomberg-gray">ASK VOL:</span>
                <span className="text-bloomberg-red ml-2 font-mono">
                  {formatVolume(processedData.asks.reduce((sum, a) => sum + a.quantity, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}