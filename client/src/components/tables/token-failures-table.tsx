import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Token } from "@/types";

interface TokenFailuresTableProps {
  tokens: Token[];
  isLoading?: boolean;
}

export default function TokenFailuresTable({ tokens, isLoading }: TokenFailuresTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-chart-line text-4xl text-muted-foreground mb-4"></i>
        <p className="text-muted-foreground">No failed tokens found</p>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTokens = tokens.slice(startIndex, endIndex);
  const totalPages = Math.ceil(tokens.length / itemsPerPage);

  const formatCurrency = (value: string | undefined) => {
    if (!value) return '$0';
    const num = parseFloat(value);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(4)}`;
  };

  const formatPercentage = (value: string | undefined) => {
    if (!value) return '0%';
    const num = parseFloat(value);
    return `${num.toFixed(2)}%`;
  };

  const getRiskBadge = (riskLevel: string | undefined) => {
    switch (riskLevel) {
      case 'EXTREME':
        return <Badge variant="destructive">EXTREME</Badge>;
      case 'VERY_HIGH':
        return <Badge variant="destructive">VERY HIGH</Badge>;
      case 'HIGH':
        return <Badge variant="secondary">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge variant="outline">MEDIUM</Badge>;
      case 'LOW':
        return <Badge variant="outline">LOW</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  const getChangeColor = (value: string | undefined) => {
    if (!value) return 'text-muted-foreground';
    const num = parseFloat(value);
    return num >= 0 ? 'text-success' : 'text-destructive';
  };

  const getTokenLogo = (symbol: string) => {
    // Generate a color based on the symbol for consistent colors
    const colors = [
      'from-purple-400 to-pink-400',
      'from-red-400 to-orange-400',
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-yellow-400 to-amber-400',
      'from-indigo-400 to-purple-400',
    ];
    const colorIndex = symbol.charCodeAt(0) % colors.length;
    return `bg-gradient-to-br ${colors[colorIndex]}`;
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">ATH</TableHead>
              <TableHead className="text-right">Decline</TableHead>
              <TableHead className="text-right">Market Cap</TableHead>
              <TableHead className="text-right">24h</TableHead>
              <TableHead className="text-center">Risk</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTokens.map((token) => (
              <TableRow key={token.id} className="hover:bg-muted/20 transition-colors">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full ${getTokenLogo(token.symbol)}`}></div>
                    <div>
                      <p className="font-medium">{token.name}</p>
                      <p className="text-sm text-muted-foreground">{token.symbol}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(token.currentPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatCurrency(token.allTimeHigh)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="destructive">
                    {formatPercentage(token.declineFromAth)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(token.marketCap)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`tabular-nums ${getChangeColor(token.priceChange24h)}`}>
                    {formatPercentage(token.priceChange24h)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {getRiskBadge(token.riskLevel)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`https://coingecko.com/en/coins/${token.coingeckoId}`, '_blank')}
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`https://www.blofin.com/en/futures/${token.symbol.toLowerCase()}usdt`, '_blank')}
                    >
                      <i className="fas fa-chart-line"></i>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{startIndex + 1}-{Math.min(endIndex, tokens.length)}</span> of{' '}
          <span className="font-medium">{tokens.length}</span> failed tokens
        </p>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          
          {totalPages > 5 && (
            <>
              <span className="text-muted-foreground">...</span>
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
