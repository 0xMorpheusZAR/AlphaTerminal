export interface MonteCarloParameters {
  currentPrice: number;
  volatility: number;
  driftRate: number;
  timeHorizon: number; // in years
  simulationRuns: number;
  fundamentalFactors?: {
    marketSentiment?: number;
    adoptionRate?: number;
    competitionFactor?: number;
    regulatoryRisk?: number;
  };
}

export interface MonteCarloResult {
  bearishPrice: number; // 15th percentile
  basePrice: number; // 50th percentile (median)
  bullishPrice: number; // 85th percentile
  mean: number;
  standardDeviation: number;
  confidence95Lower: number;
  confidence95Upper: number;
  probabilityDistribution: number[];
  priceTargets: {
    target: number;
    probability: number;
  }[];
}

export class MonteCarloService {
  constructor() {}

  // Generate random number from normal distribution using Box-Muller transform
  private generateNormalRandom(): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // Calculate historical volatility from price data
  calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0.5; // Default volatility

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const return_ = Math.log(prices[i] / prices[i-1]);
      returns.push(return_);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    // Annualize the volatility (assuming daily prices)
    return Math.sqrt(variance * 365);
  }

  // Estimate drift rate from historical data
  calculateDriftRate(prices: number[], timespan: number): number {
    if (prices.length < 2) return 0.05; // Default drift rate

    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    
    // Calculate annualized return
    return Math.log(endPrice / startPrice) / timespan;
  }

  // Apply fundamental factors to adjust drift and volatility
  private applyFundamentalFactors(
    drift: number, 
    volatility: number, 
    factors?: MonteCarloParameters['fundamentalFactors']
  ): { adjustedDrift: number; adjustedVolatility: number } {
    if (!factors) return { adjustedDrift: drift, adjustedVolatility: volatility };

    let driftAdjustment = 1;
    let volatilityAdjustment = 1;

    // Market sentiment adjustment
    if (factors.marketSentiment !== undefined) {
      // Range: -1 (very bearish) to 1 (very bullish)
      driftAdjustment *= (1 + factors.marketSentiment * 0.3);
    }

    // Adoption rate adjustment
    if (factors.adoptionRate !== undefined) {
      // Range: 0 (no adoption) to 1 (high adoption)
      driftAdjustment *= (1 + factors.adoptionRate * 0.5);
    }

    // Competition factor
    if (factors.competitionFactor !== undefined) {
      // Range: 0 (no competition) to 1 (high competition)
      driftAdjustment *= (1 - factors.competitionFactor * 0.2);
      volatilityAdjustment *= (1 + factors.competitionFactor * 0.3);
    }

    // Regulatory risk
    if (factors.regulatoryRisk !== undefined) {
      // Range: 0 (no risk) to 1 (high risk)
      driftAdjustment *= (1 - factors.regulatoryRisk * 0.4);
      volatilityAdjustment *= (1 + factors.regulatoryRisk * 0.5);
    }

    return {
      adjustedDrift: drift * driftAdjustment,
      adjustedVolatility: volatility * volatilityAdjustment
    };
  }

  // Run Monte Carlo simulation using Geometric Brownian Motion
  runSimulation(parameters: MonteCarloParameters): MonteCarloResult {
    const {
      currentPrice,
      volatility,
      driftRate,
      timeHorizon,
      simulationRuns,
      fundamentalFactors
    } = parameters;

    // Apply fundamental factors
    const { adjustedDrift, adjustedVolatility } = this.applyFundamentalFactors(
      driftRate,
      volatility,
      fundamentalFactors
    );

    const finalPrices: number[] = [];
    const dt = 1 / 365; // Daily time step
    const steps = Math.floor(timeHorizon * 365);

    for (let simulation = 0; simulation < simulationRuns; simulation++) {
      let price = currentPrice;

      for (let step = 0; step < steps; step++) {
        const randomShock = this.generateNormalRandom();
        const drift = adjustedDrift * dt;
        const diffusion = adjustedVolatility * Math.sqrt(dt) * randomShock;
        
        // Geometric Brownian Motion: dS = μS*dt + σS*dW
        price = price * Math.exp(drift + diffusion);
      }

      finalPrices.push(price);
    }

    // Sort prices for percentile calculations
    finalPrices.sort((a, b) => a - b);

    // Calculate statistics
    const mean = finalPrices.reduce((sum, price) => sum + price, 0) / simulationRuns;
    const variance = finalPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / simulationRuns;
    const standardDeviation = Math.sqrt(variance);

    // Calculate percentiles
    const bearishPrice = this.calculatePercentile(finalPrices, 15);
    const basePrice = this.calculatePercentile(finalPrices, 50);
    const bullishPrice = this.calculatePercentile(finalPrices, 85);
    const confidence95Lower = this.calculatePercentile(finalPrices, 2.5);
    const confidence95Upper = this.calculatePercentile(finalPrices, 97.5);

    // Generate probability distribution (histogram)
    const probabilityDistribution = this.generateHistogram(finalPrices, 50);

    // Calculate probability of reaching specific price targets
    const priceTargets = this.calculatePriceTargetProbabilities(finalPrices, currentPrice);

    return {
      bearishPrice,
      basePrice,
      bullishPrice,
      mean,
      standardDeviation,
      confidence95Lower,
      confidence95Upper,
      probabilityDistribution,
      priceTargets
    };
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    if (lower < 0) return sortedArray[0];

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private generateHistogram(data: number[], bins: number): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    const histogram = new Array(bins).fill(0);

    for (const value of data) {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    }

    // Normalize to probabilities
    return histogram.map(count => count / data.length);
  }

  private calculatePriceTargetProbabilities(prices: number[], currentPrice: number): { target: number; probability: number }[] {
    const targets = [
      currentPrice * 0.5,  // -50%
      currentPrice * 0.8,  // -20%
      currentPrice * 1.2,  // +20%
      currentPrice * 1.5,  // +50%
      currentPrice * 2.0,  // +100%
      currentPrice * 3.0,  // +200%
    ];

    return targets.map(target => ({
      target,
      probability: prices.filter(price => price >= target).length / prices.length
    }));
  }

  // Helper method to estimate parameters from CoinGecko data
  estimateParametersFromHistoricalData(historicalPrices: [number, number][]): Partial<MonteCarloParameters> {
    if (historicalPrices.length < 30) {
      // Not enough data, return defaults
      return {
        volatility: 0.8, // 80% annualized volatility (typical for crypto)
        driftRate: 0.1,  // 10% annual drift
      };
    }

    const prices = historicalPrices.map(([_, price]) => price);
    const timestamps = historicalPrices.map(([timestamp, _]) => timestamp);
    
    const timespan = (timestamps[timestamps.length - 1] - timestamps[0]) / (1000 * 60 * 60 * 24 * 365); // in years
    
    const volatility = this.calculateVolatility(prices);
    const driftRate = this.calculateDriftRate(prices, timespan);

    return {
      volatility: Math.max(0.1, Math.min(3.0, volatility)), // Clamp between 10% and 300%
      driftRate: Math.max(-1.0, Math.min(2.0, driftRate)),  // Clamp between -100% and 200%
    };
  }

  // Create simulation for a specific token with CoinGecko data
  async createTokenSimulation(
    tokenId: string,
    currentPrice: number,
    historicalData: [number, number][],
    timeHorizon: number = 1,
    simulationRuns: number = 10000,
    fundamentalFactors?: MonteCarloParameters['fundamentalFactors']
  ): Promise<MonteCarloResult> {
    const estimatedParams = this.estimateParametersFromHistoricalData(historicalData);

    const parameters: MonteCarloParameters = {
      currentPrice,
      volatility: estimatedParams.volatility || 0.8,
      driftRate: estimatedParams.driftRate || 0.1,
      timeHorizon,
      simulationRuns,
      fundamentalFactors
    };

    return this.runSimulation(parameters);
  }
}

export const monteCarloService = new MonteCarloService();
