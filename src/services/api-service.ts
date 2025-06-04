// src/services/api-service.ts
import { Service, IAgentRuntime } from '@elizaos/core';

export class ApiService extends Service {
  static serviceType = 'api-fetcher';
  
  capabilityDescription = 'Fetches and formats data from various APIs';

  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(protected runtime: IAgentRuntime) {
    super();
  }

  static async start(runtime: IAgentRuntime): Promise<ApiService> {
    const service = new ApiService(runtime);
    return service;
  }

  async stop(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Fetch data from an API with caching
   */
  async fetchApi(url: string, options: RequestInit = {}): Promise<any> {
    const cacheKey = `${url}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📦 Using cached data for ${url}`);
      return cached.data;
    }

    try {
      console.log(`🌐 Fetching data from ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HelloBot/1.0',
          'Accept': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`❌ API fetch failed for ${url}:`, error);
      throw new Error(`Failed to fetch from ${url}: ${error.message}`);
    }
  }

  /**
   * Format weather data nicely
   */
  formatWeatherData(data: any): string {
    if (!data || !data.main) {
      return "Weather data is not available.";
    }

    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const description = data.weather?.[0]?.description || 'unknown';
    const location = data.name;

    return `🌤️ **Weather in ${location}**
🌡️ Temperature: ${temp}°C (feels like ${feelsLike}°C)
💧 Humidity: ${humidity}%
☁️ Conditions: ${description.charAt(0).toUpperCase() + description.slice(1)}`;
  }

  /**
   * Format cryptocurrency data
   */
  formatCryptoData(data: any): string {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return "Cryptocurrency data is not available.";
    }

    const crypto = data[0]; // Assuming we get the first coin
    const price = parseFloat(crypto.current_price).toFixed(2);
    const change = parseFloat(crypto.price_change_percentage_24h).toFixed(2);
    const changeIcon = parseFloat(change) >= 0 ? '📈' : '📉';

    return `₿ **${crypto.name} (${crypto.symbol.toUpperCase()})**
💰 Price: $${price}
${changeIcon} 24h Change: ${change}%
📊 Market Cap: $${crypto.market_cap.toLocaleString()}`;
  }

  /**
   * Format general JSON data
   */
  formatJsonData(data: any, title: string = "API Data"): string {
    try {
      const formatted = JSON.stringify(data, null, 2);
      return `📋 **${title}**\n\`\`\`json\n${formatted}\n\`\`\``;
    } catch (error) {
      return `❌ Could not format data: ${error.message}`;
    }
  }

  /**
   * Format news data
   */
  formatNewsData(data: any): string {
    if (!data || !data.articles || !Array.isArray(data.articles)) {
      return "No news articles available.";
    }

    const articles = data.articles.slice(0, 3); // Show top 3 articles
    
    return `📰 **Latest News**\n\n` + 
      articles.map((article: any, index: number) =>
        `**${index + 1}. ${article.title}**\n` +
        `${article.description || 'No description available'}\n` +
        `🔗 Source: ${article.source?.name || 'Unknown'}\n`
      ).join('\n');
  }
}

export const apiService = ApiService;