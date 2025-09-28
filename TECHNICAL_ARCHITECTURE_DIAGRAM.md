# ThriftAI - Technical Architecture Diagrams

## 🏗️ **Current System Architecture**

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 14 App]
        B[React Components]
        C[TypeScript]
        D[Tailwind CSS]
        E[NextAuth.js]
    end

    subgraph "API Layer"
        F[Next.js API Routes]
        G[Middleware Chain]
        H[Authentication]
        I[Rate Limiting]
        J[Error Handling]
    end

    subgraph "Business Logic"
        K[AIService]
        L[ConfigurationService]
        M[OrderService]
        N[CartService]
        O[UserService]
    end

    subgraph "External APIs"
        P[Claude AI API]
        Q[OpenAI API]
        R[Payment Gateways]
        S[Shipping APIs]
    end

    subgraph "Database Layer"
        T[(PostgreSQL)]
        U[Prisma ORM]
        V[Product Catalog]
        W[User Management]
        X[Configuration Tables]
    end

    A --> F
    B --> F
    F --> G
    G --> H
    G --> I
    G --> J
    F --> K
    F --> L
    F --> M
    F --> N
    F --> O
    K --> P
    K --> Q
    L --> U
    M --> U
    N --> U
    O --> U
    U --> T
    T --> V
    T --> W
    T --> X
```

## 🚀 **Enhanced Microservices Architecture**

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App]
        MOBILE[Mobile App]
        API_CLIENT[API Clients]
    end

    subgraph "API Gateway"
        GATEWAY[Kong/AWS API Gateway]
        LB[Load Balancer]
        AUTH[Authentication Service]
        RL[Rate Limiter]
    end

    subgraph "Core Services"
        USER_SVC[User Service]
        PRODUCT_SVC[Product Service]
        ORDER_SVC[Order Service]
        PAYMENT_SVC[Payment Service]
        NOTIFICATION_SVC[Notification Service]
    end

    subgraph "AI Services"
        AI_SEARCH[Search Intelligence]
        AI_RECOMMEND[Recommendation Engine]
        AI_VISION[Image Recognition]
        AI_SUSTAINABILITY[Sustainability Analytics]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        ELASTICSEARCH[(Elasticsearch)]
        REDIS[(Redis Cache)]
        S3[(File Storage)]
        ANALYTICS[(Analytics DB)]
    end

    subgraph "External Services"
        CLAUDE[Claude AI]
        OPENAI[OpenAI]
        STRIPE[Stripe]
        SHIPPING[Shipping APIs]
    end

    WEB --> GATEWAY
    MOBILE --> GATEWAY
    API_CLIENT --> GATEWAY

    GATEWAY --> LB
    LB --> AUTH
    LB --> RL

    GATEWAY --> USER_SVC
    GATEWAY --> PRODUCT_SVC
    GATEWAY --> ORDER_SVC
    GATEWAY --> PAYMENT_SVC
    GATEWAY --> NOTIFICATION_SVC

    USER_SVC --> AI_RECOMMEND
    PRODUCT_SVC --> AI_SEARCH
    PRODUCT_SVC --> AI_VISION
    ORDER_SVC --> AI_SUSTAINABILITY

    AI_SEARCH --> CLAUDE
    AI_SEARCH --> OPENAI
    AI_RECOMMEND --> POSTGRES
    AI_VISION --> S3

    USER_SVC --> POSTGRES
    PRODUCT_SVC --> POSTGRES
    PRODUCT_SVC --> ELASTICSEARCH
    ORDER_SVC --> POSTGRES
    PAYMENT_SVC --> STRIPE

    POSTGRES --> REDIS
    ELASTICSEARCH --> REDIS
```

## 🔄 **Data Flow Architecture**

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API_Gateway
    participant AI_Service
    participant Database
    participant Claude_AI

    User->>Frontend: Search "vintage jacket"
    Frontend->>API_Gateway: POST /api/buyers/claude-search
    API_Gateway->>AI_Service: Process search request
    AI_Service->>Database: Query matching products
    Database-->>AI_Service: Return product data
    AI_Service->>Claude_AI: Analyze products & provide advice
    Claude_AI-->>AI_Service: Return AI response
    AI_Service->>AI_Service: Calculate sustainability metrics
    AI_Service-->>API_Gateway: Return enriched results
    API_Gateway-->>Frontend: JSON response with AI insights
    Frontend-->>User: Display results with AI advice
