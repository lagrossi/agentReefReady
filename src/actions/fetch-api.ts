// src/actions/fetch-api.ts
import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { ApiService } from '../services/api-service';

export const fetchApiAction: Action = {
  name: 'FETCH_API_DATA',
  similes: [
    'GET_WEATHER', 'CHECK_WEATHER', 'WEATHER_INFO',
    'GET_CRYPTO', 'CHECK_CRYPTO', 'CRYPTO_PRICE',
    'GET_NEWS', 'LATEST_NEWS', 'NEWS_UPDATE',
    'FETCH_DATA', 'GET_INFO', 'API_CALL'
  ],
  description: 'Fetches data from various APIs based on user requests',

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    
    // Check for weather requests
    if (text.includes('weather') && (
      text.includes('what') || text.includes('how') || 
      text.includes('get') || text.includes('check') ||
      text.includes('temperature') || text.includes('forecast')
    )) {
      return true;
    }

    // Check for crypto requests
    if ((text.includes('bitcoin') || text.includes('crypto') || text.includes('btc')) && (
      text.includes('price') || text.includes('value') || 
      text.includes('cost') || text.includes('worth')
    )) {
      return true;
    }

    // Check for news requests
    if (text.includes('news') && (
      text.includes('latest') || text.includes('recent') || 
      text.includes('today') || text.includes('current')
    )) {
      return true;
    }

    return false;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ) => {
    try {
      const service = runtime.getService<ApiService>('api-fetcher');
      if (!service) {
        throw new Error('API service not available');
      }

      const text = message.content.text.toLowerCase();
      let apiResponse: string;

      // Weather API
      if (text.includes('weather')) {
        await callback({
          text: "🔍 Let me check the current weather for you...",
          action: 'FETCH_API_DATA'
        });

        // Extract city if mentioned, default to London
        const cityMatch = text.match(/weather (?:in |for |at )?([a-zA-Z\s]+)/);
        const city = cityMatch ? cityMatch[1].trim() : 'London';

        const apiKey = runtime.getSetting('OPEN_WEATHER_API_KEY');
        
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        
        console.log("CHECKING THE WEAHTER - ", weatherUrl);
        
        try {
          // Fetch the weather data from the API
          const weatherData = await service.fetchApi(weatherUrl);
          console.log("WEATHER DATA - ", weatherData);
          apiResponse = service.formatWeatherData(weatherData);
        } catch (error) {
          apiResponse = `❌ Sorry, I couldn't get weather data for ${city}. ${error.message}`;
        }
      }
      
      // Cryptocurrency API
      else if (text.includes('bitcoin') || text.includes('crypto') || text.includes('btc')) {
        await callback({
          text: "🔍 Checking the latest Bitcoin price...",
          action: 'FETCH_API_DATA'
        });

        try {
          // Using CoinGecko API (free, no key required)
          const cryptoData = await service.fetchApi(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin'
          );
          
          apiResponse = service.formatCryptoData(cryptoData);
        } catch (error) {
          apiResponse = `❌ Sorry, I couldn't get cryptocurrency data. ${error.message}`;
        }
      }
      
      // News API
      else if (text.includes('news')) {
        await callback({
          text: "📰 Fetching the latest news for you...",
          action: 'FETCH_API_DATA'
        });

        try {
          // For demo, using mock news data
          const mockNewsData = {
            articles: [
              {
                title: "Tech Innovation Continues to Drive Markets",
                description: "Latest developments in AI and automation are reshaping industries worldwide.",
                source: { name: "Tech Daily" }
              },
              {
                title: "Climate Change Summit Reaches Key Agreements",
                description: "World leaders agree on new initiatives to combat climate change.",
                source: { name: "Global News" }
              }
            ]
          };
          
          apiResponse = service.formatNewsData(mockNewsData);
        } catch (error) {
          apiResponse = `❌ Sorry, I couldn't get news data. ${error.message}`;
        }
      }
      
      else {
        apiResponse = "🤔 I'm not sure what API data you're looking for. Try asking about weather, Bitcoin prices, or latest news!";
      }

      // Send the formatted response
      await callback({
        text: apiResponse,
        action: 'FETCH_API_DATA'
      });

      return true;
    } catch (error) {
      await callback({
        text: `❌ I encountered an error while fetching data: ${error.message}`,
        action: 'ERROR'
      });
      return false;
    }
  },

  examples: [
    [
      {
        name: 'User',
        content: { text: 'What\'s the weather like?' }
      },
      {
        name: 'HelloBot',
        content: { 
          text: '🔍 Let me check the current weather for you...',
          action: 'FETCH_API_DATA'
        }
      }
    ],
    [
      {
        name: 'User',
        content: { text: 'What\'s the Bitcoin price?' }
      },
      {
        name: 'HelloBot',
        content: { 
          text: '🔍 Checking the latest Bitcoin price...',
          action: 'FETCH_API_DATA'
        }
      }
    ],
    [
      {
        name: 'User',
        content: { text: 'Show me the latest news' }
      },
      {
        name: 'HelloBot',
        content: { 
          text: '📰 Fetching the latest news for you...',
          action: 'FETCH_API_DATA'
        }
      }
    ]
  ]
};