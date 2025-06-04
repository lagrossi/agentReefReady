// src/providers/api-data.ts
import type { Provider, IAgentRuntime, Memory, State } from '@elizaos/core';
import { ApiService } from '../services/api-service';

export const apiDataProvider: Provider = {
  name: 'API_DATA',
  description: 'Provides context about recently fetched API data',
  
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    const service = runtime.getService<ApiService>('api-fetcher');
    if (!service) {
      return { text: '', values: {} };
    }

    // Check recent memories for API-related conversations
    const recentApiMemories = await runtime.getMemories({
      tableName: 'messages',
      roomId: message.roomId,
      count: 5
    });

    const hasRecentApiActivity = recentApiMemories.some(memory => 
      memory.content.action === 'FETCH_API_DATA'
    );

    if (hasRecentApiActivity) {
      return {
        text: 'I recently fetched some API data in our conversation. I can get updated information if needed.',
        values: {
          hasRecentApiData: true,
          canFetchMore: true
        }
      };
    }

    return {
      text: 'I can fetch real-time data from various APIs like weather, cryptocurrency prices, and news.',
      values: {
        hasRecentApiData: false,
        availableApis: ['weather', 'crypto', 'news']
      }
    };
  }
};