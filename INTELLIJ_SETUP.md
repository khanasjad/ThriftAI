# ThriftAI - IntelliJ IDEA Setup Guide

## 🚀 Quick Setup Steps

### 1. Open Project in IntelliJ
```
File → Open → Select ProjectAI folder
```

### 2. Configure Project Structure
- **File → Project Structure**
- **Project Settings → Project**
  - Project SDK: Java 11 or higher
  - Project language level: 11 or higher

### 3. Mark Source Directories
- **File → Project Structure → Modules**
- Mark `src/main/java` as **Sources** (should be blue)
- Mark `src/test/java` as **Tests** (should be green)

### 4. Build Project
- **Build → Build Project** (Ctrl+F9)
- Or use: **Build → Rebuild Project**

### 5. Run ThriftAI
Two pre-configured run configurations available:
- **ThriftAI Main** - Full automatic demo
- **ThriftAI Interactive** - Interactive menu

**Right-click any Main class → Run**

## 🛠️ Manual Build (if IntelliJ fails)

```bash
# From ProjectAI directory
./build.sh

# Then run:
java -cp out com.projectai.SimpleMain
```

## 📁 Expected Project Structure

```
ProjectAI/
├── .idea/                    # IntelliJ config
├── src/
│   ├── main/java/
│   │   └── com/projectai/
│   │       ├── Main.java
│   │       ├── SimpleMain.java
│   │       ├── DemoRunner.java
│   │       ├── models/
│   │       ├── services/
│   │       ├── ai/
│   │       └── utils/
│   └── test/java/
├── out/                      # Compiled classes
├── ProjectAI.iml            # IntelliJ module file
└── build.sh                # Manual build script
```

## 🔧 Troubleshooting

### Problem: "Cannot resolve symbol"
**Solution:** 
- File → Invalidate Caches → Invalidate and Restart

### Problem: "Java version issues"
**Solution:**
- File → Project Structure → Project → Change SDK to Java 11+

### Problem: "Source folders not recognized"
**Solution:**
- File → Project Structure → Modules 
- Right-click `src/main/java` → Mark as Sources

### Problem: "Build fails"
**Solution:**
```bash
cd ProjectAI
rm -rf out/
./build.sh
```

## ✅ Success Indicators

- ✅ No red underlines in code files
- ✅ Build completes without errors  
- ✅ Can run SimpleMain.java
- ✅ See ThriftAI welcome message with AI deals

## 🎯 Quick Test

Right-click on `SimpleMain.java` → **Run 'SimpleMain.main()'**

You should see:
```
============================================================
   Welcome to ThriftAI - Smart Thrift Shopping Assistant
============================================================
```