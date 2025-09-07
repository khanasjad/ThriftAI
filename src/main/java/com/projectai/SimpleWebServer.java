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
 * Simple Web Server for ThriftAI Demo
 * This demonstrates the web interface without external dependencies
 */
public class SimpleWebServer {
    
    private HttpServer server;
    private final int port = 8080;
    
    public static void main(String[] args) {
        try {
            SimpleWebServer webServer = new SimpleWebServer();
            webServer.start();
            System.out.println("🚀 ThriftAI Web Server started successfully!");
            System.out.println("🌐 Open your browser and navigate to:");
            System.out.println("   http://localhost:8080");
            System.out.println("   http://127.0.0.1:8080");
            System.out.println();
            System.out.println("💡 Available endpoints:");
            System.out.println("   /          - Homepage");
            System.out.println("   /api/deals - AI Deals API");
            System.out.println("   /api/stats - Platform Statistics");
            System.out.println();
            System.out.println("Press Ctrl+C to stop the server...");
            
            // Keep the server running
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("\n👋 Shutting down ThriftAI Web Server...");
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
        
        // Homepage
        server.createContext("/", new HomeHandler());
        
        // API endpoints
        server.createContext("/api/deals", new DealsAPIHandler());
        server.createContext("/api/stats", new StatsAPIHandler());
        server.createContext("/api/health", new HealthAPIHandler());
        
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
    
    // Homepage Handler
    static class HomeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String response = generateHomepage();
            sendResponse(exchange, response, "text/html");
        }
        
        private String generateHomepage() {
            String htmlPart1 = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>ThriftAI - Smart Thrift Shopping</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=SF+Pro+Display:wght@300;400;500;600;700&display=swap');
                        
                        :root {
                            /* Modern AI Platform Colors */
                            --pure-white: #FFFFFF;
                            --off-white: #FEFEFE;
                            --light-gray: #F8F9FA;
                            --neutral-gray: #F1F3F4;
                            --mid-gray: #E1E5E9;
                            --cool-gray: #9AA0A6;
                            --dark-gray: #5F6368;
                            --charcoal: #202124;
                            --deep-black: #0A0A0A;
                            
                            /* AI Brand Colors - Inspired by OpenAI, Anthropic */
                            --ai-purple: #6366F1;
                            --ai-purple-light: #818CF8;
                            --ai-purple-dark: #4F46E5;
                            --ai-green: #10B981;
                            --ai-blue: #0EA5E9;
                            --ai-orange: #F59E0B;
                            
                            /* System Colors */
                            --background: var(--pure-white);
                            --surface: var(--light-gray);
                            --surface-elevated: var(--pure-white);
                            --border: var(--mid-gray);
                            --border-light: var(--neutral-gray);
                            
                            /* Text Hierarchy */
                            --text-primary: var(--deep-black);
                            --text-secondary: var(--dark-gray);
                            --text-muted: var(--cool-gray);
                            --text-on-dark: var(--pure-white);
                            --text-on-color: var(--pure-white);
                            
                            /* Interactive States */
                            --primary: var(--ai-purple);
                            --primary-hover: var(--ai-purple-dark);
                            --secondary: var(--charcoal);
                            --accent: var(--ai-green);
                            --accent-hover: #059669;
                            
                            /* Status Colors */
                            --success: var(--ai-green);
                            --warning: var(--ai-orange);
                            --error: #EF4444;
                            --info: var(--ai-blue);
                            
                            /* GenZ Gradients */
                            --gradient-primary: linear-gradient(135deg, var(--ai-purple) 0%, var(--ai-blue) 100%);
                            --gradient-accent: linear-gradient(135deg, var(--ai-green) 0%, var(--ai-blue) 100%);
                            --gradient-dark: linear-gradient(135deg, var(--charcoal) 0%, var(--deep-black) 100%);
                        }
                        
                        * {
                            -webkit-font-smoothing: antialiased;
                            -moz-osx-font-smoothing: grayscale;
                        }
                        
                        body { 
                            background: var(--background);
                            color: var(--text-primary);
                            font-family: 'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                            font-weight: 400;
                            line-height: 1.6;
                            letter-spacing: -0.01em;
                        }
                        
                        .hero-section { 
                            background: var(--gradient-dark);
                            padding: 140px 0;
                            position: relative;
                            overflow: hidden;
                        }
                        
                        .hero-section::before {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
                            pointer-events: none;
                        }
                        
                        .ai-logo {
                            font-family: 'Inter', -apple-system, sans-serif;
                            font-weight: 700;
                            font-size: 1.75rem;
                            background: var(--gradient-primary);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            position: relative;
                        }
                        
                        .ai-logo::before {
                            content: '◆';
                            position: absolute;
                            left: -30px;
                            background: var(--gradient-primary);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                        }
                        
                        .navbar {
                            background: rgba(255, 255, 255, 0.95) !important;
                            backdrop-filter: blur(20px);
                            -webkit-backdrop-filter: blur(20px);
                            border-bottom: 1px solid var(--border-light);
                            padding: 16px 0;
                            box-shadow: 0 1px 0 rgba(0,0,0,0.05);
                        }
                        
                        .navbar-brand {
                            font-weight: 700;
                            font-size: 1.5rem;
                            color: var(--text-primary) !important;
                            letter-spacing: -0.02em;
                        }
                        
                        .nav-link {
                            font-weight: 500;
                            color: var(--text-secondary) !important;
                            transition: color 0.2s ease;
                        }
                        
                        .nav-link:hover {
                            color: var(--primary) !important;
                        }
                        
                        .card { 
                            background: var(--surface-elevated);
                            border: 1px solid var(--border-light);
                            border-radius: 12px;
                            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                            overflow: hidden;
                        }
                        
                        .card:hover { 
                            transform: translateY(-4px);
                            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
                            border-color: var(--border);
                        }
                        
                        .card-header {
                            background: var(--surface) !important;
                            border-bottom: 1px solid var(--border-light);
                            font-weight: 600;
                            padding: 20px 24px;
                            color: var(--text-primary);
                        }
                        
                        .card-body {
                            padding: 24px;
                            background: var(--surface-elevated);
                        }
                        
                        .stat-card { 
                            border-radius: 16px;
                            background: var(--surface-elevated);
                            border: 1px solid var(--border-light);
                            position: relative;
                        }
                        
                        .stat-card::before {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 3px;
                            background: linear-gradient(90deg, var(--charcoal), var(--slate-gray));
                            border-radius: 16px 16px 0 0;
                        }
                        
                        .deal-card { 
                            border-left: 4px solid var(--accent);
                            background: var(--surface-elevated);
                        }
                        
                        .btn {
                            font-weight: 600;
                            border-radius: 12px;
                            padding: 12px 24px;
                            font-size: 16px;
                            transition: all 0.2s ease;
                            border: none;
                            letter-spacing: -0.01em;
                        }
                        
                        .btn-primary {
                            background: var(--accent);
                            color: var(--text-on-color);
                            border: 2px solid var(--accent);
                        }
                        
                        .btn-primary:hover {
                            background: var(--accent-hover);
                            border-color: var(--accent-hover);
                            transform: translateY(-2px);
                            box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
                        }
                        
                        .btn-outline-primary {
                            border: 2px solid var(--primary);
                            color: var(--primary);
                            background: transparent;
                        }
                        
                        .btn-outline-primary:hover {
                            background: var(--primary);
                            color: var(--text-on-dark);
                            transform: translateY(-2px);
                            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
                        }
                        
                        .btn-light {
                            background: var(--pure-white);
                            color: var(--primary);
                            border: 2px solid var(--pure-white);
                        }
                        
                        .btn-light:hover {
                            background: var(--light-gray);
                            border-color: var(--light-gray);
                            transform: translateY(-2px);
                            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                        }
                        
                        .display-4 {
                            font-weight: 700;
                            font-size: 3.5rem;
                            letter-spacing: -0.03em;
                            line-height: 1.1;
                        }
                        
                        h1, h2, h3, h4, h5, h6 {
                            font-weight: 600;
                            letter-spacing: -0.02em;
                            color: var(--text-primary);
                        }
                        
                        h2 {
                            font-size: 2.5rem;
                            font-weight: 700;
                        }
                        
                        .text-primary { color: var(--primary) !important; }
                        .text-secondary { color: var(--text-secondary) !important; }
                        .text-muted { color: var(--text-muted) !important; }
                        
                        .bg-primary { background: var(--primary) !important; }
                        .bg-success { background: var(--success) !important; }
                        .bg-info { background: var(--info) !important; }
                        .bg-warning { background: var(--warning) !important; }
                        .bg-danger { background: var(--error) !important; }
                        .bg-secondary { background: var(--secondary) !important; }
                        .bg-dark { background: var(--charcoal) !important; }
                        .bg-light { background: var(--surface) !important; }
                        
                        .badge {
                            font-weight: 600;
                            font-size: 0.75rem;
                            padding: 6px 12px;
                            border-radius: 8px;
                            letter-spacing: 0.01em;
                        }
                        
                        footer {
                            background: var(--surface) !important;
                            border-top: 1px solid var(--border-light);
                            color: var(--text-secondary);
                        }
                        
                        .lead {
                            font-size: 1.25rem;
                            font-weight: 400;
                            opacity: 0.9;
                        }
                        
                        /* Apple-style focus states */
                        .btn:focus, .form-control:focus {
                            box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
                            outline: none;
                        }
                        
                        /* Nike-inspired animations */
                        @keyframes nike-swoosh {
                            0% { transform: translateX(-100%); opacity: 0; }
                            100% { transform: translateX(0); opacity: 1; }
                        }
                        
                        .animate-swoosh {
                            animation: nike-swoosh 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
                        }
                        
                        /* Elegant hover effects */
                        .elegant-hover {
                            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                        }
                        
                        .elegant-hover:hover {
                            transform: scale(1.02);
                        }
                        
                        /* Monochromatic scrollbar */
                        ::-webkit-scrollbar {
                            width: 10px;
                        }
                        
                        ::-webkit-scrollbar-track {
                            background: var(--light-gray);
                        }
                        
                        ::-webkit-scrollbar-thumb {
                            background: var(--slate-gray);
                            border-radius: 5px;
                            border: 2px solid var(--light-gray);
                        }
                        
                        ::-webkit-scrollbar-thumb:hover {
                            background: var(--dark-gray);
                        }
                        
                        /* Sophisticated shadow system */
                        .shadow-soft {
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
                        }
                        
                        .shadow-medium {
                            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12) !important;
                        }
                        
                        .shadow-strong {
                            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.18) !important;
                        }
                        
