# ThriftAI - Maven Project Setup

## 🚀 Quick Start (IntelliJ IDEA)

### 1. Open as Maven Project
```
File → Open → Select ProjectAI folder
IntelliJ will automatically detect pom.xml and import as Maven project
```

### 2. Wait for Maven Import
- IntelliJ will show "Maven projects need to be imported" notification
- Click **"Import Maven Projects"** or **"Enable Auto-Import"**
- Wait for dependency download to complete

### 3. Build & Run
**Option A: Using IntelliJ Maven panel**
- View → Tool Windows → Maven
- ThriftAI → Lifecycle → compile (double-click)
- ThriftAI → Plugins → exec → exec:java (double-click)

**Option B: Using Run Configuration**
- Run → "Maven Run ThriftAI" (pre-configured)

**Option C: Right-click Java files**
- Right-click `SimpleMain.java` → Run

## 🛠️ Maven Commands (if Maven is installed)

```bash
# Compile project
mvn clean compile

# Run main application
mvn exec:java

# Run interactive version
mvn exec:java -P interactive

# Package to JAR
mvn clean package

# Run packaged JAR
java -jar target/thriftai-1.0.0-shaded.jar

# Run tests (when created)
mvn test
```

## 📦 Installing Maven (Optional)

### macOS:
```bash
brew install maven
```

### Manual Installation:
1. Download from: https://maven.apache.org/download.cgi
2. Extract and add to PATH
3. Verify: `mvn --version`

## 🏗️ Project Structure (Maven Standard)

```
ProjectAI/
├── pom.xml                   # Maven configuration
├── src/
│   ├── main/
│   │   ├── java/            # Source code
│   │   │   └── com/projectai/
│   │   └── resources/       # Resources
│   └── test/
│       └── java/            # Test code
├── target/                  # Maven build output
└── .idea/                   # IntelliJ configuration
```

## 🎯 Dependencies Added

- **Jackson** (JSON processing) - for future API features
- **Apache Commons Lang** - utility functions
- **JUnit 5** - for testing framework

## ✅ IntelliJ Features Available

- ✅ **Auto-import** of Maven dependencies
- ✅ **Built-in Maven panel** for lifecycle management
- ✅ **Dependency management** through pom.xml
- ✅ **One-click run configurations**
- ✅ **Automatic source folder detection**
- ✅ **JAR packaging** with all dependencies

## 🔧 Troubleshooting

### "Cannot resolve dependencies"
**Solution:** 
- File → Settings → Build → Maven → Import automatically
- Or: View → Tool Windows → Maven → Reload

### "Java version mismatch"
**Solution:**
- File → Project Structure → Project → SDK: Java 11+
- Or edit pom.xml `maven.compiler.source`

### "Maven not recognized"
**IntelliJ has built-in Maven** - no separate installation needed for IDE usage!

## 🎉 Success Indicators

- ✅ Maven panel shows project structure
- ✅ Dependencies downloaded to local repository
- ✅ `target/classes` folder created after compilation
- ✅ Can run application from IDE
- ✅ JAR file created in `target/` folder