#!/bin/bash

echo "🔨 Building ThriftAI..."

# Create output directory
mkdir -p out

# Compile all Java files
echo "📦 Compiling Java files..."
javac -d out src/main/java/com/projectai/*.java src/main/java/com/projectai/*/*.java

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 To run ThriftAI:"
    echo "   java -cp out com.projectai.SimpleMain    # Full demo"
    echo "   java -cp out com.projectai.Main          # Interactive menu"
    echo "   java -cp out com.projectai.DemoRunner    # Quick AI demo"
else
    echo "❌ Build failed!"
    exit 1
fi