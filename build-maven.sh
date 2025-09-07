#!/bin/bash

echo "🏗️  Building ThriftAI (Maven-style)..."

# Create Maven target directory structure
mkdir -p target/classes
mkdir -p target/test-classes

# Compile main sources
echo "📦 Compiling main sources..."
javac -d target/classes src/main/java/com/projectai/*.java src/main/java/com/projectai/*/*.java

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    
    # Create basic manifest
    echo "Main-Class: com.projectai.SimpleMain" > target/MANIFEST.MF
    
    # Create JAR
    echo "📦 Creating JAR..."
    jar cfm target/thriftai-1.0.0.jar target/MANIFEST.MF -C target/classes .
    
    echo "✅ Maven-style build complete!"
    echo ""
    echo "🚀 Run options:"
    echo "   java -cp target/classes com.projectai.SimpleMain    # Direct execution"
    echo "   java -jar target/thriftai-1.0.0.jar                # JAR execution"
    echo "   java -cp target/classes com.projectai.Main         # Interactive mode"
    echo ""
    echo "📁 Files created:"
    echo "   target/classes/         # Compiled classes"
    echo "   target/thriftai-1.0.0.jar  # Executable JAR"
else
    echo "❌ Build failed!"
    exit 1
fi