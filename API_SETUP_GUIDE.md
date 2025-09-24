# ThriftAI API Configuration Guide

## Overview
ThriftAI integrates with multiple AI and external APIs to provide enhanced search, recommendations, and marketplace features. This guide will walk you through setting up all the necessary API keys and configurations.

## Required API Keys

### 1. Claude API (Anthropic) - **ESSENTIAL**
**Used for:** AI-powered search, product recommendations, and chat functionality

#### Setup Steps:
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key (starts with `sk-ant-`)

#### Configuration:
```bash
export CLAUDE_API_KEY="sk-ant-your-api-key-here"
```

#### Features Enabled:
- ✅ Intelligent product search and filtering
- ✅ AI-powered chat responses from index page
- ✅ Smart product recommendations
- ✅ Enhanced search insights and analytics

### 2. OpenAI API - **RECOMMENDED**
**Used for:** Visual search, image analysis, and additional AI features

#### Setup Steps:
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and add billing information
3. Generate a new secret key
4. Copy the key (starts with `sk-`)

#### Configuration:
```bash
export OPENAI_API_KEY="sk-your-openai-key-here"
```

#### Features Enabled:
- ✅ Visual search by image upload
- ✅ Product image analysis
- ✅ Backup AI responses when Claude is unavailable

### 3. Marketplace APIs - **OPTIONAL**
**Used for:** Product discovery and price comparison

#### Amazon Product Advertising API
```bash
export AMAZON_API_KEY="your-amazon-api-key"
```

#### eBay API
```bash
export EBAY_API_KEY="your-ebay-api-key"
```

#### Other Marketplace APIs
```bash
export NIKE_API_KEY="your-nike-api-key"
export ADIDAS_API_KEY="your-adidas-api-key"
```

### 4. Location & Shipping APIs - **OPTIONAL**
**Used for:** Location services and shipping calculations

#### Google Maps API
```bash
export GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

#### Shipping Provider APIs
```bash
export FEDEX_API_KEY="your-fedex-key"
export UPS_API_KEY="your-ups-key"
export USPS_API_KEY="your-usps-key"
export DHL_API_KEY="your-dhl-key"
```

## Quick Setup Script

Create a `.env` file in your project root:

```bash
# Essential APIs
CLAUDE_API_KEY=sk-ant-your-claude-key-here
OPENAI_API_KEY=sk-your-openai-key-here

# Marketplace APIs (Optional)
AMAZON_API_KEY=your-amazon-key
EBAY_API_KEY=your-ebay-key
NIKE_API_KEY=your-nike-key
ADIDAS_API_KEY=your-adidas-key

# Location Services (Optional)
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Shipping Services (Optional)
FEDEX_API_KEY=your-fedex-key
UPS_API_KEY=your-ups-key
USPS_API_KEY=your-usps-key
DHL_API_KEY=your-dhl-key

# Application Settings
VISUAL_SEARCH_PROVIDER=openai
SHIPPING_PROVIDER=shippo
```

## Platform-Specific Setup

### macOS/Linux
```bash
# Option 1: Export in terminal (temporary)
export CLAUDE_API_KEY="your-key-here"
export OPENAI_API_KEY="your-key-here"

# Option 2: Add to ~/.bashrc or ~/.zshrc (permanent)
echo 'export CLAUDE_API_KEY="your-key-here"' >> ~/.bashrc
echo 'export OPENAI_API_KEY="your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### Windows
```cmd
# Option 1: Set in command prompt (temporary)
set CLAUDE_API_KEY=your-key-here
set OPENAI_API_KEY=your-key-here

# Option 2: Set system environment variables (permanent)
# Go to System Properties > Environment Variables
# Add new variables with your API keys
```

### IntelliJ IDEA
1. Go to Run/Debug Configurations
2. Select your ThriftAI application configuration
3. Add environment variables:
   - `CLAUDE_API_KEY=your-key-here`
   - `OPENAI_API_KEY=your-key-here`

## Testing Your Configuration

### 1. Verify Environment Variables
```bash
echo $CLAUDE_API_KEY
echo $OPENAI_API_KEY
```

### 2. Test API Connectivity
Start the application and check the logs:
```bash
mvn spring-boot:run -Dmaven.test.skip=true
```

Look for these log messages:
- ✅ `Claude API initialized successfully`
- ✅ `OpenAI API initialized successfully`
- ❌ `API key not found` (if keys are missing)

### 3. Test Search Functionality
1. Navigate to http://localhost:8084
2. Try searching for "electronics" in the main search box
3. Check for AI-powered responses and product recommendations

## Fallback Behavior

**Without API Keys:**
- ✅ Basic search functionality works
- ✅ Product filtering and browsing works
- ✅ Smart fallback responses provided
- ❌ No real AI chat responses
- ❌ No visual search capability

**With Claude API Key:**
- ✅ Full AI-powered search and chat
- ✅ Intelligent product recommendations
- ✅ Enhanced search insights
- ✅ Smart filtering and categorization

**With OpenAI API Key:**
- ✅ Visual search by image upload
- ✅ Image analysis and description
- ✅ Backup AI functionality

## Cost Considerations

### Claude API (Anthropic)
- **Free Tier:** Limited requests per month
- **Pricing:** ~$0.01-0.03 per 1K tokens
- **Recommended for:** Production use

### OpenAI API
- **Free Tier:** $5 credit for new accounts
- **Pricing:** ~$0.002-0.06 per 1K tokens (varies by model)
- **Recommended for:** Production use

### Development Tips
- Use demo mode during development (no API keys required)
- Set low rate limits during testing
- Monitor usage in API dashboards
- Use caching to reduce API calls

## Troubleshooting

### Common Issues

#### "401 Unauthorized" Errors
- ❌ Invalid API key format
- ❌ Expired API key
- ❌ Insufficient API credits
- ✅ **Solution:** Verify key format and account status

#### "API Rate Limit Exceeded"
- ❌ Too many requests
- ✅ **Solution:** Implement request throttling or upgrade plan

#### "Connection Timeout"
- ❌ Network connectivity issues
- ✅ **Solution:** Check internet connection and retry

### Debug Mode
Enable debug logging in `application.properties`:
```properties
logging.level.com.projectai=DEBUG
logging.level.org.springframework.web.client=DEBUG
```

## Security Best Practices

### 1. Environment Variables
- ✅ Use environment variables for API keys
- ❌ Never commit API keys to version control
- ✅ Add `.env` to `.gitignore`

### 2. Key Rotation
- 🔄 Rotate API keys regularly
- 🔄 Monitor for suspicious usage
- 🔄 Revoke compromised keys immediately

### 3. Access Control
- 🔒 Limit API key permissions where possible
- 🔒 Use separate keys for development/production
- 🔒 Monitor API usage dashboards

## Production Deployment

### Docker Environment
```dockerfile
ENV CLAUDE_API_KEY=${CLAUDE_API_KEY}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
```

### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: thriftai-secrets
data:
  claude-api-key: base64-encoded-key
  openai-api-key: base64-encoded-key
```

### AWS/Cloud Deployment
Use cloud provider secret management:
- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager

## Support

### Getting Help
1. Check the application logs for error messages
2. Verify API key format and validity
3. Test with a minimal example
4. Contact API provider support if needed

### Documentation Links
- [Anthropic Claude API Docs](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [ThriftAI GitHub Issues](https://github.com/your-repo/thriftai/issues)

---

**📧 Need Help?** Open an issue in the GitHub repository with your configuration details (without exposing API keys).