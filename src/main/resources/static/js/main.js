/**
 * ThriftAI Main JavaScript
 */

$(document).ready(function() {
    console.log('🚀 ThriftAI JavaScript loaded!');
    
    // Initialize components
    initSearchSuggestions();
    initDealCards();
    initTooltips();
    initSmoothScroll();
    
    // Auto-refresh deals every 30 seconds
    if (window.location.pathname.includes('/deals')) {
        setInterval(refreshDeals, 30000);
    }
});

/**
 * Initialize search suggestions
 */
function initSearchSuggestions() {
    const searchInput = $('#search-input');
    const suggestionsContainer = $('#search-suggestions');
    
    if (searchInput.length === 0) return;
    
    let searchTimeout;
    
    searchInput.on('input', function() {
        const query = $(this).val().trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            suggestionsContainer.hide();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            fetchSearchSuggestions(query);
        }, 300);
    });
    
    // Hide suggestions when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.search-container').length) {
            suggestionsContainer.hide();
        }
    });
}

/**
 * Fetch search suggestions from API
 */
function fetchSearchSuggestions(query) {
    $.ajax({
        url: '/api/web/search-suggestions',
        method: 'GET',
        data: { query: query },
        success: function(suggestions) {
            displaySearchSuggestions(suggestions);
        },
        error: function() {
            console.error('Failed to fetch search suggestions');
        }
    });
}

/**
 * Display search suggestions
 */
function displaySearchSuggestions(suggestions) {
    const container = $('#search-suggestions');
    container.empty();
    
    if (suggestions.length === 0) {
        container.hide();
        return;
    }
    
    suggestions.forEach(suggestion => {
        const item = $('<div class="search-suggestion"></div>').text(suggestion);
        item.on('click', function() {
            $('#search-input').val(suggestion);
            container.hide();
            performSearch(suggestion);
        });
        container.append(item);
    });
    
    container.show();
}

/**
 * Perform search
 */
function performSearch(query) {
    const currentPath = window.location.pathname;
    if (currentPath === '/products') {
        window.location.href = `/products?search=${encodeURIComponent(query)}`;
    } else {
        window.location.href = `/products?search=${encodeURIComponent(query)}`;
    }
}

/**
 * Initialize deal cards with hover effects
 */
function initDealCards() {
    $('.deal-card').each(function() {
        const card = $(this);
        const dealQuality = card.find('.card-header h5 span').text().toLowerCase().replace('_', '-');
        card.addClass(`deal-${dealQuality}`);
    });
    
    // Add click tracking
    $('.deal-card').on('click', '.btn', function(e) {
        const productName = $(this).closest('.card').find('.card-title').text();
        trackEvent('deal_click', { product: productName });
    });
}

/**
 * Initialize tooltips
 */
function initTooltips() {
    $('[data-bs-toggle="tooltip"]').tooltip();
}

/**
 * Initialize smooth scroll
 */
function initSmoothScroll() {
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        const target = $($(this).attr('href'));
        if (target.length) {
            $('html, body').animate({
                scrollTop: target.offset().top - 100
            }, 500);
        }
    });
}

/**
 * Refresh deals data
 */
function refreshDeals() {
    const dealsContainer = $('#deals-container');
    if (dealsContainer.length === 0) return;
    
    $.ajax({
        url: '/api/web/quick-deals',
        method: 'GET',
        data: { limit: 6 },
        success: function(deals) {
            updateDealsDisplay(deals);
            showNotification('Deals updated!', 'success');
        },
        error: function() {
            console.error('Failed to refresh deals');
        }
    });
}

/**
 * Update deals display
 */
function updateDealsDisplay(deals) {
    // This would update the deals on the page
    // Implementation depends on the specific page structure
    console.log('Updated deals:', deals);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = $(`
        <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 1050;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    $('body').append(notification);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.alert('close');
    }, 3000);
}

/**
 * Track events (placeholder for analytics)
 */
function trackEvent(eventName, data = {}) {
    console.log(`📊 Event tracked: ${eventName}`, data);
    
    // In a real app, this would send to analytics service
    // Example: Google Analytics, Mixpanel, etc.
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Format percentage
 */
function formatPercentage(value) {
    return `${Math.round(value)}%`;
}

/**
 * Debounce function
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * Loading state management
 */
function showLoading(element) {
    element.addClass('loading');
    element.append('<span class="spinner ms-2"></span>');
}

function hideLoading(element) {
    element.removeClass('loading');
    element.find('.spinner').remove();
}

/**
 * Copy to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showNotification('Copied to clipboard!', 'success');
    }).catch(function() {
        showNotification('Failed to copy', 'error');
    });
}

/**
 * Filter products by category
 */
function filterByCategory(category) {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('category', category);
    window.location.href = currentUrl.toString();
}

/**
 * Sort products
 */
function sortProducts(sortBy) {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('sort', sortBy);
    window.location.href = currentUrl.toString();
}

/**
 * Add to favorites (placeholder)
 */
function addToFavorites(productId) {
    // In a real app, this would save to user's favorites
    trackEvent('add_to_favorites', { productId: productId });
    showNotification('Added to favorites!', 'success');
}

/**
 * Share product
 */
function shareProduct(productId, productName) {
    if (navigator.share) {
        navigator.share({
            title: `Check out this deal: ${productName}`,
            text: `Amazing thrift deal found on ThriftAI!`,
            url: window.location.href
        });
    } else {
        copyToClipboard(window.location.href);
    }
    
    trackEvent('share_product', { productId: productId, productName: productName });
}

// Global functions for inline event handlers
window.ThriftAI = {
    filterByCategory,
    sortProducts,
    addToFavorites,
    shareProduct,
    trackEvent,
    showNotification
};