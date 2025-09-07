/**
 * ThriftAI WebSocket Client for Real-time Features
 */

class ThriftAIWebSocket {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000; // 5 seconds
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        console.log('🔌 Connecting to ThriftAI WebSocket...');
        
        const socket = new SockJS('/thrift-websocket');
        this.stompClient = Stomp.over(socket);
        
        // Disable debug logging in production
        this.stompClient.debug = (str) => {
            if (window.location.hostname === 'localhost') {
                console.log('WebSocket: ', str);
            }
        };

        this.stompClient.connect({}, 
            (frame) => this.onConnected(frame),
            (error) => this.onError(error)
        );
    }

    /**
     * Handle successful connection
     */
    onConnected(frame) {
        console.log('✅ Connected to ThriftAI WebSocket:', frame);
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to default topics
        this.subscribeToDeals();
        this.subscribeToStats();
        this.subscribeToNotifications();
        this.subscribeToLiveUpdates();
        
        // Show connection status
        this.showConnectionStatus('Connected', 'success');
        
        // Request initial data
        this.requestLatestDeals();
        this.requestLatestStats();
    }

    /**
     * Handle connection error
     */
    onError(error) {
        console.error('❌ WebSocket connection error:', error);
        this.connected = false;
        
        this.showConnectionStatus('Disconnected', 'error');
        
        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.showConnectionStatus('Connection Failed', 'error');
        }
    }

    /**
     * Subscribe to deal updates
     */
    subscribeToDeals() {
        const subscription = this.stompClient.subscribe('/topic/deals', (message) => {
            const deals = JSON.parse(message.body);
            this.handleDealsUpdate(deals);
        });
        
        this.subscriptions.set('deals', subscription);
    }

    /**
     * Subscribe to AI-enhanced deals
     */
    subscribeToAIDeals() {
        const subscription = this.stompClient.subscribe('/topic/ai-deals', (message) => {
            const deals = JSON.parse(message.body);
            this.handleAIDealsUpdate(deals);
        });
        
        this.subscriptions.set('ai-deals', subscription);
    }

    /**
     * Subscribe to platform statistics
     */
    subscribeToStats() {
        const subscription = this.stompClient.subscribe('/topic/stats-updates', (message) => {
            const update = JSON.parse(message.body);
            this.handleStatsUpdate(update.stats);
        });
        
        this.subscriptions.set('stats', subscription);
    }

    /**
     * Subscribe to notifications
     */
    subscribeToNotifications() {
        const subscription = this.stompClient.subscribe('/topic/notifications', (message) => {
            const notification = JSON.parse(message.body);
            this.handleNotification(notification);
        });
        
        this.subscriptions.set('notifications', subscription);
    }

    /**
     * Subscribe to live updates
     */
    subscribeToLiveUpdates() {
        const subscription = this.stompClient.subscribe('/topic/live-updates', (message) => {
            const update = JSON.parse(message.body);
            this.handleLiveUpdate(update);
        });
        
        this.subscriptions.set('live-updates', subscription);
    }

    /**
     * Request latest deals
     */
    requestLatestDeals(limit = 5) {
        if (!this.connected) return;
        
        this.stompClient.send('/app/deals/request', {}, JSON.stringify({
            limit: limit,
            timestamp: Date.now()
        }));
    }

    /**
     * Request AI-enhanced deals
     */
    requestAIDeals(limit = 5) {
        if (!this.connected) return;
        
        this.stompClient.send('/app/deals/ai-enhance', {}, JSON.stringify({
            limit: limit,
            timestamp: Date.now()
        }));
    }

    /**
     * Request latest statistics
     */
    requestLatestStats() {
        if (!this.connected) return;
        
        this.stompClient.send('/app/stats/request', {}, JSON.stringify({
            timestamp: Date.now()
        }));
    }

    /**
     * Handle deals update
     */
    handleDealsUpdate(deals) {
        console.log('📈 Received deals update:', deals);
        
        // Update deals display if on deals page
        if (window.location.pathname.includes('deals')) {
            this.updateDealsDisplay(deals);
        }
        
        // Update homepage featured deals
        if (window.location.pathname === '/') {
            this.updateFeaturedDeals(deals);
        }
        
        // Trigger custom event
        $(document).trigger('thriftai:deals-updated', [deals]);
    }

    /**
     * Handle AI deals update
     */
    handleAIDealsUpdate(deals) {
        console.log('🤖 Received AI deals update:', deals);
        
        this.updateDealsDisplay(deals, true);
        $(document).trigger('thriftai:ai-deals-updated', [deals]);
    }

    /**
     * Handle statistics update
     */
    handleStatsUpdate(stats) {
        console.log('📊 Received stats update:', stats);
        
        // Update statistics displays
        this.updateStatsDisplay(stats);
        $(document).trigger('thriftai:stats-updated', [stats]);
    }

    /**
     * Handle notifications
     */
    handleNotification(notification) {
        console.log('🔔 Received notification:', notification);
        
        this.showNotification(notification.message, notification.type);
        $(document).trigger('thriftai:notification', [notification]);
    }

    /**
     * Handle live updates
     */
    handleLiveUpdate(update) {
        console.log('⚡ Received live update:', update);
        
        if (update.type === 'DEAL_UPDATE') {
            this.handleDealsUpdate(update.deals);
            this.showNotification(update.message, 'info');
        }
        
        $(document).trigger('thriftai:live-update', [update]);
    }

    /**
     * Update deals display on page
     */
    updateDealsDisplay(deals, isAI = false) {
        const container = isAI ? $('#ai-deals-container') : $('#deals-container');
        if (container.length === 0) return;
        
        // Add animation class
        container.addClass('updating');
        
        setTimeout(() => {
            // Update deal cards with new data
            deals.forEach((deal, index) => {
                const card = container.find(`.deal-card:eq(${index})`);
                if (card.length > 0) {
                    this.updateDealCard(card, deal);
                }
            });
            
            container.removeClass('updating');
        }, 300);
    }

    /**
     * Update individual deal card
     */
    updateDealCard(card, deal) {
        card.find('.card-title').text(deal.product.name);
        card.find('.deal-score').text(deal.dealScore.toFixed(1));
        card.find('.deal-quality').text(deal.dealQuality);
        card.find('.product-price').text(`$${deal.product.price.toFixed(2)}`);
        
        if (deal.product.originalPrice > 0) {
            const discount = deal.product.discountPercentage.toFixed(0);
            card.find('.discount-badge').text(`${discount}% OFF`);
        }
        
        card.find('.deal-reason').text(deal.dealReason);
    }

    /**
     * Update featured deals on homepage
     */
    updateFeaturedDeals(deals) {
        const container = $('#featured-deals-container');
        if (container.length === 0) return;
        
        // Similar to updateDealsDisplay but for homepage
        container.addClass('fade-in-up');
    }

    /**
     * Update statistics display
     */
    updateStatsDisplay(stats) {
        // Update total products
        $('.stat-total-products').text(stats.totalProducts || 0);
        
        // Update total categories
        $('.stat-total-categories').text(stats.totalCategories || 0);
        
        // Update total brands
        $('.stat-total-brands').text(stats.totalBrands || 0);
        
        // Update average discount
        $('.stat-average-discount').text(`${Math.round(stats.averageDiscount || 0)}%`);
        
        // Add pulse animation to updated stats
        $('.stat-number').addClass('pulse-animation');
        setTimeout(() => {
            $('.stat-number').removeClass('pulse-animation');
        }, 1000);
    }

    /**
     * Show connection status
     */
    showConnectionStatus(message, type) {
        const statusElement = $('#websocket-status');
        if (statusElement.length === 0) {
            // Create status element if doesn't exist
            const status = $(`<div id="websocket-status" class="position-fixed bottom-0 end-0 m-3"></div>`);
            $('body').append(status);
        }
        
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 'alert-info';
        
        $('#websocket-status').html(`
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="fas ${type === 'success' ? 'fa-plug' : 'fa-exclamation-triangle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                $('#websocket-status .alert').alert('close');
            }, 3000);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Use existing notification system from main.js
        if (window.ThriftAI && window.ThriftAI.showNotification) {
            window.ThriftAI.showNotification(message, type);
        } else {
            console.log(`Notification: ${message}`);
        }
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.stompClient && this.connected) {
            this.stompClient.disconnect(() => {
                console.log('👋 Disconnected from ThriftAI WebSocket');
                this.connected = false;
            });
        }
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
}

// Global WebSocket instance
window.thriftAIWebSocket = null;

// Initialize WebSocket when page loads
$(document).ready(function() {
    console.log('🔄 Initializing ThriftAI WebSocket...');
    
    window.thriftAIWebSocket = new ThriftAIWebSocket();
    window.thriftAIWebSocket.connect();
    
    // Cleanup on page unload
    $(window).on('beforeunload', function() {
        if (window.thriftAIWebSocket) {
            window.thriftAIWebSocket.disconnect();
        }
    });
});

// Export for use in other scripts
window.ThriftAIWebSocket = ThriftAIWebSocket;