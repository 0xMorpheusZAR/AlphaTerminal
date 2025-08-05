import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { MarketOverviewWidget } from '@/components/widgets/market-overview';
import { PriceChartWidget } from '@/components/widgets/price-chart';
import { OrderBookWidget } from '@/components/widgets/order-book';
import { TradeFeedWidget } from '@/components/widgets/trade-feed';
import { PortfolioWidget } from '@/components/widgets/portfolio';
import { NewsWidget } from '@/components/widgets/news';
import { HeatmapWidget } from '@/components/widgets/heatmap';
import { TopMoversWidget } from '@/components/widgets/top-movers';

export default function SpotTradingPage() {
  // Default layout configuration for Bloomberg-style grid
  const defaultLayout = [
    { i: 'market-overview', x: 0, y: 0, w: 4, h: 6 },
    { i: 'price-chart', x: 4, y: 0, w: 8, h: 12 },
    { i: 'order-book', x: 12, y: 0, w: 4, h: 8 },
    { i: 'trade-feed', x: 12, y: 8, w: 4, h: 8 },
    { i: 'portfolio', x: 0, y: 6, w: 4, h: 6 },
    { i: 'heatmap', x: 0, y: 12, w: 8, h: 8 },
    { i: 'news', x: 8, y: 12, w: 4, h: 8 },
    { i: 'top-movers', x: 12, y: 16, w: 4, h: 4 },
  ];

  const widgets = [
    { id: 'market-overview', component: <MarketOverviewWidget /> },
    { id: 'price-chart', component: <PriceChartWidget /> },
    { id: 'order-book', component: <OrderBookWidget /> },
    { id: 'trade-feed', component: <TradeFeedWidget /> },
    { id: 'portfolio', component: <PortfolioWidget /> },
    { id: 'heatmap', component: <HeatmapWidget /> },
    { id: 'news', component: <NewsWidget /> },
    { id: 'top-movers', component: <TopMoversWidget /> },
  ];

  return (
    <div className="min-h-screen bg-bloomberg-black p-4">
      <DashboardGrid
        widgets={widgets}
        defaultLayout={defaultLayout}
        className="bloomberg-grid"
      />
    </div>
  );
}