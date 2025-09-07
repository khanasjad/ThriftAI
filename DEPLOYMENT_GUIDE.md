# 🚀 ThriftAI Full-Stack Deployment Guide

## 📋 **Prerequisites for Running Full-Stack Version**

### **Required Software**
- ☕ **Java 17+** (Current system has Java 19 ✅)
- 📦 **Maven 3.6+** or use IDE with built-in Maven
- 🌐 **Web Browser** (Chrome, Firefox, Safari, Edge)

### **Optional (for development)**
- 💡 **IntelliJ IDEA** (Recommended)
- 🐳 **Docker** (for containerization)
- 📊 **Postman** (for API testing)

## 🏗️ **Deployment Options**

### **Option 1: IntelliJ IDEA (Easiest)**
```bash
1. Open IntelliJ IDEA
2. File → Open → Select ProjectAI folder
3. Wait for Maven dependencies to download (this may take a few minutes)
4. Once indexing is complete:
   - Right-click ThriftAIApplication.java
   - Select "Run 'ThriftAIApplication.main()'"
5. Open browser to http://localhost:8080
```

### **Option 2: Command Line with Maven**
```bash
cd ProjectAI

# Install dependencies and run
mvn clean install
mvn spring-boot:run

# Alternative: Package and run JAR
mvn clean package
java -jar target/thriftai-1.0.0.jar
```

### **Option 3: Maven Wrapper (if available)**
```bash
cd ProjectAI
./mvnw spring-boot:run
```

### **Option 4: IDE with Maven Integration**
- **Eclipse**: Import as Maven project → Run as Spring Boot App
- **VS Code**: Open folder → Use Spring Boot Extension → Run
- **NetBeans**: Open Project → Run Main Class

## 🌐 **Application URLs (Once Running)**

### **Web Interface**
- 🏠 **Homepage**: http://localhost:8080
- 🛒 **Products**: http://localhost:8080/products
- 🤖 **AI Deals**: http://localhost:8080/deals
- 📊 **Analytics**: http://localhost:8080/analytics

### **API Endpoints**
- 🔍 **API Health**: http://localhost:8080/api/v1/health
- 📋 **All Products**: http://localhost:8080/api/v1/products
- 🎯 **Recommendations**: http://localhost:8080/api/v1/deals/recommendations
- 📈 **Platform Stats**: http://localhost:8080/api/v1/analytics/overview

### **Development Tools**
- 🗄️ **H2 Database Console**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:thriftai`
  - Username: `sa`
  - Password: (leave empty)
- 💡 **Spring Actuator**: http://localhost:8080/actuator/health

## 📦 **What Happens When You Run**

### **1. Spring Boot Startup**
```
🚀 Starting ThriftAI Full-Stack Application...
📊 Initializing ThriftAI sample data...
✅ Sample data initialized successfully!
⚡ WebSocket support enabled
🌐 Tomcat started on port 8080
✅ ThriftAI Application ready!
```

### **2. Database Initialization**
- H2 in-memory database created
- Product, Deal, Store tables created
- Sample data inserted (5 products, 3 stores)
- JPA repositories activated

### **3. Web Services Available**
- REST API endpoints live
- WebSocket connections ready
- Thymeleaf templates loaded
- Static resources served

### **4. AI & Real-time Features**
- Deal scoring algorithm active
- WebSocket broadcasting every 30 seconds
- Real-time statistics updates
- AI enhancement service ready

## 🛠️ **Troubleshooting**

### **Issue: "Maven not found"**
**Solution**: 
- Install Maven: `brew install maven` (macOS) 
- Or use IntelliJ with built-in Maven support

### **Issue: "Port 8080 already in use"**
**Solution**: 
- Change port in `application.yml`: `server.port: 8081`
- Or kill process using port: `lsof -ti:8080 | xargs kill`

### **Issue: "Java version not supported"**
**Solution**:
- Update to Java 17+
- Or modify `pom.xml` to use Java 11:
```xml
<java.version>11</java.version>
<maven.compiler.source>11</maven.compiler.source>
<maven.compiler.target>11</maven.compiler.target>
```

### **Issue: "Dependencies not downloading"**
**Solution**:
- Check internet connection
- Clear Maven cache: `mvn dependency:purge-local-repository`
- Refresh in IDE: Maven panel → Reload

## 🎯 **Expected Features Once Running**

### **Homepage (http://localhost:8080)**
- ✅ Live platform statistics
- ✅ Featured AI-recommended deals  
- ✅ Real-time WebSocket connection status
- ✅ Responsive mobile design
- ✅ Navigation to all sections

### **Products Page**
- ✅ Search with live suggestions
- ✅ Category and brand filtering
- ✅ Detailed product information
- ✅ Add to favorites functionality

### **AI Deals Page** 
- ✅ Real-time deal updates via WebSocket
- ✅ AI quality scoring (Exceptional, Excellent, etc.)
- ✅ Live connection indicator
- ✅ Deal explanations and savings calculations

### **Analytics Dashboard**
- ✅ Real-time platform metrics
- ✅ Category distribution charts
- ✅ Trend analysis
- ✅ Performance indicators

### **API Access**
- ✅ RESTful endpoints for all data
- ✅ JSON responses
- ✅ Error handling
- ✅ Health monitoring

### **Real-time Features**
- ✅ WebSocket connections with auto-reconnect
- ✅ Live deal updates every 30 seconds
- ✅ Push notifications for new deals
- ✅ Real-time statistics updates

## 🔧 **Development Mode**

### **Hot Reload (with Spring DevTools)**
- Code changes automatically trigger restart
- Static resources update without restart
- Database schema updates on restart

### **Debug Mode**
- Set logging level to DEBUG in `application.yml`
- Use IDE debugger with breakpoints
- Monitor SQL queries in console

### **API Testing**
```bash
# Test API endpoints
curl http://localhost:8080/api/v1/health
curl http://localhost:8080/api/v1/products
curl http://localhost:8080/api/v1/analytics/overview

# Test WebSocket (using browser dev tools)
const socket = new SockJS('/thrift-websocket');
const stompClient = Stomp.over(socket);
```

## 🎉 **Success Indicators**

### **✅ Application Started Successfully When:**
- Console shows "Started ThriftAIApplication"
- Homepage loads at http://localhost:8080
- API health check returns 200 OK
- H2 console is accessible
- WebSocket connection established
- Sample data is visible in UI

### **✅ Full Functionality Working When:**
- Real-time deal updates appear
- Search suggestions work
- AI deal scoring shows quality ratings
- WebSocket status shows "Connected"
- Database console shows populated tables
- All navigation links work

## 📱 **Mobile & Browser Support**

- ✅ **Chrome/Chromium** (Recommended)
- ✅ **Firefox**
- ✅ **Safari**
- ✅ **Edge**
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)
- ✅ **Tablet support** (iPad, Android tablets)

## 🔮 **Next Steps After Deployment**

1. **Explore the UI** - Navigate through all pages
2. **Test Real-time Features** - Watch for live updates
3. **Use the API** - Try the REST endpoints
4. **Check Database** - Examine H2 console
5. **Monitor WebSocket** - Watch browser dev tools
6. **Customize Data** - Add new products via API
7. **Integrate External AI** - Configure AI service URLs

**ThriftAI is ready for production deployment and scaling!** 🚀