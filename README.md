# ThriftAI - AI-Powered Thrift Shopping Platform

A modern, AI-powered thrift shopping platform built with Next.js 14, featuring intelligent search, recommendations, and sustainability insights.

## 🏗️ Project Structure

```
ProjectAI/
├── thriftai-nextjs/          # Modern Next.js 14 full-stack application
│   ├── src/
│   │   ├── app/              # App Router pages and API routes
│   │   │   ├── api/          # API endpoints
│   │   │   │   ├── buyers/   # Buyer-related APIs
│   │   │   │   ├── products/ # Product APIs
│   │   │   │   ├── cart/     # Shopping cart APIs
│   │   │   │   └── auth/     # Authentication APIs
│   │   │   └── page.tsx      # Homepage
│   │   ├── lib/              # Utilities and services
│   │   │   ├── prisma.ts     # Database client
│   │   │   ├── auth.ts       # Authentication config
│   │   │   └── services/     # Business logic services
│   │   └── types/            # TypeScript type definitions
│   ├── prisma/               # Database schema and migrations
│   │   └── schema.prisma     # Database schema
│   ├── package.json          # Dependencies
│   └── .env.local            # Environment variables
├── thriftai-frontend/        # Legacy React frontend (optional)
├── CLAUDE.md                 # Development notes
└── README.md                 # This file
```

## ✨ Features

### 🤖 AI-Powered Features
- **ChatGPT Integration**: Intelligent product search with personalized recommendations
- **Claude AI Integration**: Sustainability-focused shopping advice and environmental insights
- **Smart Recommendations**: AI-driven product suggestions based on user preferences
- **Price Intelligence**: Automatic savings calculations and value assessments

### 🛍️ Shopping Features
- **Advanced Search**: Semantic search with category filtering
- **Shopping Cart**: Full cart management with price tracking
- **Order Management**: Complete order lifecycle from cart to delivery
- **Review System**: Product reviews with photo uploads
- **User Profiles**: Personalized buyer profiles with preferences

### 🔧 Technical Features
- **Database-Driven Configuration**: Zero hardcoded values, all business logic configurable
- **Authentication**: Secure NextAuth.js with Google OAuth support
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **API Architecture**: RESTful API design with proper error handling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and navigate to the project:**
```bash
cd ProjectAI/thriftai-nextjs
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up PostgreSQL database:**
```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb thriftai_nextjs
```

4. **Configure environment variables:**
```bash
cp .env.local.example .env.local
# Edit .env.local with your database URL and API keys
```

5. **Set up the database:**
```bash
npx prisma db push
npx prisma generate
```

6. **Start the development server:**
```bash
npm run dev
```

7. **Visit the application:**
   - **Modern Next.js App**: http://localhost:3000
   - **Legacy React App**: http://localhost:3001 (if needed)

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username@localhost:5432/thriftai_nextjs"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI Services (optional)
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Database Configuration

All business logic is database-driven through configuration tables:
- **Category Management**: `category_configuration` and `category_keywords`
- **Search Exclusions**: `search_exclusion_configuration`
- **Product Catalog**: Comprehensive product and seller management

## 🎯 API Endpoints

### Buyer APIs
- `GET/POST /api/buyers/search` - Product search
- `POST /api/buyers/chat-search` - AI-powered search with ChatGPT
- `POST /api/buyers/claude-search` - Sustainability-focused search with Claude
- `POST /api/buyers/register` - User registration

### Product APIs
- `GET /api/products` - Product listings
- `GET /api/products/[id]` - Product details
- `GET/POST /api/products/[id]/reviews` - Product reviews

### Cart & Orders
- `GET/POST /api/cart` - Shopping cart management
- `POST /api/checkout/create-order` - Order creation

### Authentication
- `/api/auth/[...nextauth]` - NextAuth.js endpoints

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with:
- **User Management**: Users, buyers, sellers with authentication
- **Product Catalog**: Products, categories, reviews, embeddings
- **E-commerce**: Orders, cart items, payment tracking
- **Configuration**: Database-driven business logic
- **AI Features**: Product embeddings for semantic search

## 🔄 Migration Status

✅ **Successfully Migrated from Java Spring Boot to Next.js 14:**
- ✅ Complete API layer migration
- ✅ Database schema conversion (JPA → Prisma)
- ✅ Business logic services migration
- ✅ AI integrations (OpenAI + Claude)
- ✅ Authentication system (NextAuth.js)
- ✅ Configuration management (database-driven)
- ✅ All hardcoded values eliminated

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npx prisma studio` - Database management UI
- `npx prisma db push` - Push schema changes

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-3.5, Anthropic Claude
- **Deployment**: Vercel-ready

## 🌱 Sustainability Features

ThriftAI promotes sustainable shopping through:
- **Environmental Impact Tracking**: CO2 savings, water conservation
- **Circular Economy**: Extending product lifecycles
- **Waste Reduction**: Keeping items out of landfills
- **Smart Recommendations**: Quality over quantity shopping

## 📝 License

This project is part of a personal development portfolio.

---

**Note**: The legacy Java Spring Boot backend has been completely replaced by the modern Next.js full-stack application. All functionality has been preserved and enhanced in the new architecture.