/**
 * ThriftAI Search Widget
 * A reusable AI-powered search component that can be integrated into any page
 */

class ThriftAISearchWidget {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            placeholder: 'Ask ThriftAI anything...',
            showQuickActions: true,
            showVisualSearch: true,
            compact: false,
            theme: 'dark',
            ...options
        };
        
        this.isSearching = false;
        this.searchHistory = [];
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const widgetHTML = `
            <div class="thriftai-widget ${this.options.compact ? 'compact' : ''} ${this.options.theme}">
                <div class="widget-header">
                    <div class="ai-logo">
                        <i class="fas fa-robot"></i>
                        <span>ThriftAI</span>
                    </div>
                    ${this.options.showQuickActions ? this.renderQuickActions() : ''}
                </div>
                
                <div class="search-container">
                    <div class="search-input-wrapper">
                        <input 
                            type="text" 
                            class="ai-search-input" 
                            placeholder="${this.options.placeholder}"
                            id="${this.container.id}-search-input"
                        >
                        <button class="search-btn" id="${this.container.id}-search-btn">
                            <i class="fas fa-search"></i>
                        </button>
                        ${this.options.showVisualSearch ? 
                            `<button class="visual-search-btn" id="${this.container.id}-visual-btn">
                                <i class="fas fa-camera"></i>
                            </button>` : ''
                        }
                    </div>
                    
                    <div class="search-suggestions" id="${this.container.id}-suggestions">
                        <!-- Dynamic suggestions will be inserted here -->
                    </div>
                </div>
                
                <div class="search-results" id="${this.container.id}-results" style="display: none;">
                    <!-- Search results will be displayed here -->
                </div>
                
                <div class="loading-indicator" id="${this.container.id}-loading" style="display: none;">
                    <div class="ai-thinking">
                        <div class="thinking-dots">
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                        </div>
                        <span>AI is thinking...</span>
                    </div>
                </div>
                
                <!-- Visual Search Modal -->
                ${this.options.showVisualSearch ? this.renderVisualSearchModal() : ''}
            </div>
        `;

        this.container.innerHTML = widgetHTML;
        this.loadStyles();
    }

    renderQuickActions() {
        return `
            <div class="quick-actions">
                <button class="quick-action" data-query="Find best deals today">
                    <i class="fas fa-fire"></i>
                    <span>Hot Deals</span>
                </button>
                <button class="quick-action" data-query="Show vintage items under $30">
                    <i class="fas fa-clock"></i>
                    <span>Vintage</span>
                </button>
                <button class="quick-action" data-query="Designer items on sale">
                    <i class="fas fa-gem"></i>
                    <span>Designer</span>
                </button>
                <button class="quick-action" data-query="Electronics and gadgets">
                    <i class="fas fa-laptop"></i>
                    <span>Electronics</span>
                </button>
            </div>
        `;
    }

    renderVisualSearchModal() {
        return `
            <div class="visual-search-modal" id="${this.container.id}-visual-modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5>Visual Search</h5>
                        <button class="close-btn" data-action="close-visual">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="upload-area" id="${this.container.id}-upload-area">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>Drag & drop an image or click to browse</p>
                            <small>Supported: JPG, PNG, WebP (Max 5MB)</small>
                        </div>
                        <input type="file" id="${this.container.id}-file-input" accept="image/*" style="display: none;">
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const searchInput = document.getElementById(`${this.container.id}-search-input`);
        const searchBtn = document.getElementById(`${this.container.id}-search-btn`);
        const visualBtn = document.getElementById(`${this.container.id}-visual-btn`);

        // Search functionality
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(searchInput.value);
            }
        });

        searchInput.addEventListener('input', (e) => {
            this.updateSuggestions(e.target.value);
        });

        searchBtn.addEventListener('click', () => {
            this.performSearch(searchInput.value);
        });

        // Visual search
        if (visualBtn) {
            visualBtn.addEventListener('click', () => {
                this.openVisualSearch();
            });
        }

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = btn.getAttribute('data-query');
                searchInput.value = query;
                this.performSearch(query);
            });
        });

        // Visual search modal
        this.attachVisualSearchListeners();
    }

    attachVisualSearchListeners() {
        const modal = document.getElementById(`${this.container.id}-visual-modal`);
        const uploadArea = document.getElementById(`${this.container.id}-upload-area`);
        const fileInput = document.getElementById(`${this.container.id}-file-input`);
        const closeBtn = document.querySelector('[data-action="close-visual"]');

        if (modal && uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleImageUpload(files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleImageUpload(e.target.files[0]);
                }
            });

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    async performSearch(query) {
        if (!query.trim() || this.isSearching) return;

        this.isSearching = true;
        this.showLoading();
        this.addToHistory(query);

        try {
            const response = await fetch('/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: query,
                    type: 'search',
                    preferences: this.getUserPreferences()
                })
            });

            const data = await response.json();
            this.hideLoading();

            if (data.success) {
                this.displayResults(data);
                this.updateSuggestions(null, data.suggestions);
            } else {
                this.displayError(data.error || 'Search failed. Please try again.');
            }
        } catch (error) {
            this.hideLoading();
            this.displayError('Network error. Please check your connection.');
        } finally {
            this.isSearching = false;
        }
    }

    async handleImageUpload(file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.displayError('Image too large. Please select an image under 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            this.closeVisualSearch();
            this.isSearching = true;
            this.showLoading();

            try {
                const response = await fetch('/ai/visual-search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: e.target.result
                    })
                });

                const data = await response.json();
                this.hideLoading();

                if (data.success) {
                    this.displayResults(data);
                } else {
                    this.displayError('Image analysis failed. Please try again.');
                }
            } catch (error) {
                this.hideLoading();
                this.displayError('Failed to process image. Please try again.');
            } finally {
                this.isSearching = false;
            }
        };
        reader.readAsDataURL(file);
    }

    displayResults(data) {
        const resultsContainer = document.getElementById(`${this.container.id}-results`);
        resultsContainer.style.display = 'block';

        let html = `<div class="ai-response">${data.message.replace(/\n/g, '<br>')}</div>`;

        // Display products if available
        if (data.products && data.products.length > 0) {
            html += '<div class="products-grid">';
            data.products.slice(0, 8).forEach(product => {
                const discount = product.originalPrice > 0 ? 
                    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

                html += `
                    <div class="product-item" onclick="window.open('/product/${product.id}', '_blank')">
                        <div class="product-image">
                            <img src="${product.imageUrl || '/images/placeholder.jpg'}" 
                                 alt="${product.name}" 
                                 onerror="this.src='/images/placeholder.jpg'">
                            ${discount > 0 ? `<div class="discount">${discount}% OFF</div>` : ''}
                        </div>
                        <div class="product-info">
                            <h6>${product.name}</h6>
                            <div class="brand">${product.brand}</div>
                            <div class="price">
                                <span class="current">$${product.price}</span>
                                ${product.originalPrice > 0 ? 
                                    `<span class="original">$${product.originalPrice}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Display insights if available
        if (data.insights && data.insights.length > 0) {
            html += '<div class="ai-insights">';
            html += '<h6><i class="fas fa-lightbulb me-2"></i>AI Insights</h6>';
            data.insights.forEach(insight => {
                html += `<div class="insight">${insight}</div>`;
            });
            html += '</div>';
        }

        resultsContainer.innerHTML = html;
    }

    displayError(message) {
        const resultsContainer = document.getElementById(`${this.container.id}-results`);
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
            </div>
        `;
    }

    updateSuggestions(query, suggestions = null) {
        const suggestionsContainer = document.getElementById(`${this.container.id}-suggestions`);
        
        if (suggestions) {
            // Show AI-generated suggestions
            let html = '';
            suggestions.slice(0, 4).forEach(suggestion => {
                html += `<button class="suggestion" onclick="this.closest('.thriftai-widget').querySelector('.ai-search-input').value = '${suggestion}'; this.closest('.thriftai-widget').querySelector('.search-btn').click();">${suggestion}</button>`;
            });
            suggestionsContainer.innerHTML = html;
        } else if (query && query.length > 2) {
            // Show contextual suggestions based on query
            const contextualSuggestions = this.getContextualSuggestions(query);
            let html = '';
            contextualSuggestions.forEach(suggestion => {
                html += `<button class="suggestion" onclick="this.closest('.thriftai-widget').querySelector('.ai-search-input').value = '${suggestion}'; this.closest('.thriftai-widget').querySelector('.search-btn').click();">${suggestion}</button>`;
            });
            suggestionsContainer.innerHTML = html;
        } else {
            suggestionsContainer.innerHTML = '';
        }
    }

    getContextualSuggestions(query) {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('vintage') || lowerQuery.includes('retro')) {
            return ['vintage denim jackets', 'retro band t-shirts', 'antique jewelry', 'classic sneakers'];
        } else if (lowerQuery.includes('designer') || lowerQuery.includes('luxury')) {
            return ['designer handbags', 'luxury watches', 'designer shoes', 'high-end clothing'];
        } else if (lowerQuery.includes('electronics') || lowerQuery.includes('tech')) {
            return ['vintage electronics', 'retro gaming', 'audio equipment', 'cameras'];
        } else {
            return ['trending items', 'best deals', 'popular brands', 'new arrivals'];
        }
    }

    openVisualSearch() {
        const modal = document.getElementById(`${this.container.id}-visual-modal`);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeVisualSearch() {
        const modal = document.getElementById(`${this.container.id}-visual-modal`);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showLoading() {
        const loading = document.getElementById(`${this.container.id}-loading`);
        const results = document.getElementById(`${this.container.id}-results`);
        if (loading) loading.style.display = 'block';
        if (results) results.style.display = 'none';
    }

    hideLoading() {
        const loading = document.getElementById(`${this.container.id}-loading`);
        if (loading) loading.style.display = 'none';
    }

    addToHistory(query) {
        this.searchHistory.unshift(query);
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }
        localStorage.setItem('thriftai-search-history', JSON.stringify(this.searchHistory));
    }

    getUserPreferences() {
        // Get user preferences from localStorage or session
        const prefs = localStorage.getItem('thriftai-user-preferences');
        return prefs ? JSON.parse(prefs) : null;
    }

    loadStyles() {
        // Check if styles are already loaded
        if (document.getElementById('thriftai-widget-styles')) return;

        const styles = `
            <style id="thriftai-widget-styles">
                .thriftai-widget {
                    background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(10,10,15,0.95));
                    border: 1px solid rgba(0,212,255,0.2);
                    border-radius: 20px;
                    padding: 1.5rem;
                    backdrop-filter: blur(20px);
                    color: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .thriftai-widget.compact {
                    padding: 1rem;
                    border-radius: 15px;
                }

                .widget-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .ai-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #00d4ff;
                }

                .quick-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .quick-action {
                    background: rgba(0,212,255,0.1);
                    border: 1px solid rgba(0,212,255,0.3);
                    border-radius: 8px;
                    padding: 0.4rem 0.8rem;
                    color: #00d4ff;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }

                .quick-action:hover {
                    background: rgba(0,212,255,0.2);
                    transform: translateY(-1px);
                }

                .search-input-wrapper {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .ai-search-input {
                    flex: 1;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 12px;
                    padding: 0.8rem 1rem;
                    color: #ffffff;
                    font-size: 1rem;
                }

                .ai-search-input:focus {
                    outline: none;
                    border-color: #00d4ff;
                    box-shadow: 0 0 0 3px rgba(0,212,255,0.1);
                }

                .search-btn, .visual-search-btn {
                    background: linear-gradient(135deg, #00d4ff, #0099cc);
                    border: none;
                    border-radius: 12px;
                    padding: 0.8rem 1rem;
                    color: #000;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                }

                .search-btn:hover, .visual-search-btn:hover {
                    transform: scale(1.05);
                }

                .search-suggestions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    margin-bottom: 1rem;
                }

                .suggestion {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 15px;
                    padding: 0.4rem 0.8rem;
                    color: rgba(255,255,255,0.8);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .suggestion:hover {
                    background: rgba(0,212,255,0.2);
                    color: #00d4ff;
                }

                .ai-response {
                    background: rgba(0,212,255,0.1);
                    border: 1px solid rgba(0,212,255,0.2);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }

                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .product-item {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                }

                .product-item:hover {
                    transform: translateY(-3px);
                    border-color: #00d4ff;
                }

                .product-image {
                    position: relative;
                    height: 100px;
                    overflow: hidden;
                }

                .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .discount {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #ff4757;
                    color: white;
                    padding: 0.2rem 0.4rem;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                .product-info {
                    padding: 0.8rem;
                }

                .product-info h6 {
                    margin: 0 0 0.3rem 0;
                    font-size: 0.85rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .brand {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.7);
                    margin-bottom: 0.3rem;
                }

                .price .current {
                    color: #00d4ff;
                    font-weight: 700;
                }

                .price .original {
                    color: rgba(255,255,255,0.5);
                    text-decoration: line-through;
                    font-size: 0.8rem;
                    margin-left: 0.3rem;
                }

                .ai-insights {
                    background: rgba(40,167,69,0.1);
                    border: 1px solid rgba(40,167,69,0.2);
                    border-radius: 12px;
                    padding: 1rem;
                }

                .ai-insights h6 {
                    color: #28a745;
                    margin-bottom: 0.5rem;
                }

                .insight {
                    margin-bottom: 0.3rem;
                    font-size: 0.9rem;
                }

                .loading-indicator {
                    text-align: center;
                    padding: 2rem;
                }

                .ai-thinking {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .thinking-dots {
                    display: flex;
                    gap: 0.3rem;
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #00d4ff;
                    animation: pulse 1.4s infinite ease-in-out;
                }

                .dot:nth-child(2) { animation-delay: 0.2s; }
                .dot:nth-child(3) { animation-delay: 0.4s; }

                @keyframes pulse {
                    0%, 60%, 100% { transform: scale(0.8); opacity: 0.5; }
                    30% { transform: scale(1.2); opacity: 1; }
                }

                .visual-search-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }

                .modal-content {
                    background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(10,10,15,0.95));
                    border: 1px solid rgba(0,212,255,0.2);
                    border-radius: 20px;
                    max-width: 500px;
                    width: 90%;
                    color: white;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 1.2rem;
                    cursor: pointer;
                }

                .modal-body {
                    padding: 1.5rem;
                }

                .upload-area {
                    border: 2px dashed rgba(0,212,255,0.3);
                    border-radius: 12px;
                    padding: 3rem 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .upload-area:hover {
                    border-color: #00d4ff;
                    background: rgba(0,212,255,0.05);
                }

                .upload-area.dragover {
                    border-color: #00d4ff;
                    background: rgba(0,212,255,0.1);
                }

                .error-message {
                    background: rgba(255,71,87,0.1);
                    border: 1px solid rgba(255,71,87,0.2);
                    border-radius: 12px;
                    padding: 1rem;
                    color: #ff4757;
                    text-align: center;
                }

                @media (max-width: 768px) {
                    .quick-actions {
                        display: none;
                    }
                    
                    .thriftai-widget.compact .widget-header {
                        flex-direction: column;
                        gap: 1rem;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Auto-initialize widgets with data-thriftai-widget attribute
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-thriftai-widget]').forEach(element => {
        const options = JSON.parse(element.getAttribute('data-thriftai-options') || '{}');
        new ThriftAISearchWidget(element.id, options);
    });
});

// Global function to create widget programmatically
window.ThriftAISearchWidget = ThriftAISearchWidget;