                        .category-card {
                            cursor: pointer;
                            transition: all 0.3s ease;
                        }
                        
                        .category-card:hover {
                            transform: translateY(-8px);
                            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15) !important;
                        }
                        
                        .elegant-hover {
                            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                        }
                        
                        .elegant-hover:hover {
                            transform: translateY(-5px);
                            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
                        }
                        
                        .border-top {
                            border-color: var(--border-light) !important;
                        }
                        
                        .platform-card {
                            cursor: pointer;
                            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                            border-radius: 16px;
                        }
                        
                        .platform-card:hover {
                            transform: translateY(-8px);
                            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12) !important;
                        }
                        
                        .platform-icon {
                            transition: all 0.3s ease;
                        }
                        
                        .platform-card:hover .platform-icon {
                            transform: scale(1.1);
                        }
                        
                        .badge {
                            border-radius: 6px;
                            font-size: 0.7rem;
                            font-weight: 600;
                            letter-spacing: 0.025em;
                        }
                        
                        /* Premium spacing */
                        .container {
                            max-width: 1200px;
                        }
                        
                        .section-padding {
                            padding: 80px 0;
                        }
                    </style>
                </head>
                <body>
                    <!-- Navigation -->
                    <nav class="navbar navbar-expand-lg">
                        <div class="container">
                            <a class="navbar-brand ai-logo" href="/">
                                ThriftAI
                            </a>
                            <div class="navbar-nav ms-auto">
                                <a class="nav-link" href="/" onclick="showBuyerMode()">🛒 Buyer Mode</a>
                                <a class="nav-link" href="#" onclick="showSellerMode()">💼 Seller Mode</a>
                                <a class="nav-link" href="#" onclick="showAIAssistant()">🤖 AI Assistant</a>
                                <a class="nav-link" href="#" onclick="showVisualSearch()">📸 Visual Search</a>
                            </div>
                        </div>
                    </nav>

                    <!-- Hero Section -->
                    <div class="hero-section text-white py-5">
                        <div class="container text-center">
                            <h1 class="display-3 mb-4 text-white fw-bold" style="font-size: 3.5rem; letter-spacing: -0.02em;">
                                AI-Powered Thrift <br>
                                <span style="background: var(--gradient-accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                    Marketplace
                                </span>
                            </h1>
                            <p class="lead mb-5 text-white-50" style="font-size: 1.3rem; max-width: 600px; margin: 0 auto;">
                                Your personal AI finds the perfect thrift deals while you sell items effortlessly. 
                                <strong class="text-white">Sustainable shopping, reimagined.</strong>
                            </p>
                            <div class="row text-center mb-5">
                                <div class="col-md-6">
                                    <h5 class="text-white mb-2">💰 For Sellers</h5>
                                    <p class="text-white-50">List your thrift items and reach buyers with our AI matching system</p>
                                </div>
                                <div class="col-md-6">
                                    <h5 class="text-white mb-2">🎯 For Buyers</h5>
                                    <p class="text-white-50">Get personalized deals that match your style and budget preferences</p>
                                </div>
                            </div>
                            <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                                <button class="btn btn-primary btn-lg px-4 py-3" onclick="showBuyerPreferences()" style="border-radius: 12px; font-weight: 600;">
                                    <i class="fas fa-sparkles me-2"></i>Get AI Recommendations
                                </button>
                                <button class="btn btn-outline-light btn-lg px-4 py-3" onclick="showSellModal()" style="border-radius: 12px; font-weight: 600; border-width: 2px;">
                                    <i class="fas fa-upload me-2"></i>List Your Items
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Platform Stats -->
                    <div class="container section-padding">
                        <div class="row mb-5">
                            <div class="col-12 text-center mb-5">
                                <h2 class="text-primary mb-3">Platform Overview</h2>
                                <p class="text-muted lead">Real-time insights from our AI-powered marketplace</p>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-3">
                                <div class="card stat-card border-0 shadow-sm h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-box-open fa-3x text-primary mb-3"></i>
                                        <h3 class="fw-bold text-primary">5</h3>
                                        <p class="text-muted mb-0">Total Products</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-3">
                                <div class="card stat-card border-0 shadow-sm h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-tags fa-3x text-success mb-3"></i>
                                        <h3 class="fw-bold text-success">3</h3>
                                        <p class="text-muted mb-0">Categories</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-3">
                                <div class="card stat-card border-0 shadow-sm h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-store fa-3x text-warning mb-3"></i>
                                        <h3 class="fw-bold text-warning">3</h3>
                                        <p class="text-muted mb-0">Partner Stores</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-3">
                                <div class="card stat-card border-0 shadow-sm h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-percentage fa-3x text-danger mb-3"></i>
                                        <h3 class="fw-bold text-danger">55%</h3>
                                        <p class="text-muted mb-0">Avg Discount</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- AI Deals Section -->
                        <div class="row">
                            <div class="col-12 text-center mb-4">
                                <h2 class="fw-bold text-primary">🔥 AI-Recommended Featured Deals</h2>
                                <p class="text-muted">Powered by our intelligent deal scoring algorithm</p>
                            </div>
                        </div>

                        <div id="deals-container" class="row">
                            <div class="col-12 text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading deals...</span>
                                </div>
                                <p class="mt-3 text-muted">Loading AI-powered deals...</p>
                            </div>
                        </div>

                        <!-- Platform Integrations -->
                        <div class="row mt-5 pt-5 border-top">
                            <div class="col-12 text-center mb-5">
                                <h2 class="fw-bold text-primary">Connect All Your Platforms</h2>
                                <p class="text-muted lead">ThriftAI syncs with everywhere you already shop and sell</p>
                            </div>
                            
                            <!-- Marketplace Platforms -->
                            <div class="col-12 mb-4">
                                <h4 class="text-secondary mb-3"><i class="fas fa-store me-2"></i>Marketplace Integrations</h4>
                                <div class="row">
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('ebay')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #E53238; font-size: 2.5rem;">
                                                    <i class="fab fa-ebay"></i>
                                                </div>
                                                <h6 class="fw-bold">eBay</h6>
                                                <p class="small text-muted mb-2">Cross-list your items automatically</p>
                                                <span class="badge bg-success">AI Sync</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('mercari')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #FF6B35; font-size: 2.5rem;">
                                                    <i class="fas fa-shopping-cart"></i>
                                                </div>
                                                <h6 class="fw-bold">Mercari</h6>
                                                <p class="small text-muted mb-2">Import listings & sync inventory</p>
                                                <span class="badge bg-info">Beta</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('facebook')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #1877F2; font-size: 2.5rem;">
                                                    <i class="fab fa-facebook"></i>
                                                </div>
                                                <h6 class="fw-bold">Facebook Marketplace</h6>
                                                <p class="small text-muted mb-2">Reach local buyers instantly</p>
                                                <span class="badge bg-primary">Popular</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('offerup')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #00A651; font-size: 2.5rem;">
                                                    <i class="fas fa-mobile-alt"></i>
                                                </div>
                                                <h6 class="fw-bold">OfferUp</h6>
                                                <p class="small text-muted mb-2">Mobile-first local selling</p>
                                                <span class="badge bg-success">Live</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Social Media Platforms -->
                            <div class="col-12 mb-4">
                                <h4 class="text-secondary mb-3"><i class="fas fa-share-alt me-2"></i>Social Media & Sharing</h4>
                                <div class="row">
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('instagram')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #E4405F; font-size: 2.5rem;">
                                                    <i class="fab fa-instagram"></i>
                                                </div>
                                                <h6 class="fw-bold">Instagram</h6>
                                                <p class="small text-muted mb-2">Auto-post your best finds</p>
                                                <span class="badge bg-warning">Coming Soon</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('tiktok')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #000000; font-size: 2.5rem;">
                                                    <i class="fab fa-tiktok"></i>
                                                </div>
                                                <h6 class="fw-bold">TikTok Shop</h6>
                                                <p class="small text-muted mb-2">Viral thrift content creation</p>
                                                <span class="badge bg-dark">New</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('pinterest')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #BD081C; font-size: 2.5rem;">
                                                    <i class="fab fa-pinterest"></i>
                                                </div>
                                                <h6 class="fw-bold">Pinterest</h6>
                                                <p class="small text-muted mb-2">Style inspiration & boards</p>
                                                <span class="badge bg-danger">AI Visual</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('twitter')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #1DA1F2; font-size: 2.5rem;">
                                                    <i class="fab fa-twitter"></i>
                                                </div>
                                                <h6 class="fw-bold">Twitter/X</h6>
                                                <p class="small text-muted mb-2">Share deals & discoveries</p>
                                                <span class="badge bg-info">Auto-Tweet</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Authentication & Storage -->
                            <div class="col-12 mb-4">
                                <h4 class="text-secondary mb-3"><i class="fas fa-user-shield me-2"></i>Sign In & Storage</h4>
                                <div class="row">
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('google')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #4285F4; font-size: 2.5rem;">
                                                    <i class="fab fa-google"></i>
                                                </div>
                                                <h6 class="fw-bold">Google Account</h6>
                                                <p class="small text-muted mb-2">One-click sign in & sync</p>
                                                <span class="badge bg-primary">Secure</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('apple')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #000000; font-size: 2.5rem;">
                                                    <i class="fab fa-apple"></i>
                                                </div>
                                                <h6 class="fw-bold">Sign in with Apple</h6>
                                                <p class="small text-muted mb-2">Privacy-focused login</p>
                                                <span class="badge bg-dark">Private</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('dropbox')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #0061FF; font-size: 2.5rem;">
                                                    <i class="fab fa-dropbox"></i>
                                                </div>
                                                <h6 class="fw-bold">Dropbox</h6>
                                                <p class="small text-muted mb-2">Photo backup & sharing</p>
                                                <span class="badge bg-info">Cloud</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 mb-3">
                                        <div class="card platform-card border-0 shadow-sm h-100" onclick="connectPlatform('stripe')">
                                            <div class="card-body text-center py-4">
                                                <div class="platform-icon mb-3" style="color: #635BFF; font-size: 2.5rem;">
                                                    <i class="fab fa-stripe"></i>
                                                </div>
                                                <h6 class="fw-bold">Stripe Payments</h6>
                                                <p class="small text-muted mb-2">Secure payment processing</p>
                                                <span class="badge bg-success">Trusted</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- API Demo Section -->
                        <div class="row mt-5 pt-5 border-top">
                            <div class="col-12 text-center">
                                <h3 class="text-primary mb-4">Developer API</h3>
                                <p class="text-muted mb-4">Build on our AI-powered platform</p>
                                <div class="d-flex flex-wrap justify-content-center gap-3">
                                    <button class="btn btn-outline-primary" onclick="testAPI('/api/deals')">
                                        <i class="fas fa-database me-2"></i>Deals API
                                    </button>
                                    <button class="btn btn-outline-primary" onclick="testAPI('/api/stats')">
                                        <i class="fas fa-chart-line me-2"></i>Analytics API
                                    </button>
                                    <button class="btn btn-outline-primary" onclick="testAPI('/api/health')">
                                        <i class="fas fa-heartbeat me-2"></i>Health Check
                                    </button>
                                </div>
                                <div id="api-result" class="mt-4"></div>
                            </div>
                        </div>

                        <!-- How It Works Section -->
                        <div class="row mt-5 pt-5 border-top">
                            <div class="col-12 text-center mb-5">
                                <h2 class="fw-bold text-primary">How It Actually Works</h2>
                                <p class="text-muted lead">Dead simple. AI-powered. Actually sustainable.</p>
                            </div>
                            <div class="col-lg-4 mb-4">
                                <div class="card border-0 h-100 text-center">
                                    <div class="card-body p-4">
                                        <div class="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                                            <i class="fas fa-camera fa-2x text-white"></i>
                                        </div>
                                        <h4 class="text-primary">1. List Your Items</h4>
                                        <p class="text-muted">Take photos, add descriptions, and set your price. Our AI suggests optimal pricing based on market data.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4 mb-4">
                                <div class="card border-0 h-100 text-center">
                                    <div class="card-body p-4">
                                        <div class="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                                            <i class="fas fa-robot fa-2x text-white"></i>
                                        </div>
                                        <h4 class="text-success">2. AI Matching</h4>
                                        <p class="text-muted">Our intelligent algorithm matches your items with buyers looking for exactly what you're selling.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4 mb-4">
                                <div class="card border-0 h-100 text-center">
                                    <div class="card-body p-4">
                                        <div class="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                                            <i class="fas fa-handshake fa-2x text-white"></i>
                                        </div>
                                        <h4 class="text-warning">3. Secure Transaction</h4>
                                        <p class="text-muted">Complete your sale securely. We handle payment processing and take just 8% commission.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Categories Section -->
                        <div class="row mt-5 pt-5 border-top">
                            <div class="col-12 text-center mb-5">
                                <h2 class="fw-bold text-primary">Popular Categories</h2>
                                <p class="text-muted lead">Discover amazing deals across all categories</p>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-4">
                                <div class="card category-card border-0 shadow-sm h-100" onclick="filterByCategory('Clothing')">
                                    <div class="card-body text-center py-4">
                                        <i class="fas fa-tshirt fa-3x text-primary mb-3"></i>
                                        <h5 class="text-primary">Fashion & Clothing</h5>
                                        <p class="text-muted small mb-2">Vintage, designer, and everyday wear</p>
                                        <span class="badge bg-primary">25+ items</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-4">
                                <div class="card category-card border-0 shadow-sm h-100" onclick="filterByCategory('Electronics')">
                                    <div class="card-body text-center py-4">
                                        <i class="fas fa-laptop fa-3x text-success mb-3"></i>
                                        <h5 class="text-success">Electronics</h5>
                                        <p class="text-muted small mb-2">Phones, laptops, gaming gear</p>
                                        <span class="badge bg-success">15+ items</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-4">
                                <div class="card category-card border-0 shadow-sm h-100" onclick="filterByCategory('Home')">
                                    <div class="card-body text-center py-4">
                                        <i class="fas fa-home fa-3x text-warning mb-3"></i>
                                        <h5 class="text-warning">Home & Garden</h5>
                                        <p class="text-muted small mb-2">Furniture, decor, appliances</p>
                                        <span class="badge bg-warning">30+ items</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-4">
                                <div class="card category-card border-0 shadow-sm h-100" onclick="filterByCategory('Books')">
                                    <div class="card-body text-center py-4">
                                        <i class="fas fa-book fa-3x text-info mb-3"></i>
                                        <h5 class="text-info">Books & Media</h5>
                                        <p class="text-muted small mb-2">Books, movies, music, games</p>
                                        <span class="badge bg-info">20+ items</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Testimonials Section -->
                        <div class="row mt-5 pt-5 border-top">
                            <div class="col-12 text-center mb-5">
                                <h2 class="fw-bold text-primary">What Our Users Say</h2>
                                <p class="text-muted lead">Real stories from our ThriftAI community</p>
                            </div>
                            <div class="col-lg-4 mb-4">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-body p-4">
                                        <div class="d-flex align-items-center mb-3">
                                            <div class="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
                                                <i class="fas fa-user fa-lg text-white"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0">Sarah M.</h6>
                                                <small class="text-muted">Seller</small>
                                            </div>
                                        </div>
                                        <p class="text-muted">"I sold my vintage jacket within 2 days! The AI recommendations helped me price it perfectly. Made $120 after the small commission."</p>
                                        <div class="text-warning">
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4 mb-4">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-body p-4">
                                        <div class="d-flex align-items-center mb-3">
                                            <div class="bg-success rounded-circle d-inline-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
                                                <i class="fas fa-user fa-lg text-white"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0">Mike T.</h6>
                                                <small class="text-muted">Buyer</small>
                                            </div>
                                        </div>
                                        <p class="text-muted">"The AI found me exactly the gaming chair I wanted, 60% off retail price! The quality matching feature is incredible."</p>
                                        <div class="text-warning">
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4 mb-4">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-body p-4">
                                        <div class="d-flex align-items-center mb-3">
                                            <div class="bg-info rounded-circle d-inline-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
                                                <i class="fas fa-user fa-lg text-white"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0">Lisa K.</h6>
                                                <small class="text-muted">Power User</small>
                                            </div>
                                        </div>
                                        <p class="text-muted">"Both buying and selling here is amazing. The AI suggestions save me hours of browsing. I've made over $800 selling items I don't use!"</p>
                                        <div class="text-warning">
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Call to Action -->
                        <div class="row mt-5 pt-5 mb-5">
                            <div class="col-12">
                                <div class="card border-0 shadow-lg" style="background: var(--gradient-primary); border-radius: 20px;">
                                    <div class="card-body py-5 text-center text-white">
                                        <h2 class="fw-bold mb-3" style="font-size: 2.5rem;">Ready to upgrade your thrifting game?</h2>
                                        <p class="lead mb-4 opacity-90">Join the AI revolution in sustainable shopping. No more endless scrolling.</p>
                                        <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-4">
                                            <button class="btn btn-light btn-lg px-4 py-3" onclick="showBuyerPreferences()" style="border-radius: 12px; font-weight: 600; box-shadow: 0 4px 15px rgba(255,255,255,0.3);">
                                                <i class="fas fa-sparkles me-2"></i>Get AI Recommendations
                                            </button>
                                            <button class="btn btn-outline-light btn-lg px-4 py-3" onclick="showSellModal()" style="border-radius: 12px; font-weight: 600; border-width: 2px;">
                                                <i class="fas fa-upload me-2"></i>Start Selling
                                            </button>
                                        </div>
                                        <div class="d-flex flex-wrap justify-content-center gap-4 small opacity-75">
                                            <span><i class="fas fa-brain me-1"></i>AI-Powered</span>
                                            <span><i class="fas fa-leaf me-1"></i>Sustainable</span>
                                            <span><i class="fas fa-shield-alt me-1"></i>Secure</span>
                                            <span><i class="fas fa-zap me-1"></i>Fast</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                """;
            
            String htmlPart2 = """
                    <!-- Footer -->
                    <!-- Modals -->
                    <!-- Buyer Preferences Modal -->
                    <div class="modal fade" id="buyerPreferencesModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title"><i class="fas fa-user-cog me-2"></i>Set Your Preferences & Budget</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="buyerPreferencesForm">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <label class="form-label">Budget Range ($)</label>
                                                <div class="row">
                                                    <div class="col-6">
                                                        <input type="number" class="form-control" id="minBudget" placeholder="Min" value="10">
                                                    </div>
                                                    <div class="col-6">
                                                        <input type="number" class="form-control" id="maxBudget" placeholder="Max" value="500">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Preferred Categories</label>
                                                <div class="form-check-container">
                                                    <div class="form-check"><input class="form-check-input" type="checkbox" id="cat_clothing" checked><label class="form-check-label">👕 Clothing</label></div>
                                                    <div class="form-check"><input class="form-check-input" type="checkbox" id="cat_shoes"><label class="form-check-label">👟 Shoes</label></div>
                                                    <div class="form-check"><input class="form-check-input" type="checkbox" id="cat_electronics"><label class="form-check-label">📱 Electronics</label></div>
                                                    <div class="form-check"><input class="form-check-input" type="checkbox" id="cat_accessories"><label class="form-check-label">👜 Accessories</label></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row mt-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Preferred Brands (optional)</label>
                                                <input type="text" class="form-control" id="preferredBrands" placeholder="e.g., Nike, Levi's, Apple">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Minimum Quality</label>
                                                <select class="form-select" id="minQuality">
                                                    <option value="FAIR">Fair</option>
                                                    <option value="GOOD">Good</option>
                                                    <option value="VERY_GOOD" selected>Very Good</option>
                                                    <option value="EXCELLENT">Excellent</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="mt-3">
                                            <label class="form-label">What are you looking for? (AI will use this)</label>
                                            <textarea class="form-control" id="searchDescription" rows="3" placeholder="Describe what you're looking for, your style preferences, or any specific needs..."></textarea>
                                        </div>
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-primary" onclick="savePreferencesAndSearch()">Find My Deals</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sell Items Modal -->
                    <div class="modal fade" id="sellModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title"><i class="fas fa-plus me-2"></i>List Your Thrift Item</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="sellItemForm">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <label class="form-label">Item Name *</label>
                                                <input type="text" class="form-control" id="itemName" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Category *</label>
                                                <select class="form-select" id="itemCategory" required>
                                                    <option value="">Select category</option>
                                                    <option value="CLOTHING">👕 Clothing</option>
                                                    <option value="SHOES">👟 Shoes</option>
                                                    <option value="ELECTRONICS">📱 Electronics</option>
                                                    <option value="ACCESSORIES">👜 Accessories</option>
                                                    <option value="HOME">🏠 Home</option>
                                                    <option value="BOOKS">📚 Books</option>
                                                    <option value="SPORTS">⚽ Sports</option>
                                                    <option value="BEAUTY">💄 Beauty</option>
                                                    <option value="JEWELRY">💎 Jewelry</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="row mt-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Brand</label>
                                                <input type="text" class="form-control" id="itemBrand">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Condition *</label>
                                                <select class="form-select" id="itemCondition" required>
                                                    <option value="">Select condition</option>
                                                    <option value="EXCELLENT">Excellent</option>
                                                    <option value="VERY_GOOD">Very Good</option>
                                                    <option value="GOOD">Good</option>
                                                    <option value="FAIR">Fair</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="row mt-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Your Price ($) *</label>
                                                <input type="number" class="form-control" id="itemPrice" step="0.01" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Original Price (optional)</label>
                                                <input type="number" class="form-control" id="itemOriginalPrice" step="0.01">
                                            </div>
                                        </div>
                                        <div class="mt-3">
                                            <label class="form-label">Description</label>
                                            <textarea class="form-control" id="itemDescription" rows="3" placeholder="Describe your item, its condition, size, etc..."></textarea>
                                        </div>
                                        <div class="mt-3">
                                            <div class="alert alert-info">
                                                <i class="fas fa-info-circle me-2"></i>
                                                <strong>Commission:</strong> ThriftAI charges 8% commission on successful sales to help connect you with the right buyers through our AI system.
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-success" onclick="listItem()">List Item (8% commission)</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer class="py-5 mt-5 border-top">
                        <div class="container text-center">
                            <div class="ai-logo mb-3">ThriftAI</div>
                            <p class="text-muted mb-3">Sustainable shopping powered by artificial intelligence</p>
                            <div class="d-flex flex-wrap justify-content-center gap-4 mb-3 small text-muted">
                                <span><i class="fas fa-brain me-1 text-primary"></i>AI-Powered Matching</span>
                                <span><i class="fas fa-leaf me-1 text-success"></i>Sustainable Commerce</span>
                                <span><i class="fas fa-shield-alt me-1 text-info"></i>Secure Platform</span>
                                <span><i class="fas fa-chart-line me-1 text-warning"></i>8% Commission</span>
                            </div>
                            <small class="text-muted">&copy; 2024 ThriftAI. Building the future of sustainable commerce.</small>
                        </div>
                    </footer>

                    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
                    <script>
                        function loadDeals() {
                            const container = document.getElementById('deals-container');
                            container.innerHTML = `
                                <div class="col-12 text-center py-5">
                                    <div class="spinner-border text-primary mb-4" role="status"></div>
                                    <p class="text-muted">Loading 100 amazing deals...</p>
                                </div>
                            `;
                            
                            fetch('/api/deals')
                                .then(response => response.json())
                                .then(data => {
                                    displayProducts(data.data);
                                })
                                .catch(error => {
                                    container.innerHTML = `
                                        <div class="col-12 text-center py-5">
                                            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                                            <h4>Error loading deals</h4>
                                            <p class="text-muted">${error.message}</p>
                                            <button class="btn btn-primary" onclick="loadDeals()">Try Again</button>
                                        </div>
                                    `;
                                });
                        }
                        
                        function displayProducts(products) {
                            const container = document.getElementById('deals-container');
                            let html = '';
                            
                            products.slice(0, 20).forEach(deal => {  // Show first 20 products
                                const product = deal.product;
                                const qualityClass = getQualityClass(deal.dealQuality);
                                const categoryIcon = getCategoryIcon(product.category);
                                const imageUrl = generateProductImage(product.category, product.name, product.brand);
                                
                                html += `
                                    <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                                        <div class="card deal-card border-0 shadow-sm h-100 elegant-hover">
                                            <div class="product-image-container position-relative">
                                                <img src="${imageUrl}" class="card-img-top product-image" alt="${product.name}" 
                                                     style="height: 200px; object-fit: cover;" 
                                                     onerror="this.src='https://via.placeholder.com/300x200/f8f9fa/6c757d?text=${encodeURIComponent(product.name)}'">
                                                <div class="position-absolute top-0 end-0 m-2">
                                                    <span class="badge ${qualityClass} shadow-sm">
                                                        ${deal.dealQuality.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div class="position-absolute bottom-0 start-0 m-2">
                                                    <span class="badge bg-danger shadow-sm">
                                                        ${product.discountPercentage}% OFF
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div class="card-body p-3">
                                                <h6 class="card-title mb-2 fw-bold">${product.name}</h6>
                                                
                                                <div class="mb-2">
                                                    <span class="badge bg-secondary me-1">${categoryIcon} ${product.category}</span>
                                                    <span class="badge bg-primary me-1">${product.brand}</span>
                                                </div>
                                                
                                                <div class="pricing mb-2">
                                                    <h5 class="text-primary mb-1">$${product.price.toFixed(2)}</h5>
                                                    ${product.originalPrice > product.price ? `
                                                        <div>
                                                            <span class="text-muted text-decoration-line-through small">
                                                                $${product.originalPrice.toFixed(2)}
                                                            </span>
                                                            <span class="text-success small ms-2">
                                                                Save $${(product.originalPrice - product.price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                                
                                                <div class="ai-score mb-2">
                                                    <div class="d-flex align-items-center">
                                                        <small class="text-muted me-2">AI Score:</small>
                                                        <div class="progress flex-grow-1 me-2" style="height: 4px;">
                                                            <div class="progress-bar ${qualityClass.replace('badge ', 'bg')}" 
                                                                 style="width: ${deal.dealScore}%"></div>
                                                        </div>
                                                        <small class="fw-bold">${deal.dealScore.toFixed(0)}</small>
                                                    </div>
                                                </div>
                                                
                                                <p class="card-text small text-muted mb-2" style="font-size: 0.8rem;">
                                                    ${deal.dealReason}
                                                </p>
                                                
                                                <div class="d-grid gap-1">
                                                    <button class="btn btn-primary btn-sm">
                                                        <i class="fas fa-shopping-cart me-1"></i>View Deal
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            });
                            
                            // Add load more button
                            html += `
                                <div class="col-12 text-center mt-4">
                                    <button class="btn btn-outline-primary btn-lg" onclick="loadMoreProducts()">
                                        <i class="fas fa-plus me-2"></i>Load More Products
                                        <span class="badge bg-primary ms-2">${products.length - 20} remaining</span>
                                    </button>
                                </div>
                            `;
                            
                            container.innerHTML = html;
                            window.allProducts = products; // Store all products globally
                        }
                        
                        function loadMoreProducts() {
                            if (!window.allProducts) return;
                            
                            const container = document.getElementById('deals-container');
                            const currentProducts = container.querySelectorAll('.deal-card').length;
                            const nextBatch = window.allProducts.slice(currentProducts, currentProducts + 20);
                            
                            if (nextBatch.length === 0) return;
                            
                            // Remove load more button
                            const loadMoreBtn = container.querySelector('.col-12.text-center.mt-4');
                            if (loadMoreBtn) loadMoreBtn.remove();
                            
                            let html = '';
                            nextBatch.forEach(deal => {
                                const product = deal.product;
                                const qualityClass = getQualityClass(deal.dealQuality);
                                const categoryIcon = getCategoryIcon(product.category);
                                const imageUrl = generateProductImage(product.category, product.name, product.brand);
                                
                                html += `
                                    <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                                        <div class="card deal-card border-0 shadow-sm h-100 elegant-hover">
                                            <div class="product-image-container position-relative">
                                                <img src="${imageUrl}" class="card-img-top product-image" alt="${product.name}" 
                                                     style="height: 200px; object-fit: cover;" 
                                                     onerror="this.src='https://via.placeholder.com/300x200/f8f9fa/6c757d?text=${encodeURIComponent(product.name)}'">
                                                <div class="position-absolute top-0 end-0 m-2">
                                                    <span class="badge ${qualityClass} shadow-sm">
                                                        ${deal.dealQuality.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div class="position-absolute bottom-0 start-0 m-2">
                                                    <span class="badge bg-danger shadow-sm">
                                                        ${product.discountPercentage}% OFF
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div class="card-body p-3">
                                                <h6 class="card-title mb-2 fw-bold">${product.name}</h6>
                                                
                                                <div class="mb-2">
                                                    <span class="badge bg-secondary me-1">${categoryIcon} ${product.category}</span>
                                                    <span class="badge bg-primary me-1">${product.brand}</span>
                                                </div>
                                                
                                                <div class="pricing mb-2">
                                                    <h5 class="text-primary mb-1">$${product.price.toFixed(2)}</h5>
                                                    ${product.originalPrice > product.price ? `
                                                        <div>
                                                            <span class="text-muted text-decoration-line-through small">
                                                                $${product.originalPrice.toFixed(2)}
                                                            </span>
                                                            <span class="text-success small ms-2">
                                                                Save $${(product.originalPrice - product.price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                                
                                                <div class="ai-score mb-2">
                                                    <div class="d-flex align-items-center">
                                                        <small class="text-muted me-2">AI Score:</small>
                                                        <div class="progress flex-grow-1 me-2" style="height: 4px;">
                                                            <div class="progress-bar ${qualityClass.replace('badge ', 'bg')}" 
                                                                 style="width: ${deal.dealScore}%"></div>
                                                        </div>
                                                        <small class="fw-bold">${deal.dealScore.toFixed(0)}</small>
                                                    </div>
                                                </div>
                                                
                                                <p class="card-text small text-muted mb-2" style="font-size: 0.8rem;">
                                                    ${deal.dealReason}
                                                </p>
                                                
                                                <div class="d-grid gap-1">
                                                    <button class="btn btn-primary btn-sm">
                                                        <i class="fas fa-shopping-cart me-1"></i>View Deal
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            });
                            
                            // Add new products
                            container.insertAdjacentHTML('beforeend', html);
                            
                            // Add load more button if there are more products
                            const remaining = window.allProducts.length - (currentProducts + nextBatch.length);
                            if (remaining > 0) {
                                container.insertAdjacentHTML('beforeend', `
                                    <div class="col-12 text-center mt-4">
                                        <button class="btn btn-outline-primary btn-lg" onclick="loadMoreProducts()">
                                            <i class="fas fa-plus me-2"></i>Load More Products
                                            <span class="badge bg-primary ms-2">${remaining} remaining</span>
                                        </button>
                                    </div>
                                `);
                            }
                        }
                        
                        function getQualityClass(quality) {
                            switch(quality) {
                                case 'EXCEPTIONAL': return 'badge bg-success';
                                case 'EXCELLENT': return 'badge bg-info';
                                case 'VERY_GOOD': return 'badge bg-primary';
                                case 'GOOD': return 'badge bg-warning';
                                default: return 'badge bg-secondary';
                            }
                        }
                        
                        function getCategoryIcon(category) {
                            const icons = {
                                'CLOTHING': '👕',
                                'SHOES': '👟',
                                'ELECTRONICS': '📱',
                                'ACCESSORIES': '👜',
                                'HOME': '🏠',
                                'BOOKS': '📚',
                                'SPORTS': '⚽',
                                'BEAUTY': '💄',
                                'JEWELRY': '💎',
                                'AUTOMOTIVE': '🚗'
                            };
                            return icons[category] || '📦';
                        }
                        
                        function generateProductImage(category, name, brand) {
                            // Generate placeholder images with category-specific colors and designs
                            const categoryColors = {
                                'CLOTHING': '4a90e2',
                                'SHOES': 'f5a623',
                                'ELECTRONICS': '7ed321',
                                'ACCESSORIES': 'd0021b',
                                'HOME': '9013fe',
                                'BOOKS': '50e3c2',
                                'SPORTS': 'bd10e0',
                                'BEAUTY': 'f8e71c',
                                'JEWELRY': 'b8e986',
                                'AUTOMOTIVE': '5c7cfa'
                            };
                            
                            const color = categoryColors[category] || '6c757d';
                            const icon = getCategoryIcon(category);
                            
                            return `https://via.placeholder.com/300x200/${color}/ffffff?text=${icon}+${encodeURIComponent(brand)}`;
                        }

                        function showStats() {
                            fetch('/api/stats')
                                .then(response => response.json())
                                .then(data => {
                                    const stats = data.data;
                                    const categoryList = Object.entries(stats.categoryStats)
                                        .map(([cat, count]) => `• ${getCategoryIcon(cat)} ${cat}: ${count} products`)
                                        .join('\\n');
                                    
                                    alert(`📊 Platform Statistics:\\n\\n• Total Products: ${stats.totalProducts}\\n• Categories: ${stats.totalCategories}\\n• Brands: ${stats.totalBrands}\\n• Partner Stores: ${stats.totalStores}\\n• Average Discount: ${stats.averageDiscount}%\\n• AI Accuracy: ${stats.aiAccuracy}%\\n\\nCategory Breakdown:\\n${categoryList}`);
                                })
                                .catch(error => {
                                    alert('Error loading statistics: ' + error.message);
                                });
                        }

                        function testAPI(endpoint) {
                            const resultDiv = document.getElementById('api-result');
                            resultDiv.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Calling API...';
                            
                            fetch(endpoint)
                                .then(response => response.json())
                                .then(data => {
                                    resultDiv.innerHTML = `
                                        <div class="alert alert-success mt-3">
                                            <strong>✅ API Response from ${endpoint}:</strong>
                                            <pre class="mt-2 mb-0">${JSON.stringify(data, null, 2)}</pre>
                                        </div>
                                    `;
                                })
                                .catch(error => {
                                    resultDiv.innerHTML = `
                                        <div class="alert alert-danger mt-3">
                                            <strong>❌ API Error:</strong> ${error.message}
                                        </div>
                                    `;
                                });
                        }

                        // Marketplace Functions
                        function showBuyerPreferences() {
                            const modal = new bootstrap.Modal(document.getElementById('buyerPreferencesModal'));
                            modal.show();
                        }
                        
                        function showSellModal() {
                            const modal = new bootstrap.Modal(document.getElementById('sellModal'));
                            modal.show();
                        }
                        
                        function savePreferencesAndSearch() {
                            const preferences = {
                                minBudget: document.getElementById('minBudget').value,
                                maxBudget: document.getElementById('maxBudget').value,
                                categories: Array.from(document.querySelectorAll('input[id^="cat_"]:checked')).map(cb => cb.id.replace('cat_', '').toUpperCase()),
                                brands: document.getElementById('preferredBrands').value.split(',').map(b => b.trim()).filter(b => b),
                                minQuality: document.getElementById('minQuality').value,
                                searchDescription: document.getElementById('searchDescription').value
                            };
                            
                            // Store preferences
                            localStorage.setItem('thriftai_preferences', JSON.stringify(preferences));
                            
                            // Close modal
                            const modal = bootstrap.Modal.getInstance(document.getElementById('buyerPreferencesModal'));
                            modal.hide();
                            
                            // Load personalized deals
                            loadPersonalizedDeals(preferences);
                            
                            // Show success message
                            showNotification('Preferences saved! Loading personalized deals...', 'success');
                        }
                        
                        function listItem() {
                            const item = {
                                name: document.getElementById('itemName').value,
                                category: document.getElementById('itemCategory').value,
                                brand: document.getElementById('itemBrand').value,
                                condition: document.getElementById('itemCondition').value,
                                price: parseFloat(document.getElementById('itemPrice').value),
                                originalPrice: parseFloat(document.getElementById('itemOriginalPrice').value) || 0,
                                description: document.getElementById('itemDescription').value,
                                sellerId: 'seller_' + Date.now(), // In real app, this would be user ID
                                listedAt: new Date().toISOString()
                            };
                            
                            // Validate required fields
                            if (!item.name || !item.category || !item.condition || !item.price) {
                                showNotification('Please fill in all required fields', 'error');
                                return;
                            }
                            
                            // Calculate commission
                            const commission = (item.price * 0.08).toFixed(2);
                            const netEarnings = (item.price * 0.92).toFixed(2);
                            
                            // Store item (in real app, this would go to database)
                            let listedItems = JSON.parse(localStorage.getItem('thriftai_listed_items') || '[]');
                            listedItems.push(item);
                            localStorage.setItem('thriftai_listed_items', JSON.stringify(listedItems));
                            
                            // Close modal
                            const modal = bootstrap.Modal.getInstance(document.getElementById('sellModal'));
                            modal.hide();
                            
                            // Show success
                            showNotification(`Item listed successfully! You'll earn $${netEarnings} after 8% commission ($${commission})`, 'success');
                            
                            // Clear form
                            document.getElementById('sellItemForm').reset();
                        }
                        
                        function loadPersonalizedDeals(preferences) {
                            const container = document.getElementById('deals-container');
                            container.innerHTML = `
                                <div class="col-12 text-center py-5">
                                    <div class="spinner-border text-primary mb-4" role="status"></div>
                                    <h4 class="text-primary">🤖 AI is finding your perfect deals...</h4>
                                    <p class="text-muted">Analyzing ${preferences.categories.length} categories within your $${preferences.minBudget}-$${preferences.maxBudget} budget</p>
                                </div>
                            `;
                            
                            // Simulate AI processing
                            setTimeout(() => {
                                fetch('/api/deals')
                                    .then(response => response.json())
                                    .then(data => {
                                        // Filter and score products based on preferences
                                        const personalizedDeals = filterAndScoreDeals(data.data, preferences);
                                        displayPersonalizedProducts(personalizedDeals, preferences);
                                    });
                            }, 2000);
                        }
                        
                        function filterAndScoreDeals(deals, preferences) {
                            return deals
                                .filter(deal => {
                                    const product = deal.product;
                                    
                                    // Budget filter
                                    if (product.price < preferences.minBudget || product.price > preferences.maxBudget) {
                                        return false;
                                    }
                                    
                                    // Category filter
                                    if (preferences.categories.length > 0 && !preferences.categories.includes(product.category)) {
                                        return false;
                                    }
                                    
                                    // Quality filter
                                    const qualityRank = { FAIR: 1, GOOD: 2, VERY_GOOD: 3, EXCELLENT: 4 };
                                    if (qualityRank[product.condition] < qualityRank[preferences.minQuality]) {
                                        return false;
                                    }
                                    
                                    return true;
                                })
                                .map(deal => {
                                    // Calculate AI match score based on preferences
                                    let matchScore = deal.dealScore;
                                    
                                    // Boost score for preferred brands
                                    if (preferences.brands.length > 0 && 
                                        preferences.brands.some(brand => deal.product.brand.toLowerCase().includes(brand.toLowerCase()))) {
                                        matchScore += 15;
                                    }
                                    
                                    // Boost score based on description matching
                                    if (preferences.searchDescription) {
                                        const searchTerms = preferences.searchDescription.toLowerCase().split(' ');
                                        const productText = (deal.product.name + ' ' + deal.product.description + ' ' + deal.dealReason).toLowerCase();
                                        const matches = searchTerms.filter(term => productText.includes(term)).length;
                                        matchScore += matches * 5;
                                    }
                                    
                                    // Budget sweet spot boost (prefer middle of budget range)
                                    const budgetRange = preferences.maxBudget - preferences.minBudget;
                                    const pricePosition = (deal.product.price - preferences.minBudget) / budgetRange;
                                    if (pricePosition >= 0.3 && pricePosition <= 0.7) {
                                        matchScore += 10;
                                    }
                                    
                                    return { ...deal, matchScore: Math.min(matchScore, 100) };
                                })
                                .sort((a, b) => b.matchScore - a.matchScore);
                        }
                        
                        function displayPersonalizedProducts(deals, preferences) {
                            const container = document.getElementById('deals-container');
                            
                            if (deals.length === 0) {
                                container.innerHTML = `
                                    <div class="col-12 text-center py-5">
                                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                                        <h4>No matches found</h4>
                                        <p class="text-muted">Try adjusting your budget range or preferences to see more deals</p>
                                        <button class="btn btn-primary" onclick="showBuyerPreferences()">
                                            <i class="fas fa-cog me-1"></i>Adjust Preferences
                                        </button>
                                    </div>
                                `;
                                return;
                            }
                            
                            let html = `
                                <div class="col-12 mb-4">
                                    <div class="alert alert-success">
                                        <i class="fas fa-robot me-2"></i>
                                        <strong>AI Found ${deals.length} Perfect Matches!</strong> 
                                        Sorted by compatibility with your preferences and budget ($${preferences.minBudget}-$${preferences.maxBudget})
                                    </div>
                                </div>
                            `;
                            
                            deals.slice(0, 20).forEach(deal => {
                                const product = deal.product;
                                const qualityClass = getQualityClass(deal.dealQuality);
                                const categoryIcon = getCategoryIcon(product.category);
                                const imageUrl = generateProductImage(product.category, product.name, product.brand);
                                
                                // Commission calculation for display
                                const commission = (product.price * 0.08).toFixed(2);
                                
                                html += `
                                    <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                                        <div class="card deal-card border-0 shadow-sm h-100 elegant-hover">
                                            <div class="product-image-container position-relative">
                                                <img src="${imageUrl}" class="card-img-top product-image" alt="${product.name}" 
                                                     style="height: 200px; object-fit: cover;" 
                                                     onerror="this.src='https://via.placeholder.com/300x200/f8f9fa/6c757d?text=${encodeURIComponent(product.name)}'">
                                                <div class="position-absolute top-0 end-0 m-2">
                                                    <span class="badge bg-success shadow-sm">
                                                        <i class="fas fa-robot me-1"></i>${deal.matchScore.toFixed(0)}% Match
                                                    </span>
                                                </div>
                                                <div class="position-absolute bottom-0 start-0 m-2">
                                                    <span class="badge bg-danger shadow-sm">
                                                        ${product.discountPercentage}% OFF
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div class="card-body p-3">
                                                <h6 class="card-title mb-2 fw-bold">${product.name}</h6>
                                                
                                                <div class="mb-2">
                                                    <span class="badge bg-secondary me-1">${categoryIcon} ${product.category}</span>
                                                    <span class="badge bg-primary me-1">${product.brand}</span>
                                                </div>
                                                
                                                <div class="pricing mb-2">
                                                    <h5 class="text-primary mb-1">$${product.price.toFixed(2)}</h5>
                                                    ${product.originalPrice > product.price ? `
                                                        <div>
                                                            <span class="text-muted text-decoration-line-through small">
                                                                $${product.originalPrice.toFixed(2)}
                                                            </span>
                                                            <span class="text-success small ms-2">
                                                                Save $${(product.originalPrice - product.price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                                
                                                <div class="ai-score mb-2">
                                                    <div class="d-flex align-items-center">
                                                        <small class="text-muted me-2">AI Match:</small>
                                                        <div class="progress flex-grow-1 me-2" style="height: 6px;">
                                                            <div class="progress-bar bg-success" 
                                                                 style="width: ${deal.matchScore}%"></div>
                                                        </div>
                                                        <small class="fw-bold text-success">${deal.matchScore.toFixed(0)}%</small>
                                                    </div>
                                                </div>
                                                
                                                <p class="card-text small text-muted mb-2" style="font-size: 0.8rem;">
                                                    ${deal.dealReason}
                                                </p>
                                                
                                                <div class="d-grid gap-1">
                                                    <button class="btn btn-success btn-sm" onclick="buyItem('${deal.id}', ${product.price}, '${commission}')">
                                                        <i class="fas fa-shopping-cart me-1"></i>Buy Now - Seller gets $${(product.price * 0.92).toFixed(2)}
                                                    </button>
                                                    <small class="text-muted text-center">8% commission to ThriftAI</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            });
                            
                            container.innerHTML = html;
                            window.personalizedDeals = deals;
                        }
                        
                        function buyItem(dealId, price, commission) {
                            if (confirm(`Purchase this item for $${price.toFixed(2)}?\\n\\nBreakdown:\\n• Item: $${price.toFixed(2)}\\n• Seller receives: $${(price * 0.92).toFixed(2)}\\n• ThriftAI commission: $${commission}`)) {
                                showNotification('🎉 Purchase successful! Connecting you with the seller...', 'success');
                                // In real app, this would process the transaction
                            }
                        }
                        
                        function showSellerDashboard() {
                            const listedItems = JSON.parse(localStorage.getItem('thriftai_listed_items') || '[]');
                            
                            let dashboardHTML = `
                                <div class="alert alert-info">
                                    <h5><i class="fas fa-store me-2"></i>Your Seller Dashboard</h5>
                                    <p class="mb-0">You have ${listedItems.length} items listed. ThriftAI takes 8% commission on successful sales.</p>
                                </div>
                            `;
                            
                            if (listedItems.length === 0) {
                                dashboardHTML += `
                                    <div class="text-center py-4">
                                        <i class="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                                        <h5>No items listed yet</h5>
                                        <button class="btn btn-primary" onclick="showSellModal()">List Your First Item</button>
                                    </div>
                                `;
                            } else {
                                listedItems.forEach((item, index) => {
                                    const commission = (item.price * 0.08).toFixed(2);
                                    const earnings = (item.price * 0.92).toFixed(2);
                                    
                                    dashboardHTML += `
                                        <div class="card mb-3">
                                            <div class="card-body">
                                                <div class="row">
                                                    <div class="col-md-8">
                                                        <h6 class="card-title">${item.name}</h6>
                                                        <p class="text-muted small">${getCategoryIcon(item.category)} ${item.category} • ${item.brand || 'No brand'} • ${item.condition}</p>
                                                        <p class="card-text small">${item.description || 'No description'}</p>
                                                    </div>
                                                    <div class="col-md-4 text-end">
                                                        <h5 class="text-primary">$${item.price.toFixed(2)}</h5>
                                                        <small class="text-success">You earn: $${earnings}</small><br>
                                                        <small class="text-muted">Commission: $${commission}</small>
                                                        <div class="mt-2">
                                                            <span class="badge bg-warning">Listed</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                });
                            }
                            
                            // Show dashboard in a modal or replace content
                            document.getElementById('deals-container').innerHTML = `
                                <div class="col-12">
                                    <div class="d-flex justify-content-between align-items-center mb-4">
                                        <h3><i class="fas fa-store me-2"></i>Seller Dashboard</h3>
                                        <div>
                                            <button class="btn btn-primary me-2" onclick="showSellModal()">
                                                <i class="fas fa-plus me-1"></i>List New Item
                                            </button>
                                            <button class="btn btn-outline-secondary" onclick="loadDeals()">
                                                <i class="fas fa-arrow-left me-1"></i>Back to Deals
                                            </button>
                                        </div>
                                    </div>
                                    ${dashboardHTML}
                                </div>
                            `;
                        }
                        
                        function showNotification(message, type = 'info') {
                            const alertClass = type === 'success' ? 'alert-success' : 
                                             type === 'error' ? 'alert-danger' : 'alert-info';
                            
                            const notification = document.createElement('div');
                            notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
                            notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
                            notification.innerHTML = `
                                ${message}
                                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                            `;
                            
                            document.body.appendChild(notification);
                            
                            setTimeout(() => {
                                if (notification.parentNode) {
                                    notification.remove();
                                }
                            }, 5000);
                        }

                        // Auto-load deals on page load, or preferences if they exist
                        window.addEventListener('load', function() {
                            const savedPreferences = localStorage.getItem('thriftai_preferences');
                            if (savedPreferences) {
                                setTimeout(() => {
                                    const preferences = JSON.parse(savedPreferences);
                                    loadPersonalizedDeals(preferences);
                                }, 1000);
                            } else {
                                setTimeout(loadDeals, 1500);
                            }
                        });
                        
                        // Platform connection function
                        function connectPlatform(platform) {
                            const platformNames = {
                                'ebay': 'eBay',
                                'mercari': 'Mercari',
                                'facebook': 'Facebook Marketplace',
                                'offerup': 'OfferUp',
                                'instagram': 'Instagram',
                                'tiktok': 'TikTok Shop',
                                'pinterest': 'Pinterest',
                                'twitter': 'Twitter/X',
                                'google': 'Google Account',
                                'apple': 'Apple ID',
                                'dropbox': 'Dropbox',
                                'stripe': 'Stripe Payments'
                            };
                            
                            // Show connecting animation
                            const platformCard = event.currentTarget;
                            const originalContent = platformCard.innerHTML;
                            
                            platformCard.innerHTML = `
                                <div class="card-body text-center py-4">
                                    <div class="spinner-border text-primary mb-3" role="status"></div>
                                    <h6 class="fw-bold">Connecting...</h6>
                                    <p class="small text-muted mb-0">Setting up ${platformNames[platform]}</p>
                                </div>
                            `;
                            
                            // Simulate connection process
                            setTimeout(() => {
                                platformCard.innerHTML = originalContent;
                                
                                // Show success notification
                                showPlatformNotification(`Successfully connected to ${platformNames[platform]}!`, 'success');
                                
                                // Update card to show connected state
                                const badge = platformCard.querySelector('.badge');
                                badge.className = 'badge bg-success';
                                badge.innerHTML = '<i class="fas fa-check me-1"></i>Connected';
                                
                                // Store connection in localStorage
                                const connections = JSON.parse(localStorage.getItem('platformConnections') || '[]');
                                if (!connections.includes(platform)) {
                                    connections.push(platform);
                                    localStorage.setItem('platformConnections', JSON.stringify(connections));
                                }
                                
                                // Show platform dashboard after connection
                                setTimeout(() => {
                                    showPlatformDashboard();
                                }, 1500);
                                
                            }, 2000);
                        }
                        
                        // Platform dashboard modal
                        function showPlatformDashboard() {
                            const connections = JSON.parse(localStorage.getItem('platformConnections') || '[]');
                            
                            const modalHtml = `
                                <div class="modal fade" id="platformDashboard" tabindex="-1">
                                    <div class="modal-dialog modal-lg">
                                        <div class="modal-content">
                                            <div class="modal-header border-0">
                                                <h5 class="modal-title"><i class="fas fa-link me-2"></i>Platform Connections</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                            </div>
                                            <div class="modal-body">
                                                <div class="alert alert-success border-0">
                                                    <i class="fas fa-check-circle me-2"></i>
                                                    <strong>Connected!</strong> Your platforms are now synced with ThriftAI's AI engine.
                                                </div>
                                                
                                                <h6 class="mb-3">Connected Platforms (${connections.length})</h6>
                                                <div class="row">
                                                    ${connections.map(platform => `
                                                        <div class="col-md-6 mb-2">
                                                            <div class="d-flex align-items-center p-2 bg-light rounded">
                                                                <i class="fas fa-check-circle text-success me-2"></i>
                                                                <span class="fw-medium">${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                                                                <span class="badge bg-success ms-auto">Live</span>
                                                            </div>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                                
                                                <hr class="my-4">
                                                
                                                <h6 class="mb-3">AI Sync Features</h6>
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <div class="d-flex align-items-center mb-2">
                                                            <i class="fas fa-robot text-primary me-2"></i>
                                                            <span>Auto cross-listing</span>
                                                        </div>
                                                        <div class="d-flex align-items-center mb-2">
                                                            <i class="fas fa-sync text-info me-2"></i>
                                                            <span>Inventory sync</span>
                                                        </div>
                                                        <div class="d-flex align-items-center mb-2">
                                                            <i class="fas fa-chart-line text-success me-2"></i>
                                                            <span>Performance tracking</span>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <div class="d-flex align-items-center mb-2">
                                                            <i class="fas fa-dollar-sign text-warning me-2"></i>
                                                            <span>Price optimization</span>
                                                        </div>
                                                        <div class="d-flex align-items-center mb-2">
                                                            <i class="fas fa-camera text-purple me-2"></i>
                                                            <span>Photo enhancement</span>
                                                        </div>
                                                        <div class="d-flex align-items-center mb-2">
                                                            <i class="fas fa-bell text-danger me-2"></i>
                                                            <span>Smart notifications</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="modal-footer border-0">
                                                <button type="button" class="btn btn-primary">
                                                    <i class="fas fa-cog me-1"></i>Manage Settings
                                                </button>
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                            
                            // Remove existing modal
                            const existingModal = document.getElementById('platformDashboard');
                            if (existingModal) existingModal.remove();
                            
                            // Add modal to page
                            document.body.insertAdjacentHTML('beforeend', modalHtml);
                            
                            // Show modal
                            const modal = new bootstrap.Modal(document.getElementById('platformDashboard'));
                            modal.show();
                        }
                        
                        // Platform notification function
                        function showPlatformNotification(message, type) {
                            const alertClass = type === 'success' ? 'alert-success' : 'alert-info';
                            const icon = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
                            
                            const notification = document.createElement('div');
                            notification.className = 'position-fixed bottom-0 end-0 m-3';
                            notification.style.zIndex = '9999';
                            notification.innerHTML = `
                                <div class="alert ${alertClass} alert-dismissible fade show shadow" role="alert">
                                    <i class="fas ${icon} me-2"></i>${message}
                                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                                </div>
                            `;
                            
                            document.body.appendChild(notification);
                            
                            // Auto-remove after 5 seconds
                            setTimeout(() => {
                                notification.remove();
                            }, 5000);
                        }
                        
                        // Category filtering function
                        function filterByCategory(category) {
                            // Smooth scroll to deals section
                            document.getElementById('deals-container').scrollIntoView({ 
                                behavior: 'smooth',
                                block: 'start'
                            });
                            
                            // Show loading
                            document.getElementById('deals-container').innerHTML = `
                                <div class="col-12 text-center py-5">
                                    <div class="spinner-border text-primary mb-4" role="status"></div>
                                    <p class="text-muted">Finding ${category} deals...</p>
                                </div>
                            `;
                            
                            // Simulate API call and filter deals
                            setTimeout(() => {
                                fetch('/api/deals')
                                    .then(response => response.json())
                                    .then(data => {
                                        const filteredDeals = data.data.filter(deal => 
                                            deal.product.category.toLowerCase().includes(category.toLowerCase())
                                        );
                                        displayProducts(filteredDeals);
                                        
                                        // Update section title
                                        const sectionTitle = document.querySelector('#deals-container').previousElementSibling.previousElementSibling.querySelector('h2');
                                        sectionTitle.innerHTML = `🔍 ${category} Deals Found`;
                                    })
                                    .catch(error => {
                                        console.error('Error filtering deals:', error);
                                        loadDeals(); // Fallback to all deals
                                    });
                            }, 800);
                        }
                    </script>
                </body>
                </html>
                """;
            
            return htmlPart1 + htmlPart2;
        }
    }
    
    // AI Deals API Handler
    static class DealsAPIHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String jsonResponse = generateDealsJson();
            sendResponse(exchange, jsonResponse, "application/json");
        }
    }
    
    // Generate 100 products dynamically
    private static String generateDealsJson() {
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("    \"success\": true,\n");
        json.append("    \"message\": \"100 AI deals retrieved successfully\",\n");
        json.append("    \"timestamp\": \"").append(new Date().toString()).append("\",\n");
        json.append("    \"totalProducts\": 100,\n");
        json.append("    \"data\": [\n");
        
        String[] categories = {"CLOTHING", "SHOES", "ELECTRONICS", "ACCESSORIES", "HOME", "BOOKS", "SPORTS", "BEAUTY", "JEWELRY", "AUTOMOTIVE"};
        String[] brands = {"NIKE", "ADIDAS", "LEVI'S", "APPLE", "SAMSUNG", "SONY", "ZARA", "H&M", "GUCCI", "PRADA", "ROLEX", "OMEGA", "CANON", "NIKON", "IKEA", "POTTERY_BARN", "CUISINART", "KITCHENAID", "SEPHORA", "MAC", "BMW", "AUDI", "MERCEDES"};
        String[] conditions = {"EXCELLENT", "VERY_GOOD", "GOOD", "FAIR"};
        String[] qualities = {"EXCEPTIONAL", "EXCELLENT", "VERY_GOOD", "GOOD", "FAIR"};
        
        String[][] products = {
            // CLOTHING
            {"Vintage Denim Jacket", "CLOTHING", "Designer Wool Coat", "CLOTHING", "Silk Evening Dress", "CLOTHING", "Cashmere Sweater", "CLOTHING", "Leather Jacket", "CLOTHING"},
            {"Cotton T-Shirt", "CLOTHING", "Formal Blazer", "CLOTHING", "Summer Dress", "CLOTHING", "Jeans", "CLOTHING", "Hoodie", "CLOTHING"},
            {"Polo Shirt", "CLOTHING", "Cardigan", "CLOTHING", "Maxi Dress", "CLOTHING", "Chinos", "CLOTHING", "Track Pants", "CLOTHING"},
            
            // SHOES
            {"Running Sneakers", "SHOES", "Leather Boots", "SHOES", "High Heels", "SHOES", "Canvas Shoes", "SHOES", "Dress Shoes", "SHOES"},
            {"Athletic Shoes", "SHOES", "Ankle Boots", "SHOES", "Sandals", "SHOES", "Loafers", "SHOES", "Combat Boots", "SHOES"},
            
            // ELECTRONICS
            {"Smartphone", "ELECTRONICS", "Laptop", "ELECTRONICS", "Headphones", "ELECTRONICS", "Tablet", "ELECTRONICS", "Smartwatch", "ELECTRONICS"},
            {"Camera", "ELECTRONICS", "Gaming Console", "ELECTRONICS", "Bluetooth Speaker", "ELECTRONICS", "Monitor", "ELECTRONICS", "Keyboard", "ELECTRONICS"},
            
            // ACCESSORIES
            {"Leather Handbag", "ACCESSORIES", "Sunglasses", "ACCESSORIES", "Belt", "ACCESSORIES", "Wallet", "ACCESSORIES", "Scarf", "ACCESSORIES"},
            {"Watch", "ACCESSORIES", "Backpack", "ACCESSORIES", "Hat", "ACCESSORIES", "Gloves", "ACCESSORIES", "Tie", "ACCESSORIES"},
            
            // HOME
            {"Coffee Table", "HOME", "Dining Chair", "HOME", "Floor Lamp", "HOME", "Throw Pillow", "HOME", "Area Rug", "HOME"},
            {"Bookshelf", "HOME", "Picture Frame", "HOME", "Vase", "HOME", "Candle", "HOME", "Mirror", "HOME"}
        };
        
        Random random = new Random();
        
        for (int i = 0; i < 100; i++) {
            // Select random product details
            String[] productGroup = products[random.nextInt(products.length)];
            String productName = productGroup[random.nextInt(productGroup.length)];
            String category = productGroup[1];
            String brand = brands[random.nextInt(brands.length)];
            String condition = conditions[random.nextInt(conditions.length)];
            String quality = qualities[random.nextInt(qualities.length)];
            
            double originalPrice = 50 + random.nextDouble() * 950; // $50 - $1000
            int discountPercent = 15 + random.nextInt(70); // 15% - 85%
            double price = originalPrice * (100 - discountPercent) / 100.0;
            double savings = originalPrice - price;
            double dealScore = 20 + random.nextDouble() * 80; // 20 - 100
            
            String dealReason = generateDealReason(discountPercent, quality, brand);
            
            json.append("        {\n");
            json.append("            \"id\": \"deal_").append(i + 1).append("\",\n");
            json.append("            \"product\": {\n");
            json.append("                \"id\": \"p").append(i + 1).append("\",\n");
            json.append("                \"name\": \"").append(productName).append("\",\n");
            json.append("                \"category\": \"").append(category).append("\",\n");
            json.append("                \"brand\": \"").append(brand).append("\",\n");
            json.append("                \"price\": ").append(String.format("%.2f", price)).append(",\n");
            json.append("                \"originalPrice\": ").append(String.format("%.2f", originalPrice)).append(",\n");
            json.append("                \"condition\": \"").append(condition).append("\",\n");
            json.append("                \"discountPercentage\": ").append(discountPercent).append(",\n");
            json.append("                \"description\": \"Premium quality ").append(productName.toLowerCase()).append(" from ").append(brand).append(" in ").append(condition.toLowerCase().replace("_", " ")).append(" condition.\"\n");
            json.append("            },\n");
            json.append("            \"dealScore\": ").append(String.format("%.1f", dealScore)).append(",\n");
            json.append("            \"dealQuality\": \"").append(quality).append("\",\n");
            json.append("            \"dealReason\": \"").append(dealReason).append("\",\n");
            json.append("            \"savingsAmount\": ").append(String.format("%.2f", savings)).append("\n");
            json.append("        }");
            
            if (i < 99) json.append(",");
            json.append("\n");
        }
        
        json.append("    ]\n");
        json.append("}");
        
        return json.toString();
    }
    
    private static String generateDealReason(int discount, String quality, String brand) {
        String[] reasons = {
            quality + " deal! Amazing " + discount + "% discount! From premium brand " + brand + ".",
            "Great value! " + discount + "% off from " + brand + " - " + quality.toLowerCase() + " quality guaranteed.",
            "Don't miss out! " + discount + "% savings on this " + quality.toLowerCase() + " " + brand + " item.",
            "Hot deal! " + quality + " quality " + brand + " product with " + discount + "% discount.",
            "Limited time! " + discount + "% off " + brand + " - " + quality.toLowerCase() + " condition, great value!"
        };
        Random random = new Random();
        return reasons[random.nextInt(reasons.length)];
    }
    
    // Statistics API Handler
    static class StatsAPIHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String jsonResponse = """
                {
                    "success": true,
                    "message": "Statistics retrieved successfully",
                    "timestamp": "%s",
                    "data": {
                        "totalProducts": 100,
                        "totalCategories": 10,
                        "totalBrands": 23,
                        "totalStores": 15,
                        "averageDiscount": 47.8,
                        "categoryStats": {
                            "CLOTHING": 30,
                            "SHOES": 15,
                            "ELECTRONICS": 20,
                            "ACCESSORIES": 15,
                            "HOME": 10,
                            "BOOKS": 2,
                            "SPORTS": 3,
                            "BEAUTY": 2,
                            "JEWELRY": 2,
                            "AUTOMOTIVE": 1
                        },
                        "aiAccuracy": 94.2,
                        "serverStatus": "running"
                    }
                }
                """.formatted(new Date().toString());
            sendResponse(exchange, jsonResponse, "application/json");
        }
    }
    
    // Health Check API Handler
    static class HealthAPIHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String jsonResponse = """
                {
                    "success": true,
                    "message": "ThriftAI server is healthy",
                    "timestamp": "%s",
                    "data": {
                        "status": "UP",
                        "server": "ThriftAI Simple Web Server",
                        "version": "1.0.0",
                        "uptime": "%d seconds",
                        "features": [
                            "AI Deal Scoring",
                            "Real-time Recommendations", 
                            "RESTful API",
                            "Web Interface"
                        ]
                    }
                }
                """.formatted(new Date().toString(), System.currentTimeMillis() / 1000);
            sendResponse(exchange, jsonResponse, "application/json");
        }
    }
    
    // Static Resource Handler (for future CSS/JS files)
    static class StaticResourceHandler implements HttpHandler {
        private final String contentType;
        
        public StaticResourceHandler(String contentType) {
            this.contentType = contentType;
        }
        
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            // For demo, return empty response
            sendResponse(exchange, "", contentType);
        }
    }
    
    // Helper method to send HTTP response
    private static void sendResponse(HttpExchange exchange, String response, String contentType) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", contentType + "; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(200, response.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }
}