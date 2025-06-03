import { ENV_CONFIG } from './environment';

// API Configuration
export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.API_BASE_URL,
  ENDPOINTS: {
    QUESTIONS: '/questions',
  }
};

// Helper function to build full URLs
export const buildApiUrl = (endpoint, params = {}) => {
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
  
  // Add query parameters if provided
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  return url.toString();
};

// Specific API URL builders
export const getQuestionsUrl = (fileName) => {
  return buildApiUrl(API_CONFIG.ENDPOINTS.QUESTIONS, { file_name: fileName });
};

export const getQuestionByIdUrl = (questionId) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.QUESTIONS}/${questionId}`;
}; 