# ThriftAI - Claude Configuration

## OpenAI ChatGPT Integration Setup

To enable real ChatGPT responses in ThriftAI, you need to configure an OpenAI API key:

### 1. Get OpenAI API Key
- Go to https://platform.openai.com/api-keys
- Create a new secret key
- Copy the key (starts with `sk-`)

### 2. Set Environment Variable
```bash
export OPENAI_API_KEY="your_api_key_here"
```

### 3. Start the Application
```bash
mvn spring-boot:run -Dmaven.test.skip=true
```

## Current Status
- ✅ ChatGPT integration code is complete and working
- ✅ Real API calls are being made to OpenAI (when key is configured)
- ✅ Intelligent fallback responses work when API is unavailable
- ✅ Business logic integration (savings calculations, environmental impact)
- ✅ Template security issues fixed

## Without API Key
The application will work with intelligent fallback responses that still provide value by:
- Showing relevant product recommendations
- Calculating savings compared to retail prices
- Providing sustainability information
- Offering personalized suggestions based on search terms

## Testing Commands
```bash
# Compile and check for errors
mvn compile

# Run tests (if available)
mvn test

# Start application
mvn spring-boot:run -Dmaven.test.skip=true

# Start on different port
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8085" -Dmaven.test.skip=true
```