```

## 🛡️ **Security Architecture**

```mermaid
graph LR
    subgraph "Security Layers"
        WAF[Web Application Firewall]
        CDN[CloudFlare CDN]
        LB[Load Balancer]

        subgraph "Application Security"
            AUTH[Authentication]
            AUTHZ[Authorization]
            ENCRYPT[Encryption]
            VALID[Input Validation]
        end

        subgraph "Infrastructure Security"
            VPC[Virtual Private Cloud]
            SECRETS[Secrets Management]
            AUDIT[Audit Logging]
            MONITOR[Security Monitoring]
        end

        subgraph "Data Security"
            ENCRYPT_DB[Database Encryption]
            BACKUP[Encrypted Backups]
            PII[PII Protection]
            GDPR[GDPR Compliance]
        end
    end

    Internet --> WAF
    WAF --> CDN
    CDN --> LB
    LB --> AUTH
    AUTH --> AUTHZ
```

## 📊 **Data Architecture**

```mermaid
graph TB
    subgraph "Data Sources"
        USERS[User Interactions]
        PRODUCTS[Product Data]
        TRANSACTIONS[Transaction Data]
        EXTERNAL[External APIs]
    end

    subgraph "Data Ingestion"
        KAFKA[Event Streaming]
        API[API Endpoints]
        BATCH[Batch Processing]
    end

    subgraph "Storage Layer"
        OLTP[(PostgreSQL - OLTP)]
        SEARCH[(Elasticsearch)]
        CACHE[(Redis)]
        FILES[(S3 Storage)]
        OLAP[(ClickHouse - OLAP)]
    end

    subgraph "Processing Layer"
        ETL[ETL Pipeline]
        ML[ML Pipeline]
        REALTIME[Real-time Processing]
    end

    subgraph "Analytics Layer"
        BI[Business Intelligence]
        REPORTS[Reporting]
        AI_MODELS[AI Models]
        DASHBOARDS[Dashboards]
    end

    USERS --> KAFKA
    PRODUCTS --> API
    TRANSACTIONS --> API
    EXTERNAL --> BATCH

    KAFKA --> OLTP
    API --> OLTP
    BATCH --> OLAP

    OLTP --> SEARCH
    OLTP --> CACHE
    OLTP --> FILES

    OLTP --> ETL
    OLAP --> ML
    KAFKA --> REALTIME

    ETL --> BI
    ML --> AI_MODELS
    REALTIME --> DASHBOARDS
```

## 🌐 **Deployment Architecture**

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Kubernetes Cluster"
            NGINX[NGINX Ingress]

            subgraph "Application Pods"
                WEB_POD[Web App Pods]
                API_POD[API Pods]
                AI_POD[AI Service Pods]
            end

            subgraph "Data Pods"
                DB_POD[Database Pods]
                REDIS_POD[Redis Pods]
                ES_POD[Elasticsearch Pods]
            end
        end

        subgraph "External Services"
            RDS[(AWS RDS)]
            S3[(AWS S3)]
            CDN[CloudFlare CDN]
        end
    end

    subgraph "CI/CD Pipeline"
        GIT[Git Repository]
        GITHUB[GitHub Actions]
        DOCKER[Docker Registry]
        HELM[Helm Charts]
    end

    subgraph "Monitoring Stack"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        ELK[ELK Stack]
        SENTRY[Sentry]
    end

    GIT --> GITHUB
    GITHUB --> DOCKER
    DOCKER --> HELM
    HELM --> NGINX

    NGINX --> WEB_POD
    NGINX --> API_POD
    API_POD --> AI_POD

    API_POD --> RDS
    WEB_POD --> S3
    CDN --> WEB_POD

    WEB_POD --> PROMETHEUS
    API_POD --> ELK
    AI_POD --> SENTRY
```

