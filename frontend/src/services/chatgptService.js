import api from './api';

export const chatgptService = {
  analyze: (data, period, analyzeAll) => 
    api.post('/api/chatgpt/analyze', { data, period, analyzeAll }),
};

