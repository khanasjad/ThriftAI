# ThriftAI API Configuration Guide

## 🚨 CRITICAL: API Keys Required for Full Functionality

The ThriftAI system requires two API configurations to function at full capacity:

### 1. OpenAI API Key (Backend AI Analysis)
**Required for**: Claude AI product analysis, intelligent search recommendations

**Setup Steps:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new secret key (starts with `sk-`)
3. Set environment variable:
   ```bash
   export OPENAI_API_KEY="sk-your-real-openai-key-here"
   ```
4. Restart Spring Boot backend:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8084" -Dmaven.test.skip=true
   ```

**Current Status**: ❌ **MISSING** - Getting 401 Unauthorized errors

### 2. Firebase Configuration (Frontend Authentication)
**Required for**: Google OAuth authentication, user profile management

**Setup Steps:**
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Google Authentication in Firebase Auth
3. Copy configuration values to `.env` file:
   ```bash
   cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai-frontend
   cp .env.example .env
   # Edit .env with your real Firebase values
   ```
4. Restart React development server:
   ```bash
   PORT=3001 npm start
   ```

**Current Status**: ⚠️ **DEMO MODE** - Using placeholder credentials

## Quick Fix Commands

```bash
# 1. Set OpenAI API Key (IMMEDIATE)
export OPENAI_API_KEY="your-key-here"

# 2. Create Firebase .env (IMMEDIATE)
cd /Users/asjadkhan/IdeaProjects/ProjectAI/thriftai-frontend
cp .env.example .env
# Edit .env file with real Firebase credentials

# 3. Restart services (IMMEDIATE)
# Backend: Ctrl+C then restart Spring Boot
# Frontend: Ctrl+C then PORT=3001 npm start
```

## Without API Keys

- **OpenAI Missing**: AI analysis uses intelligent fallback responses
- **Firebase Demo**: Google Auth won't work with real accounts
- **Core Functionality**: Search, UI, and basic features still work

## Testing Your Setup

1. **OpenAI API**: Search for products - should see "AI comparison completed successfully" in backend logs
2. **Firebase Auth**: Click "Sign in with Google" - should open real Google OAuth popup