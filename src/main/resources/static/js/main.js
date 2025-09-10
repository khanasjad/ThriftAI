/**
 * ThriftAI Enhanced JavaScript with AI Features
 */

$(document).ready(function() {
    console.log('🧠 ThriftAI AI-Enhanced JavaScript loaded!');
    
    // Initialize components
    initGPTSearch();
    initSearchSuggestions();
    initAIRatingCards();
    initDealCards();
    initInteractiveAnimations();
    initTooltips();
    initSmoothScroll();
    initAIInsights();
    
    // Auto-refresh deals every 30 seconds
    if (window.location.pathname.includes('/deals')) {
        setInterval(refreshDeals, 30000);
    }
    
    // Initialize AI-powered features
    startAIAnimations();
});

/**
 * Initialize GPT Search with enhanced features
 */
function initGPTSearch() {
    const gptSearchBox = $('.gpt-search-box');
    const gptSearchBtn = $('.gpt-search-btn');
    
    if (gptSearchBox.length === 0) return;
    
    // Add typing effect and suggestions
    gptSearchBox.on('focus', function() {
        $(this).addClass('search-focused');
        showGPTSuggestions();
    });
    
    gptSearchBox.on('blur', function() {
        $(this).removeClass('search-focused');
        setTimeout(() => hideGPTSuggestions(), 200);
    });
    
    // Real-time GPT-style search processing
    let gptSearchTimeout;
    gptSearchBox.on('input', function() {
        const query = $(this).val();
        clearTimeout(gptSearchTimeout);
        
        if (query.length > 0) {
            gptSearchBtn.addClass('search-ready');
            
            // Simulate AI processing
            gptSearchTimeout = setTimeout(() => {
                processGPTQuery(query);
            }, 500);
        } else {
            gptSearchBtn.removeClass('search-ready');
        }
    });
    
    // Enhanced search button interaction
    gptSearchBtn.on('mouseenter', function() {
        $(this).addClass('btn-glow');
    }).on('mouseleave', function() {
        $(this).removeClass('btn-glow');
    });
}

/**
 * Process GPT-style query (simulated AI processing)
 */
function processGPTQuery(query) {
    const aiKeywords = ['find', 'show', 'search', 'get', 'looking for', 'need', 'want'];
    const hasAIKeyword = aiKeywords.some(keyword => query.toLowerCase().includes(keyword));
    
    if (hasAIKeyword) {
        $('.gpt-search-container').addClass('ai-processing');
        setTimeout(() => {
            $('.gpt-search-container').removeClass('ai-processing');
        }, 1000);
    }
}

/**
 * Show/Hide GPT Suggestions
 */
function showGPTSuggestions() {
    const suggestions = [
        'Find me vintage leather jackets under $50',
        'Show electronics with best deals',
        'Looking for designer clothes on sale',
        'Get home decor items with high ratings',
        'Search for books and media deals'
    ];
    
    // You could implement a suggestion dropdown here
}

function hideGPTSuggestions() {
    // Hide suggestion dropdown
}

/**
 * Initialize AI Rating Cards with enhanced interactions
 */
function initAIRatingCards() {
    $('.ai-rating-card').each(function() {
        const card = $(this);
        
        // Add hover effects
        card.on('mouseenter', function() {
            $(this).addClass('card-elevated');
            animateAIBadge($(this).find('.ai-rating-badge'));
        });
        
        card.on('mouseleave', function() {
            $(this).removeClass('card-elevated');
        });
        
        // Animate AI score on load
        setTimeout(() => {
            animateAIScore(card.find('.ai-score-display'));
        }, Math.random() * 2000);
    });
    
    // Enhanced product cards
    $('.product-card-enhanced').each(function() {
        const card = $(this);
        
        card.on('mouseenter', function() {
            $(this).addClass('product-highlight');
            
            // Animate value stars
            const stars = $(this).find('.fa-star');
            stars.each(function(index) {
                setTimeout(() => {
                    $(this).addClass('star-glow');
                }, index * 100);
            });
        });
        
        card.on('mouseleave', function() {
            $(this).removeClass('product-highlight');
            $(this).find('.fa-star').removeClass('star-glow');
        });
    });
}

