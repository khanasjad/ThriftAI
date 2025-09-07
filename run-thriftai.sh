#!/bin/bash

echo "🚀 Starting ThriftAI Full-Stack Application..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 17 or higher."
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2 | sed 's/\..*//')
if [ "$JAVA_VERSION" -lt "17" ]; then
    echo "❌ Java 17 or higher is required. Current version: $JAVA_VERSION"
    exit 1
fi

echo "✅ Java version check passed"

# Create target directory
mkdir -p target/classes

# Compile the application
echo "📦 Compiling ThriftAI..."
find src/main/java -name "*.java" | xargs javac -cp "target/classes:$(find . -name "*.jar" | tr '\n' ':')" -d target/classes

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    
    # Copy resources
    echo "📁 Copying resources..."
    cp -r src/main/resources/* target/classes/ 2>/dev/null || true
    
    echo "🎉 ThriftAI is ready to run!"
    echo ""
    echo "🌐 To run the full-stack application:"
    echo "   java -cp target/classes com.projectai.ThriftAIApplication"
    echo ""
    echo "📱 Once running, access the web interface at:"
    echo "   http://localhost:8080"
    echo ""
    echo "🔧 Development tools:"
    echo "   H2 Database Console: http://localhost:8080/h2-console"
    echo "   API Documentation: http://localhost:8080/api/v1/health"
    echo ""
    echo "💡 For Maven users:"
    echo "   mvn spring-boot:run"
else
    echo "❌ Compilation failed!"
    exit 1
fi