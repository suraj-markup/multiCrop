// Environment Configuration
const ENVIRONMENTS = {
  development: {
    API_BASE_URL: 'https://question-banks.netlify.app/api', // Local development
  },
  staging: {
    API_BASE_URL: 'https://question-banks.netlify.app/api', // Staging environment
  },
  production: {
    API_BASE_URL: 'https://question-banks.netlify.app/api', // Production environment
  }
};

// Get current environment (defaults to production if not set)
const getCurrentEnvironment = () => {
  // Check for Vite environment variable
  const viteEnv = import.meta.env.VITE_APP_ENV;
  if (viteEnv && ENVIRONMENTS[viteEnv]) {
    return viteEnv;
  }
  
  // Check for Node environment
  const nodeEnv = import.meta.env.MODE;
  if (nodeEnv === 'development') {
    return 'development';
  }
  
  // Default to production
  return 'production';
};

// Get configuration for current environment
export const getEnvironmentConfig = () => {
  const env = getCurrentEnvironment();
  return {
    environment: env,
    ...ENVIRONMENTS[env]
  };
};

// Export current environment config
export const ENV_CONFIG = getEnvironmentConfig(); 