/**
 * Animate AI Badge
 */
function animateAIBadge(badge) {
    badge.addClass('badge-pulse');
    setTimeout(() => {
        badge.removeClass('badge-pulse');
    }, 1000);
}

/**
 * Animate AI Score with counting effect
 */
function animateAIScore(scoreElement) {
    if (scoreElement.length === 0) return;
    
    const finalScore = scoreElement.text();
    const numericScore = parseInt(finalScore);
    
    if (isNaN(numericScore)) return;
    
    let currentScore = 0;
    const increment = numericScore / 30;
    const timer = setInterval(() => {
        currentScore += increment;
        if (currentScore >= numericScore) {
            currentScore = numericScore;
            clearInterval(timer);
            scoreElement.addClass('score-complete');
        }
        scoreElement.text(Math.floor(currentScore) + '/100');
    }, 50);
}

/**
 * Initialize Interactive Animations
 */
function initInteractiveAnimations() {
    // Stats cards animation on scroll
    $(window).on('scroll', function() {
        $('.stats-card-enhanced').each(function() {
            if (isInViewport(this)) {
                $(this).addClass('stats-visible');
                animateStatNumber($(this));
            }
        });
    });
    
    // Floating elements animation
    setInterval(() => {
        $('.floating-elements').toggleClass('float-alternate');
    }, 4000);
    
    // Search container glow effect
    $('.gpt-search-container').on('mouseenter', function() {
        $(this).addClass('container-glow');
    }).on('mouseleave', function() {
        $(this).removeClass('container-glow');
    });
}

/**
 * Animate stat numbers
 */
function animateStatNumber(statCard) {
    if (statCard.hasClass('animated')) return;
    
    const numberElement = statCard.find('h3');
    const finalNumber = parseInt(numberElement.text());
    
    if (isNaN(finalNumber)) return;
    
    statCard.addClass('animated');
    let currentNumber = 0;
    const increment = finalNumber / 20;
    
    const timer = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= finalNumber) {
            currentNumber = finalNumber;
            clearInterval(timer);
        }
        numberElement.text(Math.floor(currentNumber));
    }, 100);
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Start AI-themed animations
 */
function startAIAnimations() {
    // Pulse animation for AI elements
    setInterval(() => {
        $('.ai-rating-badge').addClass('ai-pulse');
        setTimeout(() => {
            $('.ai-rating-badge').removeClass('ai-pulse');
        }, 1000);
    }, 8000);
    
    // Gradient shift for hero section
    $('.hero-section-enhanced').addClass('gradient-active');
}

/**
 * Initialize AI Insights
 */
function initAIInsights() {
    // Add click handlers for AI insights
    $('.ai-insight').on('click', function() {
        $(this).toggleClass('insight-expanded');
        showAIInsightModal($(this).data('insight'));
    });
    
    // Rotating AI tips
    const aiTips = [
        '💡 AI Tip: Compare prices across multiple sources for best deals',
        '🎯 Smart Shopping: Check AI ratings for value assessment',
        '⚡ Quick Find: Use natural language in search for better results',
        '📊 Data Driven: Our AI analyzes thousands of deals daily'
    ];
    
    let tipIndex = 0;
    setInterval(() => {
        showAITip(aiTips[tipIndex % aiTips.length]);
        tipIndex++;
    }, 15000);
}

/**
 * Show AI Insight Modal (placeholder)
 */
function showAIInsightModal(insight) {
    // Could implement a modal with detailed AI insights
    console.log('AI Insight:', insight);
    showNotification('AI analysis complete!', 'info');
}

/**
 * Show AI Tips
 */
function showAITip(tip) {
    const tipElement = $(`
        <div class="ai-tip position-fixed" style="bottom: 20px; left: 20px; z-index: 1000;">
            <div class="alert alert-info alert-dismissible fade show" style="background: linear-gradient(45deg, #667eea, #764ba2); border: none; color: white; border-radius: 15px;">
                <i class="fas fa-robot me-2"></i>${tip}
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
            </div>
        </div>
    `);
    
    $('body').append(tipElement);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        tipElement.find('.alert').alert('close');
    }, 8000);
}

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