## 🤖 **AI/ML Pipeline Architecture**

```mermaid
graph LR
    subgraph "Data Collection"
        USER_DATA[User Behavior]
        PRODUCT_DATA[Product Information]
        SEARCH_DATA[Search Queries]
        FEEDBACK[User Feedback]
    end

    subgraph "Data Processing"
        CLEAN[Data Cleaning]
        FEATURE[Feature Engineering]
        EMBED[Text Embeddings]
        IMAGE[Image Processing]
    end

    subgraph "Model Training"
        RECOMMEND[Recommendation Model]
        SEARCH[Search Ranking]
        PRICE[Price Prediction]
        VISION[Computer Vision]
    end

    subgraph "Model Serving"
        API_SERVE[Model API]
        BATCH_PRED[Batch Predictions]
        REALTIME[Real-time Inference]
        AB_TEST[A/B Testing]
    end

    subgraph "External AI"
        CLAUDE[Claude AI]
        OPENAI[OpenAI]
        VISION_API[Vision APIs]
    end

    USER_DATA --> CLEAN
    PRODUCT_DATA --> FEATURE
    SEARCH_DATA --> EMBED
    FEEDBACK --> CLEAN

    CLEAN --> RECOMMEND
    FEATURE --> SEARCH
    EMBED --> PRICE
    IMAGE --> VISION

    RECOMMEND --> API_SERVE
    SEARCH --> BATCH_PRED
    PRICE --> REALTIME
    VISION --> AB_TEST

    API_SERVE --> CLAUDE
    REALTIME --> OPENAI
    BATCH_PRED --> VISION_API
```

## 📱 **Mobile Architecture**

```mermaid
graph TB
    subgraph "Mobile Apps"
        IOS[iOS App - Swift/SwiftUI]
        ANDROID[Android App - Kotlin]
        RN[React Native App]
    end

    subgraph "Mobile Backend"
        PUSH[Push Notifications]
        OFFLINE[Offline Sync]
        AUTH_MOBILE[Mobile Auth]
        ANALYTICS_MOBILE[Mobile Analytics]
    end

    subgraph "Mobile Features"
        CAMERA[Camera Integration]
        AR[AR Try-on]
        GPS[Location Services]
        BIOMETRIC[Biometric Auth]
    end

    subgraph "API Layer"
        MOBILE_API[Mobile API Gateway]
        GRAPHQL[GraphQL Endpoint]
        REST[REST APIs]
    end

    IOS --> MOBILE_API
    ANDROID --> MOBILE_API
    RN --> MOBILE_API

    MOBILE_API --> PUSH
    MOBILE_API --> OFFLINE
    MOBILE_API --> AUTH_MOBILE

    IOS --> CAMERA
    ANDROID --> AR
    RN --> GPS
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Foundation (Current)**
- [x] Next.js 14 with TypeScript
- [x] PostgreSQL database setup
- [x] Prisma ORM integration
- [x] Claude AI SDK integration
- [x] Basic authentication (NextAuth.js)
- [x] Product catalog and search
- [x] Responsive UI with Tailwind CSS

### **Phase 2: Enhancement (Next 30 days)**
- [ ] Database optimization and indexing
- [ ] Redis caching implementation
- [ ] Enhanced error handling and monitoring
- [ ] API rate limiting
- [ ] Security audit and fixes
- [ ] Performance optimization

### **Phase 3: Scaling (Next 90 days)**
- [ ] Microservices architecture
- [ ] Elasticsearch for advanced search
- [ ] Container orchestration (Docker + Kubernetes)
- [ ] CI/CD pipeline setup
- [ ] Load balancing and auto-scaling
- [ ] Comprehensive monitoring stack

### **Phase 4: Advanced Features (Next 180 days)**
- [ ] Computer vision integration
- [ ] Advanced recommendation engine
- [ ] Mobile app development
- [ ] AR/VR features
- [ ] Blockchain integration
- [ ] Multi-region deployment

---

This technical architecture provides a comprehensive roadmap for scaling ThriftAI from the current monolithic Next.js application to a distributed, cloud-native platform capable of handling millions of users while maintaining performance, security, and sustainability focus.