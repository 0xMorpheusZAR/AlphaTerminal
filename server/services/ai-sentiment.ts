import OpenAI from 'openai';
import { cacheConfig } from './cache-manager';

export interface SentimentAnalysis {
  score: number; // 0-100
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-1
  keywords: string[];
  summary: string;
}

export interface MarketSentiment {
  overall: SentimentAnalysis;
  sources: {
    twitter: SentimentAnalysis;
    reddit: SentimentAnalysis;
    news: SentimentAnalysis;
  };
  trendingTopics: Array<{
    topic: string;
    mentions: number;
    sentiment: number;
    emoji: string;
  }>;
}

export class AISentimentService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('[AI Sentiment] OpenAI initialized');
    } else {
      console.warn('⚠️  OpenAI API key not found. Using mock sentiment data.');
    }
  }

  async analyzeText(text: string, source: string = 'general'): Promise<SentimentAnalysis> {
    if (!this.openai) {
      return this.getMockSentiment();
    }

    const cacheKey = `sentiment:${source}:${this.hashText(text)}`;
    
    return cacheConfig.newsData.get(
      cacheKey,
      async () => {
        try {
          const response = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a cryptocurrency market sentiment analyzer. Analyze the given text and provide sentiment analysis in JSON format with:
                - score: 0-100 (0=extreme bearish, 50=neutral, 100=extreme bullish)
                - sentiment: "bullish", "bearish", or "neutral"
                - confidence: 0-1 (how confident you are)
                - keywords: array of important keywords
                - summary: one sentence summary`
              },
              {
                role: 'user',
                content: text
              }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          });

          const result = JSON.parse(response.choices[0].message.content || '{}');
          return {
            score: result.score || 50,
            sentiment: result.sentiment || 'neutral',
            confidence: result.confidence || 0.5,
            keywords: result.keywords || [],
            summary: result.summary || 'No summary available'
          };
        } catch (error) {
          console.error('[AI Sentiment] Analysis error:', error);
          return this.getMockSentiment();
        }
      },
      300 // 5 minute cache
    );
  }

  async analyzeMultipleSources(
    tweets: string[],
    redditPosts: string[],
    newsArticles: string[]
  ): Promise<MarketSentiment> {
    const [twitterSentiment, redditSentiment, newsSentiment] = await Promise.all([
      this.analyzeAggregatedText(tweets, 'twitter'),
      this.analyzeAggregatedText(redditPosts, 'reddit'),
      this.analyzeAggregatedText(newsArticles, 'news')
    ]);

    // Calculate overall sentiment
    const overallScore = (
      twitterSentiment.score * 0.3 +
      redditSentiment.score * 0.3 +
      newsSentiment.score * 0.4
    );

    const overall: SentimentAnalysis = {
      score: Math.round(overallScore),
      sentiment: overallScore > 60 ? 'bullish' : overallScore < 40 ? 'bearish' : 'neutral',
      confidence: (twitterSentiment.confidence + redditSentiment.confidence + newsSentiment.confidence) / 3,
      keywords: this.mergeKeywords([
        ...twitterSentiment.keywords,
        ...redditSentiment.keywords,
        ...newsSentiment.keywords
      ]),
      summary: 'Aggregated market sentiment from multiple sources'
    };

    return {
      overall,
      sources: {
        twitter: twitterSentiment,
        reddit: redditSentiment,
        news: newsSentiment
      },
      trendingTopics: await this.extractTrendingTopics([
        ...tweets,
        ...redditPosts,
        ...newsArticles
      ])
    };
  }

  private async analyzeAggregatedText(texts: string[], source: string): Promise<SentimentAnalysis> {
    if (texts.length === 0) {
      return this.getMockSentiment();
    }

    const aggregatedText = texts.slice(0, 10).join('\n'); // Limit to prevent token overflow
    return this.analyzeText(aggregatedText, source);
  }

  private async extractTrendingTopics(texts: string[]): Promise<Array<{
    topic: string;
    mentions: number;
    sentiment: number;
    emoji: string;
  }>> {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const keywords = new Map<string, number>();
    const topicEmojis: { [key: string]: string } = {
      'bitcoin': '₿',
      'btc': '₿',
      'ethereum': 'Ξ',
      'eth': 'Ξ',
      'defi': '🏦',
      'nft': '🎨',
      'bull': '🐂',
      'bear': '🐻',
      'moon': '🚀',
      'dump': '📉',
      'pump': '📈',
      'whale': '🐋',
      'hodl': '💎',
      'fomo': '😱',
      'dip': '🎢'
    };

    texts.forEach(text => {
      const words = text.toLowerCase().split(/\W+/);
      words.forEach(word => {
        if (word.length > 3 && !this.isStopWord(word)) {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      });
    });

    const topics = Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, mentions]) => ({
        topic: this.capitalizeFirst(topic),
        mentions,
        sentiment: this.getTopicSentiment(topic),
        emoji: topicEmojis[topic] || '📊'
      }));

    return topics;
  }

  private mergeKeywords(keywords: string[]): string[] {
    const unique = new Set(keywords);
    return Array.from(unique).slice(0, 10);
  }

  private hashText(text: string): string {
    // Simple hash for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'been'];
    return stopWords.includes(word);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getTopicSentiment(topic: string): number {
    const bullishTerms = ['moon', 'bull', 'pump', 'breakout', 'rally', 'hodl'];
    const bearishTerms = ['bear', 'dump', 'crash', 'dip', 'correction', 'sell'];
    
    if (bullishTerms.includes(topic)) return 75;
    if (bearishTerms.includes(topic)) return 25;
    return 50;
  }

  getMockSentiment(): SentimentAnalysis {
    return {
      score: 72,
      sentiment: 'bullish',
      confidence: 0.85,
      keywords: ['bitcoin', 'etf', 'institutional', 'adoption', 'bullish'],
      summary: 'Market sentiment is predominantly bullish with strong institutional interest'
    };
  }

  async getFearGreedIndex(): Promise<number> {
    // In production, integrate with Fear & Greed Index API
    // For now, calculate based on various factors
    const sentiment = await this.analyzeText('Current market conditions');
    const volatility = 68.5; // From risk metrics
    const momentum = sentiment.score;
    
    // Simple calculation
    const fearGreed = (momentum * 0.5) + ((100 - volatility) * 0.5);
    return Math.round(fearGreed);
  }
}

export const aiSentimentService = new AISentimentService();