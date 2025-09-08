package com.projectai;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.Executors;

/**
 * Advanced ThriftAI Web Server with Seller/Buyer Platform
 * Includes AI-powered search, visual search, and thrift store integration
 */
public class SimpleWebServer {
    
    private HttpServer server;
    private final int port = 8080;
    
    public static void main(String[] args) {
        try {
            SimpleWebServer webServer = new SimpleWebServer();
            webServer.start();
            System.out.println("🚀 ThriftAI Advanced Web Server started successfully!");
            System.out.println("🌐 Open your browser and navigate to:");
            System.out.println("   http://localhost:8080");
            System.out.println("   http://127.0.0.1:8080");
            System.out.println();
            System.out.println("💡 Available endpoints:");
            System.out.println("   /          - Advanced Seller/Buyer Homepage");
            System.out.println("   /api/v1/deals - AI Deals API");
            System.out.println("   /api/v1/stats - Platform Statistics");
            System.out.println("   /api/v1/search - ChatGPT Search API");
            System.out.println("   /api/v1/pricing - AI Pricing Analysis");
            System.out.println();
            System.out.println("🎯 Features:");
            System.out.println("   • ChatGPT-Powered Search Interface");
            System.out.println("   • Visual Search with Image Upload");
            System.out.println("   • Instagram Style Matching");
            System.out.println("   • AI Pricing & Market Analysis");
            System.out.println("   • Thrift Store Network Integration");
            System.out.println("   • Real-time Price Comparison");
            System.out.println();
            System.out.println("Press Ctrl+C to stop the server...");
            
            // Keep the server running
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("\n👋 Shutting down ThriftAI Advanced Web Server...");
                webServer.stop();
            }));
            
            // Keep main thread alive
            Thread.currentThread().join();
            
        } catch (Exception e) {
            System.err.println("❌ Failed to start web server: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);
        
        // Homepage with advanced seller/buyer platform
        server.createContext("/", new AdvancedHomeHandler());
        
        // API endpoints for advanced features
        server.createContext("/api/v1/deals", new DealsAPIHandler());
        server.createContext("/api/v1/stats", new StatsAPIHandler());
        server.createContext("/api/v1/health", new HealthAPIHandler());
        server.createContext("/api/v1/search", new ChatGPTSearchHandler());
        server.createContext("/api/v1/pricing", new AIPricingHandler());
        server.createContext("/api/v1/visual-search", new VisualSearchHandler());
        server.createContext("/api/v1/instagram", new InstagramSearchHandler());
        
        // Static resources
        server.createContext("/css", new StaticResourceHandler("text/css"));
        server.createContext("/js", new StaticResourceHandler("application/javascript"));
        
        server.setExecutor(Executors.newFixedThreadPool(10));
        server.start();
    }
    
    public void stop() {
        if (server != null) {
            server.stop(0);
        }
    }
    
    // Advanced Homepage Handler with Seller/Buyer Platform
    static class AdvancedHomeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String response = generateAdvancedHomepage();
            sendResponse(exchange, response, "text/html");
        }
        
        private String generateAdvancedHomepage() {
            StringBuilder html = new StringBuilder();
            
            // HTML Header
            appendHtmlHeader(html);
            appendAdvancedStyles(html);
            html.append("</head>\n");
            html.append("<body>\n");
            
            // Navigation
            appendAdvancedNavigation(html);
            
            // Main Content Container
            html.append("<div class=\"container mt-4\">\n");
            
            // Mode Selection Header
            appendModeSelection(html);
            
            // Dynamic Content Areas
            appendBuyerInterface(html);
            appendSellerInterface(html);
            appendAIDiscussion(html);
            appendAIAssistant(html);
            appendVisualSearch(html);
            appendNeuralNetwork(html);
            
            html.append("</div>\n");
            
            // Modals
            appendModals(html);
            
            // Scripts
            appendAdvancedScripts(html);
            
            html.append("</body>\n");
            html.append("</html>");
            
            return html.toString();
        }
        
        private void appendHtmlHeader(StringBuilder html) {
            html.append("<!DOCTYPE html>\n");
            html.append("<html lang=\"en\">\n");
            html.append("<head>\n");
            html.append("    <meta charset=\"UTF-8\">\n");
            html.append("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
            html.append("    <title>ThriftAI - Advanced Seller/Buyer Platform</title>\n");
            html.append("    <link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css\" rel=\"stylesheet\">\n");
            html.append("    <link href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\" rel=\"stylesheet\">\n");
            html.append("    <script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js\"></script>\n");
        }
        
        private void appendAdvancedStyles(StringBuilder html) {
            html.append("    <style>\n");
            html.append("        :root {\n");
            // Elegant Dark Theme with Cyan Accents
            html.append("            --bg-primary: #1a1a1a;\n");        // Deep black
            html.append("            --bg-secondary: #2c3e50;\n");      // Dark blue-gray
            html.append("            --bg-tertiary: #34495e;\n");       // Lighter blue-gray
            html.append("            --bg-card: #2c3e50;\n");           // Card background 
            html.append("            --bg-surface: #34495e;\n");        // Input/surface
            html.append("            --text-primary: #ffffff;\n");      // Pure white
            html.append("            --text-secondary: #a0a0a0;\n");    // Light gray 
            html.append("            --text-muted: #8a92b2;\n");        // Muted blue-gray
            html.append("            --accent-primary: #00d4ff;\n");    // Bright cyan
            html.append("            --accent-secondary: #00f2fe;\n");  // Light cyan
            html.append("            --accent-success: #00f2fe;\n");    // Success cyan
            html.append("            --accent-warning: #ffd93d;\n");    // Golden yellow
            html.append("            --accent-danger: #ff6b6b;\n");     // Soft red
            html.append("            --border-color: rgba(0, 212, 255, 0.1);\n");      // Subtle cyan borders
            html.append("            --border-light: rgba(0, 212, 255, 0.2);\n");      // Light cyan borders
            html.append("            --shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.3);\n");
            html.append("            --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.4);\n");
            html.append("            --shadow-large: 0 8px 24px rgba(0, 0, 0, 0.5);\n");
            html.append("        }\n");
            html.append("        * { box-sizing: border-box; }\n");
            html.append("        body { \n");
            html.append("            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', Roboto, Helvetica, Arial, sans-serif;\n");
            html.append("            background: var(--bg-primary);\n");
            html.append("            color: var(--text-primary);\n");
            html.append("            margin: 0;\n");
            html.append("            padding: 0;\n");
            html.append("            min-height: 100vh;\n");
            html.append("            font-weight: 400;\n");
            html.append("            line-height: 1.5;\n");
            html.append("            -webkit-font-smoothing: antialiased;\n");
            html.append("        }\n");
            
            // Premium Bootstrap overrides
            html.append("        .bg-dark { background: var(--bg-secondary) !important; }\n");
            html.append("        .card { background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: var(--shadow-medium); border-radius: 12px; }\n");
            html.append("        .card-header { background: transparent; border-bottom: 1px solid var(--border-color); font-weight: 600; }\n");
            html.append("        .form-control { background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 8px; padding: 12px 16px; font-size: 16px; }\n");
            html.append("        .form-control:focus { background: var(--bg-secondary); border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.25); color: var(--text-primary); }\n");
            html.append("        .form-control::placeholder { color: #666666; opacity: 1; }\n");
            html.append("        .form-select { background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 8px; padding: 12px 16px; font-size: 16px; }\n");
            html.append("        .btn-primary { background: linear-gradient(135deg, #00d4ff 0%, #001f3f 100%); color: var(--text-primary); border: 1px solid rgba(0, 212, 255, 0.3); font-weight: 500; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 212, 255, 0.2); }\n");
            html.append("        .btn-primary:hover { background: linear-gradient(135deg, #00f2fe 0%, #00d4ff 100%); color: var(--text-primary); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4); border-color: rgba(0, 212, 255, 0.5); }\n");
            html.append("        .btn-success { background: var(--accent-success); border: none; border-radius: 8px; font-weight: 500; }\n");
            html.append("        .btn-outline-primary { color: var(--accent-primary); border: 1px solid var(--accent-primary); background: transparent; border-radius: 8px; }\n");
            html.append("        .btn-outline-primary:hover { background: var(--accent-primary); color: var(--bg-primary); border-color: var(--accent-primary); box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3); }\n");
            html.append("        .text-muted { color: var(--text-muted) !important; }\n");
            html.append("        .alert-info { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 8px; }\n");
            
            // Premium interface components with high-contrast text
            html.append("        .mode-card { \n");
            html.append("            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); \n");
            html.append("            cursor: pointer; \n");
            html.append("            border: 1px solid var(--border-color); \n");
            html.append("            background: var(--bg-card);\n");
            html.append("            border-radius: 12px;\n");
            html.append("            color: var(--text-primary) !important;\n");
            html.append("        }\n");
            html.append("        .mode-card * { \n");
            html.append("            color: var(--text-primary) !important;\n");
            html.append("        }\n");
            html.append("        .mode-card h5 { \n");
            html.append("            color: var(--text-primary) !important;\n");
            html.append("            font-weight: 600;\n");
            html.append("        }\n");
            html.append("        .mode-card p { \n");
            html.append("            color: var(--text-secondary) !important;\n");
            html.append("        }\n");
            html.append("        .mode-card:hover { \n");
            html.append("            transform: translateY(-2px); \n");
            html.append("            border-color: var(--border-light); \n");
            html.append("            box-shadow: var(--shadow-large);\n");
            html.append("        }\n");
            html.append("        .mode-card.active { \n");
            html.append("            border-color: var(--text-primary); \n");
            html.append("            background: var(--bg-surface);\n");
            html.append("            box-shadow: var(--shadow-medium);\n");
            html.append("        }\n");
            html.append("        .content-area { display: none; }\n");
            html.append("        .content-area.active { display: block; animation: fadeIn 0.3s ease; }\n");
            html.append("        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }\n");
            
            // Premium chat interface styles
            html.append("        .chat-container { \n");
            html.append("            height: 500px; \n");
            html.append("            overflow-y: auto; \n");
            html.append("            background: var(--bg-primary);\n");
            html.append("            border: 1px solid var(--border-color);\n");
            html.append("            border-radius: 12px;\n");
            html.append("            padding: 16px;\n");
            html.append("        }\n");
            html.append("        .chat-message { \n");
            html.append("            margin: 12px 0; \n");
            html.append("            padding: 12px 16px; \n");
            html.append("            border-radius: 12px; \n");
            html.append("            max-width: 75%;\n");
            html.append("            word-wrap: break-word;\n");
            html.append("        }\n");
            html.append("        .chat-message.user { \n");
            html.append("            background: var(--text-primary); \n");
            html.append("            color: var(--bg-primary); \n");
            html.append("            margin-left: auto;\n");
            html.append("            text-align: right;\n");
            html.append("            font-weight: 500;\n");
            html.append("        }\n");
            html.append("        .chat-message.ai { \n");
            html.append("            background: var(--bg-surface); \n");
            html.append("            color: var(--text-primary); \n");
            html.append("            border: 1px solid var(--border-color);\n");
            html.append("            margin-right: auto;\n");
            html.append("        }\n");
            html.append("        .chat-input { \n");
            html.append("            background: #ffffff !important; \n");
            html.append("            border: 2px solid var(--border-light); \n");
            html.append("            color: #000000 !important;\n");
            html.append("            border-radius: 25px;\n");
            html.append("            padding: 12px 20px;\n");
            html.append("            font-size: 16px;\n");
            html.append("        }\n");
            html.append("        .chat-input::placeholder { \n");
            html.append("            color: #666666 !important;\n");
            html.append("            opacity: 1;\n");
            html.append("        }\n");
            html.append("        .chat-input:focus { \n");
            html.append("            border-color: var(--accent-primary); \n");
            html.append("            box-shadow: var(--shadow-ai);\n");
            html.append("        }\n");
            
            // Visual search enhancements
            html.append("        .upload-zone { \n");
            html.append("            border: 2px dashed var(--accent-primary); \n");
            html.append("            background: var(--bg-card);\n");
            html.append("            transition: all 0.3s ease; \n");
            html.append("            border-radius: 12px;\n");
            html.append("        }\n");
            html.append("        .upload-zone:hover { \n");
            html.append("            background: rgba(0, 212, 255, 0.05); \n");
            html.append("            box-shadow: var(--shadow-ai);\n");
            html.append("        }\n");
            html.append("        .upload-zone.dragover { \n");
            html.append("            background: rgba(0, 212, 255, 0.1); \n");
            html.append("            border-color: var(--accent-secondary);\n");
            html.append("            box-shadow: var(--shadow-ai);\n");
            html.append("        }\n");
            
            // Search result styling
            html.append("        .search-result-item { \n");
            html.append("            border-left: 4px solid var(--accent-primary); \n");
            html.append("            background: var(--bg-card);\n");
            html.append("            transition: all 0.3s ease;\n");
            html.append("        }\n");
            html.append("        .search-result-item:hover { \n");
            html.append("            box-shadow: var(--shadow-ai); \n");
            html.append("            transform: translateX(5px);\n");
            html.append("        }\n");
            
            // AI provider indicators
            html.append("        .ai-provider { \n");
            html.append("            display: inline-block;\n");
            html.append("            padding: 4px 12px;\n");
            html.append("            border-radius: 20px;\n");
            html.append("            font-size: 0.8em;\n");
            html.append("            margin: 2px;\n");
            html.append("        }\n");
            html.append("        .ai-provider.chatgpt { background: rgba(16, 163, 127, 0.2); color: #10a37f; }\n");
            html.append("        .ai-provider.claude { background: rgba(255, 120, 0, 0.2); color: #ff7800; }\n");
            html.append("        .ai-provider.ollama { background: rgba(99, 102, 241, 0.2); color: #6366f1; }\n");
            
            // Animations
            html.append("        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }\n");
            html.append("        .ai-thinking { animation: pulse 1.5s ease-in-out infinite; }\n");
            html.append("        .typing-indicator { \n");
            html.append("            display: inline-block;\n");
            html.append("            width: 8px;\n");
            html.append("            height: 8px;\n");
            html.append("            border-radius: 50%;\n");
            html.append("            background: var(--accent-primary);\n");
            html.append("            margin: 0 2px;\n");
            html.append("            animation: pulse 1.4s ease-in-out infinite;\n");
            html.append("        }\n");
            html.append("        .typing-indicator:nth-child(2) { animation-delay: 0.2s; }\n");
            html.append("        .typing-indicator:nth-child(3) { animation-delay: 0.4s; }\n");
            
            html.append("    </style>\n");
        }
        
        private void appendAdvancedNavigation(StringBuilder html) {
            html.append("<nav class=\"navbar navbar-expand-lg\" style=\"background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);\">\n");
            html.append("    <div class=\"container\">\n");
            html.append("        <a class=\"navbar-brand text-white fw-bold d-flex align-items-center\" href=\"#\" style=\"font-size: 1.5rem; letter-spacing: -0.02em; text-decoration: none;\">\n");
            html.append("            <div class=\"logo-text\">\n");
            html.append("                <span style=\"background: linear-gradient(135deg, #00d4ff 0%, #ffffff 50%, #00d4ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 700;\">Thrift</span><span style=\"color: var(--text-primary); font-weight: 300;\">AI</span>\n");
            html.append("                <small class=\"ms-2 d-none d-md-inline\" style=\"font-size: 0.55em; opacity: 0.8; color: var(--text-muted);\">Neural Marketplace</small>\n");
            html.append("            </div>\n");
            html.append("        </a>\n");
            html.append("    </div>\n");
            html.append("</nav>\n");
        }
        
        private void appendModeSelection(StringBuilder html) {
            html.append("<div class=\"row mb-4\">\n");
            html.append("    <div class=\"col-12\">\n");
            html.append("        <h2 class=\"text-center mb-4\" style=\"color: var(--text-primary); font-weight: 600; letter-spacing: -0.02em;\">Choose Your Mode</h2>\n");
            html.append("        <div class=\"row g-3\">\n");
            
            // Buyer Mode
            html.append("            <div class=\"col-lg-2 col-md-4\">\n");
            html.append("                <div class=\"card mode-card h-100\" onclick=\"showMode('buyer')\" id=\"buyer-mode-card\">\n");
            html.append("                    <div class=\"card-body text-center\">\n");
            html.append("                        <h6>Buyer Mode</h6>\n");
            html.append("                        <small class=\"text-muted\">AI Search & Discovery</small>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            
            // Seller Mode
            html.append("            <div class=\"col-lg-2 col-md-4\">\n");
            html.append("                <div class=\"card mode-card h-100\" onclick=\"showMode('seller')\" id=\"seller-mode-card\">\n");
            html.append("                    <div class=\"card-body text-center\">\n");
            html.append("                        <h6>Seller Mode</h6>\n");
            html.append("                        <small class=\"text-muted\">AI Pricing & Analytics</small>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            
            // AI Discussion
            html.append("            <div class=\"col-lg-2 col-md-4\">\n");
            html.append("                <div class=\"card mode-card h-100\" onclick=\"showMode('ai-discussion')\" id=\"ai-discussion-mode-card\">\n");
            html.append("                    <div class=\"card-body text-center\">\n");
            html.append("                        <h6>AI Chat</h6>\n");
            html.append("                        <small class=\"text-muted\">Multi-AI Discussion</small>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            
            // AI Assistant
            html.append("            <div class=\"col-lg-2 col-md-4\">\n");
            html.append("                <div class=\"card mode-card h-100\" onclick=\"showMode('ai-assistant')\" id=\"ai-assistant-mode-card\">\n");
            html.append("                    <div class=\"card-body text-center\">\n");
            html.append("                        <h6>AI Assistant</h6>\n");
            html.append("                        <small class=\"text-muted\">Smart Analytics</small>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            
            // Visual Search
            html.append("            <div class=\"col-lg-2 col-md-4\">\n");
            html.append("                <div class=\"card mode-card h-100\" onclick=\"showMode('visual-search')\" id=\"visual-search-mode-card\">\n");
            html.append("                    <div class=\"card-body text-center\">\n");
            html.append("                        <h6>Visual Search</h6>\n");
            html.append("                        <small class=\"text-muted\">Neural Vision</small>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            
            // Neural Network
            html.append("            <div class=\"col-lg-2 col-md-4\">\n");
            html.append("                <div class=\"card mode-card h-100\" onclick=\"showMode('neural-network')\" id=\"neural-network-mode-card\">\n");
            html.append("                    <div class=\"card-body text-center\">\n");
            html.append("                        <h6>Neural Net</h6>\n");
            html.append("                        <small class=\"text-muted\">AI Database</small>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            
            html.append("        </div>\n");
            html.append("    </div>\n");
            html.append("</div>\n");
        }
        
        private void appendBuyerInterface(StringBuilder html) {
            html.append("<div id=\"buyer-content\" class=\"content-area\">\n");
            html.append("    <div class=\"row\">\n");
            html.append("        <div class=\"col-lg-8\">\n");
            html.append("            <div class=\"card\">\n");
            html.append("                <div class=\"card-header gradient-bg text-white\">\n");
            html.append("                    <h5 class=\"mb-0\"><i class=\"fas fa-comments me-2\"></i>ChatGPT Smart Search</h5>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"mb-3\">\n");
            html.append("                        <label class=\"form-label\">What are you looking for?</label>\n");
            html.append("                        <div class=\"input-group\">\n");
            html.append("                            <input type=\"text\" class=\"form-control\" id=\"chatgpt-search\" placeholder=\"e.g., 'vintage leather jacket under $100, size medium'\">\n");
            html.append("                            <button class=\"btn btn-primary\" onclick=\"performChatGPTSearch()\">\n");
            html.append("                                <i class=\"fas fa-magic me-1\"></i>AI Search\n");
            html.append("                            </button>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"row\">\n");
            html.append("                        <div class=\"col-md-6\">\n");
            html.append("                            <label class=\"form-label\">Budget Range</label>\n");
            html.append("                            <div class=\"input-group input-group-sm\">\n");
            html.append("                                <span class=\"input-group-text\">$</span>\n");
            html.append("                                <input type=\"number\" class=\"form-control\" id=\"min-budget\" placeholder=\"Min\" value=\"10\">\n");
            html.append("                                <span class=\"input-group-text\">-</span>\n");
            html.append("                                <span class=\"input-group-text\">$</span>\n");
            html.append("                                <input type=\"number\" class=\"form-control\" id=\"max-budget\" placeholder=\"Max\" value=\"500\">\n");
            html.append("                            </div>\n");
            html.append("                        </div>\n");
            html.append("                        <div class=\"col-md-6\">\n");
            html.append("                            <label class=\"form-label\">Distance</label>\n");
            html.append("                            <select class=\"form-select form-select-sm\" id=\"search-radius\">\n");
            html.append("                                <option value=\"5\">Within 5 miles</option>\n");
            html.append("                                <option value=\"15\" selected>Within 15 miles</option>\n");
            html.append("                                <option value=\"50\">Within 50 miles</option>\n");
            html.append("                                <option value=\"0\">Nationwide</option>\n");
            html.append("                            </select>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("            \n");
            html.append("            <!-- Search Results -->\n");
            html.append("            <div class=\"card mt-3\" id=\"search-results-card\" style=\"display: none;\">\n");
            html.append("                <div class=\"card-header\">\n");
            html.append("                    <h5 class=\"mb-0\"><i class=\"fas fa-list me-2\"></i>Search Results</h5>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\" id=\"search-results\"></div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            
            html.append("        <div class=\"col-lg-4\">\n");
            html.append("            <div class=\"card\">\n");
            html.append("                <div class=\"card-header\">\n");
            html.append("                    <h6 class=\"mb-0\"><i class=\"fas fa-lightbulb me-2\"></i>Smart Suggestions</h6>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"d-grid gap-2\">\n");
            html.append("                        <button class=\"btn btn-outline-primary btn-sm\" onclick=\"quickSearch('vintage denim jacket')\">\n");
            html.append("                            👕 Vintage Denim Jacket\n");
            html.append("                        </button>\n");
            html.append("                        <button class=\"btn btn-outline-success btn-sm\" onclick=\"quickSearch('nike air jordans')\">\n");
            html.append("                            👟 Nike Air Jordans\n");
            html.append("                        </button>\n");
            html.append("                        <button class=\"btn btn-outline-info btn-sm\" onclick=\"quickSearch('designer handbag')\">\n");
            html.append("                            👜 Designer Handbag\n");
            html.append("                        </button>\n");
            html.append("                        <button class=\"btn btn-outline-warning btn-sm\" onclick=\"quickSearch('apple macbook pro')\">\n");
            html.append("                            💻 Apple MacBook Pro\n");
            html.append("                        </button>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            html.append("    </div>\n");
            html.append("</div>\n");
        }
        
        private void appendSellerInterface(StringBuilder html) {
            html.append("<div id=\"seller-content\" class=\"content-area\">\n");
            html.append("    <div class=\"row\">\n");
            html.append("        <div class=\"col-lg-8\">\n");
            html.append("            <div class=\"card\">\n");
            html.append("                <div class=\"card-header gradient-bg text-white\">\n");
            html.append("                    <h5 class=\"mb-0\"><i class=\"fas fa-upload me-2\"></i>List Your Item</h5>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"row\">\n");
            html.append("                        <div class=\"col-md-6\">\n");
            html.append("                            <div class=\"mb-3\">\n");
            html.append("                                <label class=\"form-label\">Item Name</label>\n");
            html.append("                                <input type=\"text\" class=\"form-control\" id=\"item-name\" placeholder=\"e.g., Vintage Levi's 501 Jeans\">\n");
            html.append("                            </div>\n");
            html.append("                            <div class=\"mb-3\">\n");
            html.append("                                <label class=\"form-label\">Category</label>\n");
            html.append("                                <select class=\"form-select\" id=\"item-category\">\n");
            html.append("                                    <option>👕 Clothing</option>\n");
            html.append("                                    <option>👟 Shoes</option>\n");
            html.append("                                    <option>👜 Accessories</option>\n");
            html.append("                                    <option>📱 Electronics</option>\n");
            html.append("                                    <option>🏠 Home & Garden</option>\n");
            html.append("                                    <option>📚 Books & Media</option>\n");
            html.append("                                </select>\n");
            html.append("                            </div>\n");
            html.append("                            <div class=\"mb-3\">\n");
            html.append("                                <label class=\"form-label\">Condition</label>\n");
            html.append("                                <select class=\"form-select\" id=\"item-condition\">\n");
            html.append("                                    <option>New with Tags</option>\n");
            html.append("                                    <option>Like New</option>\n");
            html.append("                                    <option>Very Good</option>\n");
            html.append("                                    <option>Good</option>\n");
            html.append("                                    <option>Fair</option>\n");
            html.append("                                </select>\n");
            html.append("                            </div>\n");
            html.append("                        </div>\n");
            html.append("                        <div class=\"col-md-6\">\n");
            html.append("                            <div class=\"mb-3\">\n");
            html.append("                                <label class=\"form-label\">Brand</label>\n");
            html.append("                                <input type=\"text\" class=\"form-control\" id=\"item-brand\" placeholder=\"e.g., Levi's\">\n");
            html.append("                            </div>\n");
            html.append("                            <div class=\"mb-3\">\n");
            html.append("                                <label class=\"form-label\">Size</label>\n");
            html.append("                                <input type=\"text\" class=\"form-control\" id=\"item-size\" placeholder=\"e.g., Medium, 32x34\">\n");
            html.append("                            </div>\n");
            html.append("                            <div class=\"mb-3\">\n");
            html.append("                                <label class=\"form-label\">Your Asking Price ($)</label>\n");
            html.append("                                <div class=\"input-group\">\n");
            html.append("                                    <span class=\"input-group-text\">$</span>\n");
            html.append("                                    <input type=\"number\" class=\"form-control\" id=\"asking-price\" placeholder=\"0.00\">\n");
            html.append("                                    <button class=\"btn btn-outline-secondary\" onclick=\"performAIPricing()\">\n");
            html.append("                                        <i class=\"fas fa-robot me-1\"></i>AI Price\n");
            html.append("                                    </button>\n");
            html.append("                                </div>\n");
            html.append("                            </div>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"mb-3\">\n");
            html.append("                        <label class=\"form-label\">Description</label>\n");
            html.append("                        <textarea class=\"form-control\" id=\"item-description\" rows=\"3\" placeholder=\"Describe your item...\"></textarea>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"d-grid\">\n");
            html.append("                        <button class=\"btn btn-success\" onclick=\"listItem()\">\n");
            html.append("                            <i class=\"fas fa-plus me-2\"></i>List Item with AI Pricing\n");
            html.append("                        </button>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            
            html.append("        <div class=\"col-lg-4\">\n");
            html.append("            <!-- AI Pricing Results -->\n");
            html.append("            <div class=\"card\" id=\"pricing-results\" style=\"display: none;\">\n");
            html.append("                <div class=\"card-header price-comparison text-white\">\n");
            html.append("                    <h6 class=\"mb-0\"><i class=\"fas fa-chart-line me-2\"></i>AI Pricing Analysis</h6>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\" id=\"pricing-content\"></div>\n");
            html.append("            </div>\n");
            
            html.append("            <!-- Thrift Store Integration -->\n");
            html.append("            <div class=\"card mt-3\">\n");
            html.append("                <div class=\"card-header\">\n");
            html.append("                    <h6 class=\"mb-0\"><i class=\"fas fa-store me-2\"></i>Partner Stores</h6>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"list-group list-group-flush\">\n");
            html.append("                        <div class=\"list-group-item d-flex align-items-center\">\n");
            html.append("                            <i class=\"fas fa-check-circle text-success me-2\"></i>\n");
            html.append("                            <small>Goodwill - Connected</small>\n");
            html.append("                        </div>\n");
            html.append("                        <div class=\"list-group-item d-flex align-items-center\">\n");
            html.append("                            <i class=\"fas fa-check-circle text-success me-2\"></i>\n");
            html.append("                            <small>Salvation Army - Connected</small>\n");
            html.append("                        </div>\n");
            html.append("                        <div class=\"list-group-item d-flex align-items-center\">\n");
            html.append("                            <i class=\"fas fa-plus-circle text-primary me-2\"></i>\n");
            html.append("                            <small>Local Consignment Shops</small>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            html.append("    </div>\n");
            html.append("</div>\n");
        }
        
        private void appendAIDiscussion(StringBuilder html) {
            html.append("<div id=\"ai-discussion-content\" class=\"content-area\">\n");
            html.append("    <div class=\"row\">\n");
            html.append("        <div class=\"col-lg-8\">\n");
            html.append("            <div class=\"card\">\n");
            html.append("                <div class=\"card-header bg-dark text-white d-flex justify-content-between align-items-center\" style=\"border-bottom: 1px solid var(--border-color);\">\n");
            html.append("                    <h5 class=\"mb-0\"><i class=\"fas fa-comments me-2\"></i>AI Discussion Hub</h5>\n");
            html.append("                    <div class=\"d-flex align-items-center\">\n");
            html.append("                        <select class=\"form-select form-select-sm me-2\" id=\"ai-provider-select\" style=\"width: 120px;\">\n");
            html.append("                            <option value=\"chatgpt\">ChatGPT</option>\n");
            html.append("                            <option value=\"claude\">Claude</option>\n");
            html.append("                            <option value=\"ollama\">Ollama</option>\n");
            html.append("                        </select>\n");
            html.append("                        <div class=\"form-check form-switch text-white\">\n");
            html.append("                            <input class=\"form-check-input\" type=\"checkbox\" id=\"multi-ai-mode\">\n");
            html.append("                            <label class=\"form-check-label\" for=\"multi-ai-mode\">Multi-AI</label>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body p-0\">\n");
            html.append("                    <div class=\"chat-container\" id=\"ai-chat-container\">\n");
            html.append("                        <div class=\"chat-message ai\">\n");
            html.append("                            <div class=\"d-flex align-items-center mb-2\">\n");
            html.append("                                <i class=\"fas fa-robot me-2\" style=\"color: var(--accent-primary);\"></i>\n");
            html.append("                                <span class=\"ai-provider chatgpt\">ChatGPT</span>\n");
            html.append("                            </div>\n");
            html.append("                            Hello! I'm your AI assistant for ThriftAI. I can help you with product searches, price analysis, market trends, and general thrift shopping advice. What would you like to discuss?\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"p-3 border-top\">\n");
            html.append("                        <div class=\"input-group\">\n");
            html.append("                            <input type=\"text\" class=\"form-control chat-input\" id=\"ai-chat-input\" placeholder=\"Ask me about thrift shopping, pricing, or market trends...\">\n");
            html.append("                            <button class=\"btn btn-primary\" type=\"button\" onclick=\"sendAIMessage()\">\n");
            html.append("                                <i class=\"fas fa-paper-plane\"></i>\n");
            html.append("                            </button>\n");
            html.append("                        </div>\n");
            html.append("                        <small class=\"text-muted mt-2 d-block\">Press Enter to send • Use @ to switch AI providers (@chatgpt, @claude, @ollama)</small>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            
            html.append("        <div class=\"col-lg-4\">\n");
            html.append("            <!-- AI Provider Status -->\n");
            html.append("            <div class=\"card mb-3\">\n");
            html.append("                <div class=\"card-header\">\n");
            html.append("                    <h6 class=\"mb-0\"><i class=\"fas fa-network-wired me-2\"></i>AI Providers Status</h6>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"d-flex align-items-center mb-2\">\n");
            html.append("                        <span class=\"ai-provider chatgpt me-2\">ChatGPT</span>\n");
            html.append("                        <i class=\"fas fa-circle text-success\" style=\"font-size: 0.6em;\"></i>\n");
            html.append("                        <small class=\"text-muted ms-2\">Ready</small>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"d-flex align-items-center mb-2\">\n");
            html.append("                        <span class=\"ai-provider claude me-2\">Claude</span>\n");
            html.append("                        <i class=\"fas fa-circle text-success\" style=\"font-size: 0.6em;\"></i>\n");
            html.append("                        <small class=\"text-muted ms-2\">Ready</small>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"d-flex align-items-center\">\n");
            html.append("                        <span class=\"ai-provider ollama me-2\">Ollama</span>\n");
            html.append("                        <i class=\"fas fa-circle text-warning\" style=\"font-size: 0.6em;\"></i>\n");
            html.append("                        <small class=\"text-muted ms-2\">Local</small>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            
            // Quick AI Actions
            html.append("            <div class=\"card\">\n");
            html.append("                <div class=\"card-header\">\n");
            html.append("                    <h6 class=\"mb-0\"><i class=\"fas fa-zap me-2\"></i>Quick AI Actions</h6>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"d-grid gap-2\">\n");
            html.append("                        <button class=\"btn btn-outline-primary btn-sm\" onclick=\"quickAIQuery('market trends')\">\n");
            html.append("                            📈 Market Trends\n");
            html.append("                        </button>\n");
            html.append("                        <button class=\"btn btn-outline-success btn-sm\" onclick=\"quickAIQuery('price this item')\">\n");
            html.append("                            💰 Price Analysis\n");
            html.append("                        </button>\n");
            html.append("                        <button class=\"btn btn-outline-info btn-sm\" onclick=\"quickAIQuery('best deals today')\">\n");
            html.append("                            🎯 Best Deals\n");
            html.append("                        </button>\n");
            html.append("                        <button class=\"btn btn-outline-warning btn-sm\" onclick=\"quickAIQuery('thrift store tips')\">\n");
            html.append("                            💡 Thrift Tips\n");
            html.append("                        </button>\n");
            html.append("                        <button class=\"btn btn-outline-danger btn-sm\" onclick=\"clearChat()\">\n");
            html.append("                            🗑️ Clear Chat\n");
            html.append("                        </button>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            html.append("    </div>\n");
            html.append("</div>\n");
        }
        
        private void appendAIAssistant(StringBuilder html) {
            html.append("<div id=\"ai-assistant-content\" class=\"content-area\">\n");
            html.append("    <div class=\"card\">\n");
            html.append("        <div class=\"card-header gradient-bg text-white\">\n");
            html.append("            <h5 class=\"mb-0\"><i class=\"fas fa-robot me-2\"></i>AI Shopping Assistant</h5>\n");
            html.append("        </div>\n");
            html.append("        <div class=\"card-body\">\n");
            html.append("            <div class=\"text-center py-4\">\n");
            html.append("                <i class=\"fas fa-brain fa-5x text-primary mb-3\"></i>\n");
            html.append("                <h4>Your Personal AI Shopping Advisor</h4>\n");
            html.append("                <p class=\"text-muted\">Get personalized recommendations, market insights, and smart shopping advice.</p>\n");
            html.append("                <div class=\"row mt-4\">\n");
            html.append("                    <div class=\"col-md-4\">\n");
            html.append("                        <div class=\"card border-primary\">\n");
            html.append("                            <div class=\"card-body text-center\">\n");
            html.append("                                <i class=\"fas fa-chart-trending-up fa-2x text-primary mb-2\"></i>\n");
            html.append("                                <h6>Market Analysis</h6>\n");
            html.append("                                <small class=\"text-muted\">Real-time pricing trends</small>\n");
            html.append("                            </div>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"col-md-4\">\n");
            html.append("                        <div class=\"card border-success\">\n");
            html.append("                            <div class=\"card-body text-center\">\n");
            html.append("                                <i class=\"fas fa-star fa-2x text-success mb-2\"></i>\n");
            html.append("                                <h6>Quality Scoring</h6>\n");
            html.append("                                <small class=\"text-muted\">AI-powered item evaluation</small>\n");
            html.append("                            </div>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"col-md-4\">\n");
            html.append("                        <div class=\"card border-info\">\n");
            html.append("                            <div class=\"card-body text-center\">\n");
            html.append("                                <i class=\"fas fa-lightbulb fa-2x text-info mb-2\"></i>\n");
            html.append("                                <h6>Smart Recommendations</h6>\n");
            html.append("                                <small class=\"text-muted\">Personalized suggestions</small>\n");
            html.append("                            </div>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            html.append("    </div>\n");
            html.append("</div>\n");
        }
        
        private void appendVisualSearch(StringBuilder html) {
            html.append("<div id=\"visual-search-content\" class=\"content-area\">\n");
            html.append("    <div class=\"row\">\n");
            html.append("        <div class=\"col-lg-6\">\n");
            html.append("            <div class=\"card\">\n");
            html.append("                <div class=\"card-header gradient-bg text-white\">\n");
            html.append("                    <h5 class=\"mb-0\"><i class=\"fas fa-camera me-2\"></i>Visual Search</h5>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"upload-zone text-center p-4 rounded\" id=\"visual-upload-zone\">\n");
            html.append("                        <i class=\"fas fa-cloud-upload-alt fa-3x text-primary mb-3\"></i>\n");
            html.append("                        <h5>Upload an Image</h5>\n");
            html.append("                        <p class=\"text-muted\">Drag & drop an image or click to browse</p>\n");
            html.append("                        <input type=\"file\" class=\"form-control d-none\" id=\"image-upload\" accept=\"image/*\">\n");
            html.append("                        <button class=\"btn btn-primary\" onclick=\"document.getElementById('image-upload').click()\">\n");
            html.append("                            <i class=\"fas fa-upload me-1\"></i>Choose Image\n");
            html.append("                        </button>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"mt-3\" id=\"image-preview\" style=\"display: none;\">\n");
            html.append("                        <img id=\"preview-img\" class=\"img-fluid rounded\" alt=\"Preview\">\n");
            html.append("                        <div class=\"d-grid mt-2\">\n");
            html.append("                            <button class=\"btn btn-success\" onclick=\"performVisualSearch()\">\n");
            html.append("                                <i class=\"fas fa-search me-1\"></i>Find Similar Items\n");
            html.append("                            </button>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            
            html.append("        <div class=\"col-lg-6\">\n");
            html.append("            <div class=\"card\">\n");
            html.append("                <div class=\"card-header gradient-bg text-white\">\n");
            html.append("                    <h5 class=\"mb-0\"><i class=\"fab fa-instagram me-2\"></i>Instagram Search</h5>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"mb-3\">\n");
            html.append("                        <label class=\"form-label\">Instagram Post URL</label>\n");
            html.append("                        <div class=\"input-group\">\n");
            html.append("                            <input type=\"url\" class=\"form-control\" id=\"instagram-url\" placeholder=\"https://www.instagram.com/p/...\">\n");
            html.append("                            <button class=\"btn btn-primary\" onclick=\"performInstagramSearch()\">\n");
            html.append("                                <i class=\"fab fa-instagram me-1\"></i>Search\n");
            html.append("                            </button>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"text-center text-muted\">\n");
            html.append("                        <i class=\"fab fa-instagram fa-3x mb-3\"></i>\n");
            html.append("                        <p>Find similar items from Instagram posts</p>\n");
            html.append("                        <small>Paste any Instagram post URL to find similar thrift items</small>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            html.append("    </div>\n");
            html.append("</div>\n");
        }
        
        private void appendNeuralNetwork(StringBuilder html) {
            html.append("<div id=\"neural-network-content\" class=\"content-area\">\n");
            html.append("    <div class=\"row\">\n");
            html.append("        <div class=\"col-lg-8\">\n");
            html.append("            <div class=\"card\">\n");
            html.append("                <div class=\"card-header bg-dark text-white\" style=\"border-bottom: 1px solid var(--border-color);\">\n");
            html.append("                    <h5 class=\"mb-0\"><i class=\"fas fa-brain me-2\"></i>Neural Network Database</h5>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"row\">\n");
            html.append("                        <div class=\"col-md-6\">\n");
            html.append("                            <h6 class=\"text-primary mb-3\"><i class=\"fas fa-eye me-2\"></i>Visual Search Algorithm</h6>\n");
            html.append("                            <div class=\"mb-3\">\n");
            html.append("                                <label class=\"form-label\">Algorithm Type</label>\n");
            html.append("                                <select class=\"form-select\" id=\"visual-algorithm\">\n");
            html.append("                                    <option>CNN - Convolutional Neural Network</option>\n");
            html.append("                                    <option>YOLO - Real-time Object Detection</option>\n");
            html.append("                                    <option>ResNet - Residual Networks</option>\n");
            html.append("                                    <option>VGG - Visual Geometry Group</option>\n");
            html.append("                                    <option>Custom Thrift-AI Model</option>\n");
            html.append("                                </select>\n");
            html.append("                            </div>\n");
            html.append("                            <div class=\"mb-3\">\n");
            html.append("                                <label class=\"form-label\">Training Dataset</label>\n");
            html.append("                                <div class=\"progress mb-2\">\n");
            html.append("                                    <div class=\"progress-bar bg-primary\" style=\"width: 87%\">87%</div>\n");
            html.append("                                </div>\n");
            html.append("                                <small class=\"text-muted\">2.3M images • Clothing, Accessories, Electronics</small>\n");
            html.append("                            </div>\n");
            html.append("                            <div class=\"mb-3\">\n");
            html.append("                                <label class=\"form-label\">Accuracy Metrics</label>\n");
            html.append("                                <div class=\"d-flex justify-content-between\">\n");
            html.append("                                    <span class=\"text-success\">Precision: 94.2%</span>\n");
            html.append("                                    <span class=\"text-info\">Recall: 91.8%</span>\n");
            html.append("                                    <span class=\"text-warning\">F1-Score: 93.0%</span>\n");
            html.append("                                </div>\n");
            html.append("                            </div>\n");
            html.append("                            <button class=\"btn btn-primary\" onclick=\"runNeuralAnalysis()\">\n");
            html.append("                                <i class=\"fas fa-play me-2\"></i>Run Neural Analysis\n");
            html.append("                            </button>\n");
            html.append("                        </div>\n");
            html.append("                        <div class=\"col-md-6\">\n");
            html.append("                            <h6 class=\"text-success mb-3\"><i class=\"fas fa-database me-2\"></i>AI Database Management</h6>\n");
            html.append("                            <div class=\"card bg-dark border-primary mb-3\">\n");
            html.append("                                <div class=\"card-body\">\n");
            html.append("                                    <div class=\"d-flex justify-content-between align-items-center\">\n");
            html.append("                                        <div>\n");
            html.append("                                            <h6 class=\"text-primary mb-0\">Vector Database</h6>\n");
            html.append("                                            <small class=\"text-muted\">Embeddings Storage</small>\n");
            html.append("                                        </div>\n");
            html.append("                                        <i class=\"fas fa-cube fa-2x text-primary\"></i>\n");
            html.append("                                    </div>\n");
            html.append("                                    <div class=\"mt-2\">\n");
            html.append("                                        <small class=\"text-success\">Status: Active</small>\n");
            html.append("                                        <div class=\"progress progress-sm mt-1\">\n");
            html.append("                                            <div class=\"progress-bar bg-success\" style=\"width: 76%\">76% Capacity</div>\n");
            html.append("                                        </div>\n");
            html.append("                                    </div>\n");
            html.append("                                </div>\n");
            html.append("                            </div>\n");
            html.append("                            <div class=\"card bg-dark border-info mb-3\">\n");
            html.append("                                <div class=\"card-body\">\n");
            html.append("                                    <div class=\"d-flex justify-content-between align-items-center\">\n");
            html.append("                                        <div>\n");
            html.append("                                            <h6 class=\"text-info mb-0\">Graph Database</h6>\n");
            html.append("                                            <small class=\"text-muted\">Product Relations</small>\n");
            html.append("                                        </div>\n");
            html.append("                                        <i class=\"fas fa-project-diagram fa-2x text-info\"></i>\n");
            html.append("                                    </div>\n");
            html.append("                                    <div class=\"mt-2\">\n");
            html.append("                                        <small class=\"text-info\">Status: Indexing</small>\n");
            html.append("                                        <div class=\"progress progress-sm mt-1\">\n");
            html.append("                                            <div class=\"progress-bar bg-info\" style=\"width: 43%\">43% Complete</div>\n");
            html.append("                                        </div>\n");
            html.append("                                    </div>\n");
            html.append("                                </div>\n");
            html.append("                            </div>\n");
            html.append("                            <button class=\"btn btn-success\" onclick=\"optimizeDatabase()\">\n");
            html.append("                                <i class=\"fas fa-cog me-2\"></i>Optimize Database\n");
            html.append("                            </button>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            
            html.append("        <div class=\"col-lg-4\">\n");
            // Processing stats
            html.append("            <div class=\"card mb-3\">\n");
            html.append("                <div class=\"card-header\">\n");
            html.append("                    <h6 class=\"mb-0\"><i class=\"fas fa-tachometer-alt me-2\"></i>Neural Processing</h6>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"mb-3\">\n");
            html.append("                        <div class=\"d-flex justify-content-between\">\n");
            html.append("                            <span>Images Processed</span>\n");
            html.append("                            <span class=\"text-primary fw-bold\">2,847,392</span>\n");
            html.append("                        </div>\n");
            html.append("                        <div class=\"d-flex justify-content-between\">\n");
            html.append("                            <span>Matches Found</span>\n");
            html.append("                            <span class=\"text-success fw-bold\">1,923,441</span>\n");
            html.append("                        </div>\n");
            html.append("                        <div class=\"d-flex justify-content-between\">\n");
            html.append("                            <span>Avg Processing Time</span>\n");
            html.append("                            <span class=\"text-info fw-bold\">847ms</span>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"alert alert-success border-0 py-2\">\n");
            html.append("                        <i class=\"fas fa-bolt me-1\"></i>\n");
            html.append("                        <small>GPU Acceleration: Active</small>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            
            // Algorithm controls
            html.append("            <div class=\"card\">\n");
            html.append("                <div class=\"card-header\">\n");
            html.append("                    <h6 class=\"mb-0\"><i class=\"fas fa-sliders-h me-2\"></i>Algorithm Controls</h6>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"mb-3\">\n");
            html.append("                        <label class=\"form-label\">Similarity Threshold</label>\n");
            html.append("                        <input type=\"range\" class=\"form-range\" min=\"0\" max=\"100\" value=\"75\" id=\"similarity-threshold\">\n");
            html.append("                        <div class=\"d-flex justify-content-between\">\n");
            html.append("                            <small>0%</small>\n");
            html.append("                            <small id=\"threshold-value\">75%</small>\n");
            html.append("                            <small>100%</small>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                    <div class=\"d-grid gap-2\">\n");
            html.append("                        <button class=\"btn btn-primary btn-sm\" onclick=\"trainModel()\">\n");
            html.append("                            <i class=\"fas fa-graduation-cap me-1\"></i>Train Model\n");
            html.append("                        </button>\n");
            html.append("                        <button class=\"btn btn-info btn-sm\" onclick=\"testAlgorithm()\">\n");
            html.append("                            <i class=\"fas fa-flask me-1\"></i>Test Algorithm\n");
            html.append("                        </button>\n");
            html.append("                        <button class=\"btn btn-success btn-sm\" onclick=\"deployModel()\">\n");
            html.append("                            <i class=\"fas fa-rocket me-1\"></i>Deploy Model\n");
            html.append("                        </button>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        </div>\n");
            html.append("    </div>\n");
            html.append("</div>\n");
        }
        
        private void appendModals(StringBuilder html) {
            // Simple modals for future expansion
            html.append("<!-- Additional modals would go here -->\n");
        }
        
        private void appendAdvancedScripts(StringBuilder html) {
            html.append("<script>\n");
            html.append("let currentMode = null;\n");
            html.append("\n");
            
            // Mode switching function
            html.append("function showMode(mode) {\n");
            html.append("    // Hide all content areas\n");
            html.append("    document.querySelectorAll('.content-area').forEach(area => {\n");
            html.append("        area.classList.remove('active');\n");
            html.append("    });\n");
            html.append("    \n");
            html.append("    // Remove active state from all cards\n");
            html.append("    document.querySelectorAll('.mode-card').forEach(card => {\n");
            html.append("        card.classList.remove('active');\n");
            html.append("    });\n");
            html.append("    \n");
            html.append("    // Show selected content and activate card\n");
            html.append("    document.getElementById(mode + '-content').classList.add('active');\n");
            html.append("    document.getElementById(mode + '-mode-card').classList.add('active');\n");
            html.append("    \n");
            html.append("    currentMode = mode;\n");
            html.append("    console.log('Switched to mode:', mode);\n");
            html.append("}\n");
            html.append("\n");
            
            // ChatGPT Search
            html.append("function performChatGPTSearch() {\n");
            html.append("    const query = document.getElementById('chatgpt-search').value;\n");
            html.append("    const minBudget = document.getElementById('min-budget').value;\n");
            html.append("    const maxBudget = document.getElementById('max-budget').value;\n");
            html.append("    const radius = document.getElementById('search-radius').value;\n");
            html.append("    \n");
            html.append("    if (!query.trim()) {\n");
            html.append("        alert('Please enter a search query');\n");
            html.append("        return;\n");
            html.append("    }\n");
            html.append("    \n");
            html.append("    showSearchResults('🤖 Searching with AI...');\n");
            html.append("    \n");
            html.append("    // Simulate API call\n");
            html.append("    setTimeout(() => {\n");
            html.append("        const mockResults = [\n");
            html.append("            { name: 'Vintage Leather Jacket', price: 45, store: 'Downtown Thrift', distance: '2.1 miles', quality: 'Excellent' },\n");
            html.append("            { name: 'Classic Denim Jacket', price: 25, store: 'Goodwill', distance: '5.3 miles', quality: 'Very Good' },\n");
            html.append("            { name: 'Designer Leather Jacket', price: 85, store: 'Upscale Consignment', distance: '8.7 miles', quality: 'Like New' }\n");
            html.append("        ];\n");
            html.append("        displaySearchResults(mockResults);\n");
            html.append("    }, 2000);\n");
            html.append("}\n");
            html.append("\n");
            
            // Quick Search
            html.append("function quickSearch(query) {\n");
            html.append("    document.getElementById('chatgpt-search').value = query;\n");
            html.append("    performChatGPTSearch();\n");
            html.append("}\n");
            html.append("\n");
            
            // Show Search Results
            html.append("function showSearchResults(message) {\n");
            html.append("    const resultsCard = document.getElementById('search-results-card');\n");
            html.append("    const resultsDiv = document.getElementById('search-results');\n");
            html.append("    resultsCard.style.display = 'block';\n");
            html.append("    resultsDiv.innerHTML = '<div class=\"text-center py-3\"><i class=\"fas fa-spinner fa-spin fa-2x text-primary\"></i><p class=\"mt-2\">' + message + '</p></div>';\n");
            html.append("}\n");
            html.append("\n");
            
            // Display Search Results
            html.append("function displaySearchResults(results) {\n");
            html.append("    const resultsDiv = document.getElementById('search-results');\n");
            html.append("    let html = '';\n");
            html.append("    \n");
            html.append("    results.forEach((item, index) => {\n");
            html.append("        html += `\n");
            html.append("            <div class=\"search-result-item card mb-2\">\n");
            html.append("                <div class=\"card-body\">\n");
            html.append("                    <div class=\"row align-items-center\">\n");
            html.append("                        <div class=\"col-md-6\">\n");
            html.append("                            <h6 class=\"mb-1\">${item.name}</h6>\n");
            html.append("                            <small class=\"text-muted\"><i class=\"fas fa-store me-1\"></i>${item.store} • <i class=\"fas fa-map-marker-alt me-1\"></i>${item.distance}</small>\n");
            html.append("                        </div>\n");
            html.append("                        <div class=\"col-md-3\">\n");
            html.append("                            <h5 class=\"text-success mb-0\">$${item.price}</h5>\n");
            html.append("                            <small class=\"badge bg-secondary\">${item.quality}</small>\n");
            html.append("                        </div>\n");
            html.append("                        <div class=\"col-md-3 text-end\">\n");
            html.append("                            <button class=\"btn btn-primary btn-sm\"><i class=\"fas fa-eye me-1\"></i>View</button>\n");
            html.append("                        </div>\n");
            html.append("                    </div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("        `;\n");
            html.append("    });\n");
            html.append("    \n");
            html.append("    resultsDiv.innerHTML = html;\n");
            html.append("}\n");
            html.append("\n");
            
            // AI Pricing
            html.append("function performAIPricing() {\n");
            html.append("    const itemName = document.getElementById('item-name').value;\n");
            html.append("    const brand = document.getElementById('item-brand').value;\n");
            html.append("    const condition = document.getElementById('item-condition').value;\n");
            html.append("    \n");
            html.append("    if (!itemName.trim()) {\n");
            html.append("        alert('Please enter an item name first');\n");
            html.append("        return;\n");
            html.append("    }\n");
            html.append("    \n");
            html.append("    const pricingCard = document.getElementById('pricing-results');\n");
            html.append("    const pricingContent = document.getElementById('pricing-content');\n");
            html.append("    pricingCard.style.display = 'block';\n");
            html.append("    pricingContent.innerHTML = '<div class=\"text-center py-3\"><i class=\"fas fa-spinner fa-spin fa-2x text-white\"></i><p class=\"mt-2 text-white\">Analyzing market data...</p></div>';\n");
            html.append("    \n");
            html.append("    // Simulate AI pricing analysis\n");
            html.append("    setTimeout(() => {\n");
            html.append("        const mockPricing = {\n");
            html.append("            suggested: 35,\n");
            html.append("            market_low: 20,\n");
            html.append("            market_high: 55,\n");
            html.append("            amazon_price: 89,\n");
            html.append("            demand: 'High'\n");
            html.append("        };\n");
            html.append("        \n");
            html.append("        pricingContent.innerHTML = `\n");
            html.append("            <div class=\"text-center mb-3\">\n");
            html.append("                <h4 class=\"text-primary\">$${mockPricing.suggested}</h4>\n");
            html.append("                <small class=\"text-muted\">AI Suggested Price</small>\n");
            html.append("            </div>\n");
            html.append("            <div class=\"row text-center\">\n");
            html.append("                <div class=\"col-6\">\n");
            html.append("                    <small class=\"text-muted\">Market Range</small>\n");
            html.append("                    <div>$${mockPricing.market_low} - $${mockPricing.market_high}</div>\n");
            html.append("                </div>\n");
            html.append("                <div class=\"col-6\">\n");
            html.append("                    <small class=\"text-muted\">Amazon Price</small>\n");
            html.append("                    <div>$${mockPricing.amazon_price}</div>\n");
            html.append("                </div>\n");
            html.append("            </div>\n");
            html.append("            <div class=\"mt-3 text-center\">\n");
            html.append("                <span class=\"badge bg-success\">Demand: ${mockPricing.demand}</span>\n");
            html.append("            </div>\n");
            html.append("        `;\n");
            html.append("        \n");
            html.append("        document.getElementById('asking-price').value = mockPricing.suggested;\n");
            html.append("    }, 3000);\n");
            html.append("}\n");
            html.append("\n");
            
            // List Item
            html.append("function listItem() {\n");
            html.append("    const itemName = document.getElementById('item-name').value;\n");
            html.append("    const price = document.getElementById('asking-price').value;\n");
            html.append("    \n");
            html.append("    if (!itemName.trim() || !price) {\n");
            html.append("        alert('Please fill in item name and price');\n");
            html.append("        return;\n");
            html.append("    }\n");
            html.append("    \n");
            html.append("    alert(`✅ ${itemName} listed for $${price}!\\n\\nYour item will appear in:\\n• Local thrift store network\\n• ThriftAI marketplace\\n• Partner consignment shops`);\n");
            html.append("}\n");
            html.append("\n");
            
            // Visual Search
            html.append("function performVisualSearch() {\n");
            html.append("    alert('🔍 Visual search initiated!\\n\\nWe\\'re analyzing your image and finding similar items in thrift stores near you...');\n");
            html.append("}\n");
            html.append("\n");
            
            // Instagram Search
            html.append("function performInstagramSearch() {\n");
            html.append("    const url = document.getElementById('instagram-url').value;\n");
            html.append("    \n");
            html.append("    if (!url.trim() || !url.includes('instagram.com')) {\n");
            html.append("        alert('Please enter a valid Instagram URL');\n");
            html.append("        return;\n");
            html.append("    }\n");
            html.append("    \n");
            html.append("    alert('📸 Instagram search started!\\n\\nExtracting style elements from the post and finding matching thrift items...');\n");
            html.append("}\n");
            html.append("\n");
            
            // Image upload handling
            html.append("document.getElementById('image-upload').addEventListener('change', function(e) {\n");
            html.append("    const file = e.target.files[0];\n");
            html.append("    if (file) {\n");
            html.append("        const reader = new FileReader();\n");
            html.append("        reader.onload = function(e) {\n");
            html.append("            document.getElementById('preview-img').src = e.target.result;\n");
            html.append("            document.getElementById('image-preview').style.display = 'block';\n");
            html.append("        };\n");
            html.append("        reader.readAsDataURL(file);\n");
            html.append("    }\n");
            html.append("});\n");
            html.append("\n");
            
            // AI Discussion Functions
            html.append("function sendAIMessage() {\n");
            html.append("    const input = document.getElementById('ai-chat-input');\n");
            html.append("    const message = input.value.trim();\n");
            html.append("    \n");
            html.append("    if (!message) return;\n");
            html.append("    \n");
            html.append("    // Add user message to chat\n");
            html.append("    addChatMessage(message, 'user');\n");
            html.append("    input.value = '';\n");
            html.append("    \n");
            html.append("    // Show AI thinking indicator\n");
            html.append("    showAIThinking();\n");
            html.append("    \n");
            html.append("    // Simulate AI response\n");
            html.append("    setTimeout(() => {\n");
            html.append("        const aiProvider = document.getElementById('ai-provider-select').value;\n");
            html.append("        const response = generateAIResponse(message, aiProvider);\n");
            html.append("        addChatMessage(response, 'ai', aiProvider);\n");
            html.append("        hideAIThinking();\n");
            html.append("    }, 2000);\n");
            html.append("}\n");
            html.append("\n");
            
            html.append("function addChatMessage(message, type, provider = 'chatgpt') {\n");
            html.append("    const container = document.getElementById('ai-chat-container');\n");
            html.append("    const messageDiv = document.createElement('div');\n");
            html.append("    messageDiv.className = `chat-message ${type}`;\n");
            html.append("    \n");
            html.append("    if (type === 'ai') {\n");
            html.append("        messageDiv.innerHTML = `\n");
            html.append("            <div class='d-flex align-items-center mb-2'>\n");
            html.append("                <i class='fas fa-robot me-2' style='color: var(--accent-primary);'></i>\n");
            html.append("                <span class='ai-provider ${provider}'>${provider.charAt(0).toUpperCase() + provider.slice(1)}</span>\n");
            html.append("            </div>\n");
            html.append("            ${message}\n");
            html.append("        `;\n");
            html.append("    } else {\n");
            html.append("        messageDiv.innerHTML = message;\n");
            html.append("    }\n");
            html.append("    \n");
            html.append("    container.appendChild(messageDiv);\n");
            html.append("    container.scrollTop = container.scrollHeight;\n");
            html.append("}\n");
            html.append("\n");
            
            html.append("function generateAIResponse(message, provider) {\n");
            html.append("    const responses = {\n");
            html.append("        'market trends': 'Based on current thrift market data, vintage items are trending up 23% this month. Denim jackets and retro electronics are particularly popular.',\n");
            html.append("        'price this item': 'To provide accurate pricing, I\\'d need to analyze the item\\'s condition, brand, rarity, and current market demand. Can you provide more details?',\n");
            html.append("        'best deals today': 'Here are today\\'s top deals: Vintage Levi\\'s jacket ($45, was $89), iPhone 12 ($299, was $399), Designer handbag ($125, was $280).',\n");
            html.append("        'thrift store tips': '1. Visit on weekdays for better selection 2. Check for quality over brand 3. Inspect for damages 4. Know your measurements 5. Be patient and persistent!'\n");
            html.append("    };\n");
            html.append("    \n");
            html.append("    const key = Object.keys(responses).find(k => message.toLowerCase().includes(k));\n");
            html.append("    return key ? responses[key] : `I understand you\\'re asking about \"${message}\". As your ${provider.toUpperCase()} assistant, I\\'m here to help with thrift shopping, pricing analysis, and market insights. What specific aspect would you like to explore?`;\n");
            html.append("}\n");
            html.append("\n");
            
            html.append("function quickAIQuery(query) {\n");
            html.append("    document.getElementById('ai-chat-input').value = query;\n");
            html.append("    sendAIMessage();\n");
            html.append("}\n");
            html.append("\n");
            
            html.append("function clearChat() {\n");
            html.append("    const container = document.getElementById('ai-chat-container');\n");
            html.append("    container.innerHTML = `\n");
            html.append("        <div class='chat-message ai'>\n");
            html.append("            <div class='d-flex align-items-center mb-2'>\n");
            html.append("                <i class='fas fa-robot me-2' style='color: var(--accent-primary);'></i>\n");
            html.append("                <span class='ai-provider chatgpt'>ChatGPT</span>\n");
            html.append("            </div>\n");
            html.append("            Chat cleared! I'm ready to help with your thrift shopping questions.\n");
            html.append("        </div>\n");
            html.append("    `;\n");
            html.append("}\n");
            html.append("\n");
            
            html.append("function showAIThinking() {\n");
            html.append("    const container = document.getElementById('ai-chat-container');\n");
            html.append("    const thinkingDiv = document.createElement('div');\n");
            html.append("    thinkingDiv.className = 'chat-message ai ai-thinking';\n");
            html.append("    thinkingDiv.id = 'thinking-indicator';\n");
            html.append("    thinkingDiv.innerHTML = `\n");
            html.append("        <div class='d-flex align-items-center'>\n");
            html.append("            <span class='typing-indicator'></span>\n");
            html.append("            <span class='typing-indicator'></span>\n");
            html.append("            <span class='typing-indicator'></span>\n");
            html.append("            <span class='ms-2'>Thinking...</span>\n");
            html.append("        </div>\n");
            html.append("    `;\n");
            html.append("    container.appendChild(thinkingDiv);\n");
            html.append("    container.scrollTop = container.scrollHeight;\n");
            html.append("}\n");
            html.append("\n");
            
            html.append("function hideAIThinking() {\n");
            html.append("    const thinking = document.getElementById('thinking-indicator');\n");
            html.append("    if (thinking) thinking.remove();\n");
            html.append("}\n");
            html.append("\n");
            
            // Neural Network Functions
            html.append("function runNeuralAnalysis() {\n");
            html.append("    alert('🧠 Neural analysis initiated!\\n\\nRunning deep learning algorithms on product database...\\n\\nAlgorithm: CNN\\nDataset: 2.3M images\\nAccuracy: 94.2%\\n\\nThis will analyze visual patterns and generate embeddings for enhanced search.');\n");
            html.append("}\n");
            html.append("\n");
            
            html.append("function optimizeDatabase() {\n");
            html.append("    alert('🔧 Database optimization started!\\n\\n• Rebuilding vector indices\\n• Cleaning unused embeddings\\n• Optimizing query performance\\n• Updating similarity matrices\\n\\nEstimated completion: 15 minutes');\n");
            html.append("}\n");
            html.append("\n");
            
            html.append("function trainModel() {\n");
            html.append("    alert('🎓 Model training initiated!\\n\\n• Loading new training data\\n• Adjusting neural network weights\\n• Validation testing\\n• Performance optimization\\n\\nTraining will continue in background...');\n");
            html.append("}\n");
            html.append("\n");
            
            html.append("function testAlgorithm() {\n");
            html.append("    alert('🧪 Algorithm testing started!\\n\\n• Running test queries\\n• Measuring accuracy\\n• Performance benchmarking\\n• Generating test report\\n\\nResults will be available shortly.');\n");
            html.append("}\n");
            html.append("\n");
            
            html.append("function deployModel() {\n");
            html.append("    alert('🚀 Model deployment initiated!\\n\\n• Packaging trained model\\n• Updating production endpoints\\n• Rolling out to search engine\\n• Monitoring performance\\n\\nDeployment successful!');\n");
            html.append("}\n");
            html.append("\n");
            
            // Enhanced chat input handling
            html.append("document.addEventListener('keydown', function(e) {\n");
            html.append("    if (e.target.id === 'ai-chat-input' && e.key === 'Enter') {\n");
            html.append("        e.preventDefault();\n");
            html.append("        sendAIMessage();\n");
            html.append("    }\n");
            html.append("});\n");
            html.append("\n");
            
            // Threshold slider update
            html.append("document.addEventListener('input', function(e) {\n");
            html.append("    if (e.target.id === 'similarity-threshold') {\n");
            html.append("        document.getElementById('threshold-value').textContent = e.target.value + '%';\n");
            html.append("    }\n");
            html.append("});\n");
            html.append("\n");
            
            // Initialize with buyer mode
            html.append("// Initialize with buyer mode on load\n");
            html.append("document.addEventListener('DOMContentLoaded', function() {\n");
            html.append("    showMode('buyer');\n");
            html.append("});\n");
            
            html.append("</script>\n");
        }
    }
    
    // ChatGPT Search API Handler
    static class ChatGPTSearchHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "ChatGPT search functionality - Ready for AI integration");
            response.put("results", Arrays.asList(
                Map.of("item", "Vintage Leather Jacket", "price", 45, "store", "Downtown Thrift"),
                Map.of("item", "Classic Denim Jacket", "price", 25, "store", "Goodwill")
            ));
            
            String jsonResponse = convertToJson(response);
            sendResponse(exchange, jsonResponse, "application/json");
        }
    }
    
    // AI Pricing Handler
    static class AIPricingHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("suggested_price", 35.00);
            response.put("market_range", Map.of("low", 20, "high", 55));
            response.put("amazon_price", 89.00);
            response.put("demand_level", "High");
            response.put("confidence", 0.85);
            
            String jsonResponse = convertToJson(response);
            sendResponse(exchange, jsonResponse, "application/json");
        }
    }
    
    // Visual Search Handler
    static class VisualSearchHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Visual search - Ready for image processing AI");
            response.put("similar_items", Arrays.asList(
                Map.of("item", "Similar Jacket", "match_confidence", 0.92),
                Map.of("item", "Style Match", "match_confidence", 0.87)
            ));
            
            String jsonResponse = convertToJson(response);
            sendResponse(exchange, jsonResponse, "application/json");
        }
    }
    
    // Instagram Search Handler
    static class InstagramSearchHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Instagram integration - Ready for style extraction");
            response.put("extracted_items", Arrays.asList("jacket", "jeans", "sneakers"));
            
            String jsonResponse = convertToJson(response);
            sendResponse(exchange, jsonResponse, "application/json");
        }
    }
    
    // Existing API handlers (simplified versions)
    static class DealsAPIHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, Object> response = new HashMap<>();
            response.put("deals", Arrays.asList(
                Map.of("item", "Vintage T-Shirt", "price", 15, "quality", "Excellent"),
                Map.of("item", "Designer Jeans", "price", 35, "quality", "Very Good")
            ));
            sendResponse(exchange, convertToJson(response), "application/json");
        }
    }
    
    static class StatsAPIHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, Object> response = new HashMap<>();
            response.put("total_items", 1234);
            response.put("active_sellers", 156);
            response.put("total_savings", 45678.90);
            sendResponse(exchange, convertToJson(response), "application/json");
        }
    }
    
    static class HealthAPIHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "healthy");
            response.put("timestamp", new Date().toString());
            response.put("features", Arrays.asList("chatgpt_search", "visual_search", "ai_pricing", "instagram_integration"));
            sendResponse(exchange, convertToJson(response), "application/json");
        }
    }
    
    static class StaticResourceHandler implements HttpHandler {
        private final String contentType;
        
        public StaticResourceHandler(String contentType) {
            this.contentType = contentType;
        }
        
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String response = "/* Static resource placeholder */";
            sendResponse(exchange, response, contentType);
        }
    }
    
    // Utility methods
    private static void sendResponse(HttpExchange exchange, String response, String contentType) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(200, response.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }
    
    private static String convertToJson(Map<String, Object> map) {
        // Simple JSON conversion for demo purposes
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) json.append(",");
            json.append("\"").append(entry.getKey()).append("\":");
            Object value = entry.getValue();
            if (value instanceof String) {
                json.append("\"").append(value).append("\"");
            } else if (value instanceof Number) {
                json.append(value);
            } else if (value instanceof List || value instanceof Map) {
                json.append("\"").append(value.toString()).append("\"");
            } else {
                json.append("\"").append(value).append("\"");
            }
            first = false;
        }
        json.append("}");
        return json.toString();
    }
}