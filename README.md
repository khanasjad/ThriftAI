# ThriftAI - AI-Powered Thrift Shopping Assistant

An intelligent Java application that helps users find the best thrift shopping deals using AI algorithms for price comparison, deal scoring, and smart recommendations.

## Project Structure

```
ProjectAI/
├── src/
│   ├── main/
│   │   └── java/
│   │       └── com/
│   │           └── projectai/
│   │               ├── Main.java
│   │               ├── models/        # Data models (Product, Deal, Store)
│   │               ├── services/      # Business logic services
│   │               ├── ai/           # AI algorithms and scoring
│   │               ├── scrapers/     # Price scraping utilities
│   │               └── utils/        # Helper utilities
│   └── test/
│       └── java/
│           └── com/
│               └── projectai/
├── lib/
├── docs/
├── resources/
└── README.md
```

## Features

- 🤖 AI-powered deal scoring algorithm
- 💰 Price comparison across multiple thrift platforms
- 🎯 Smart product recommendations based on user preferences
- 📱 Deal alerts and notifications
- 🧠 Machine learning for user preference optimization
- 🔍 Automated product categorization and matching

## Getting Started

1. Navigate to the ProjectAI directory
2. Compile: `javac -d out src/main/java/com/projectai/*.java`
3. Run: `java -cp out com.projectai.Main`

## Requirements

- Java 8 or higher