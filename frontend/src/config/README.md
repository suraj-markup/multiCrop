# API Configuration

This directory contains configuration files for managing API URLs and environment settings.

## Files

- `api.js` - Main API configuration with URL builders
- `environment.js` - Environment-specific configurations

## Usage

### Basic Usage

```javascript
import { getQuestionsUrl, getQuestionByIdUrl } from '../config/api';

// Get questions for a specific file
const questionsUrl = getQuestionsUrl('filename.jpg');

// Get URL for updating a specific question
const updateUrl = getQuestionByIdUrl('question-id-123');
```

### Environment Configuration

The system automatically detects the environment and uses the appropriate API URL:

- **Development**: `http://localhost:8000/api`
- **Staging**: `https://staging-question-banks.netlify.app/api`
- **Production**: `https://question-banks.netlify.app/api`

### Setting Environment

You can control the environment using the `VITE_APP_ENV` environment variable:

```bash
# For development
VITE_APP_ENV=development npm run dev

# For staging
VITE_APP_ENV=staging npm run build

# For production (default)
npm run build
```

### Adding New Endpoints

To add a new API endpoint:

1. Add it to the `ENDPOINTS` object in `api.js`:
```javascript
export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.API_BASE_URL,
  ENDPOINTS: {
    QUESTIONS: '/questions',
    USERS: '/users', // New endpoint
  }
};
```

2. Create a URL builder function:
```javascript
export const getUsersUrl = () => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}`;
};
```

## Benefits

- ✅ Centralized URL management
- ✅ Environment-specific configurations
- ✅ Easy to change API URLs
- ✅ Type-safe URL building
- ✅ Consistent parameter handling 