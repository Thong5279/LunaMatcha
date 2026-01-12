import api from './api';

export const chatgptService = {
  analyze: (data, period, analyzeAll) => 
    api.post('/api/chatgpt/analyze', { data, period, analyzeAll }, {
      timeout: 180000, // 3 minutes timeout (180s) - ChatGPT API can take time with retries
    }),
};

