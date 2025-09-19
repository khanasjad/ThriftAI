/**
 * AI Assistant Widget for ThriftAI
 * Provides floating AI chat interface for shopping assistance
 */

class AIAssistantWidget {
    constructor() {
        this.isOpen = false;
        this.isLoading = false;
        this.messageHistory = [];

        this.initializeElements();
        this.bindEvents();
        this.initializeWidget();
    }

    initializeElements() {
        this.trigger = document.getElementById('aiWidgetTrigger');
        this.widget = document.getElementById('aiWidgetChat');
        this.closeBtn = document.getElementById('aiWidgetClose');
        this.messagesContainer = document.getElementById('aiWidgetMessages');
        this.input = document.getElementById('aiWidgetInput');
        this.sendBtn = document.getElementById('aiWidgetSend');
        this.quickBtns = document.querySelectorAll('.ai-quick-btn');
    }

    bindEvents() {
        // Widget toggle
        this.trigger.addEventListener('click', () => this.toggleWidget());
        this.closeBtn.addEventListener('click', () => this.closeWidget());

        // Message sending
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Quick action buttons
        this.quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.getAttribute('data-query');
                this.sendMessage(query);
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.widget.contains(e.target) && !this.trigger.contains(e.target)) {
                this.closeWidget();
            }
        });
    }

    initializeWidget() {
        // Auto-scroll messages container
        this.scrollToBottom();

        // Focus input when widget opens
        this.widget.addEventListener('transitionend', () => {
            if (this.isOpen) {
                this.input.focus();
            }
        });
    }

    toggleWidget() {
        if (this.isOpen) {
            this.closeWidget();
        } else {
            this.openWidget();
        }
    }

    openWidget() {
        this.isOpen = true;
        this.widget.style.display = 'flex';
        setTimeout(() => {
            this.widget.style.opacity = '1';
            this.widget.style.transform = 'translateY(0) scale(1)';
        }, 10);
        this.input.focus();
    }

    closeWidget() {
        this.isOpen = false;
        this.widget.style.opacity = '0';
        this.widget.style.transform = 'translateY(10px) scale(0.95)';
        setTimeout(() => {
            this.widget.style.display = 'none';
        }, 200);
    }

    async sendMessage(customMessage = null) {
        const message = customMessage || this.input.value.trim();
        if (!message || this.isLoading) return;

        // Clear input if not using custom message
        if (!customMessage) {
            this.input.value = '';
        }

        // Add user message to chat
        this.addMessage(message, 'user');

        // Show loading state
        this.showLoadingMessage();

        try {
            // Send to AI assistant endpoint
            const response = await fetch('/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    type: 'shopping',
                    preferences: this.getUserPreferences()
                })
            });

            const data = await response.json();

            // Remove loading message
            this.removeLoadingMessage();

            if (data.success) {
                // Add AI response
                this.addMessage(data.message, 'assistant');

                // Show products if available
                if (data.products && data.products.length > 0) {
                    this.addProductCards(data.products);
                }

                // Update quick suggestions if available
                if (data.suggestions && data.suggestions.length > 0) {
                    this.updateQuickSuggestions(data.suggestions.slice(0, 3));
                }
            } else {
                this.addMessage('Sorry, I encountered an issue. Please try again!', 'assistant');
            }

        } catch (error) {
            console.error('AI Assistant Error:', error);
            this.removeLoadingMessage();
            this.addMessage('Sorry, I\'m having trouble connecting right now. Please try again in a moment!', 'assistant');
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ai-message-${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'ai-message-content';
        contentDiv.innerHTML = this.formatMessage(content);

        if (sender === 'user') {
            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(contentDiv);
        }

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Store in history
        this.messageHistory.push({ content, sender, timestamp: Date.now() });
    }

    addProductCards(products) {
        const productsContainer = document.createElement('div');
        productsContainer.className = 'ai-message ai-message-assistant';
        productsContainer.innerHTML = `
            <div class="ai-message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="ai-message-content" style="max-width: 300px;">
                <div class="ai-products-grid" style="display: flex; flex-direction: column; gap: 12px;">
                    ${products.slice(0, 3).map(product => `
                        <div class="ai-product-card" style="background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 12px; padding: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <h6 style="margin: 0; font-size: 13px; font-weight: 600; color: white;">${product.name}</h6>
                                <span style="color: #10b981; font-weight: 700; font-size: 14px;">$${product.price}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #888;">
                                <span>${product.brand}</span>
                                <span>${product.condition}</span>
                            </div>
                            ${product.discountPercentage ? `
                                <div style="margin-top: 6px; font-size: 11px; color: #00d4ff;">
                                    💰 ${Math.round(product.discountPercentage)}% off retail
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                ${products.length > 3 ? `
                    <div style="margin-top: 10px; text-align: center; font-size: 12px; color: #888;">
                        +${products.length - 3} more items found
                    </div>
                ` : ''}
            </div>
        `;

        this.messagesContainer.appendChild(productsContainer);
        this.scrollToBottom();
    }

    showLoadingMessage() {
        this.isLoading = true;
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message ai-message-assistant ai-loading-message';
        loadingDiv.innerHTML = `
            <div class="ai-message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="ai-message-content">
                <div class="ai-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(loadingDiv);
        this.scrollToBottom();

        // Add typing animation styles
        const style = document.createElement('style');
        style.textContent = `
            .ai-typing-indicator {
                display: flex;
                gap: 4px;
                align-items: center;
            }
            .ai-typing-indicator span {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #10b981;
                animation: aiTyping 1.4s infinite;
            }
            .ai-typing-indicator span:nth-child(2) {
                animation-delay: 0.2s;
            }
            .ai-typing-indicator span:nth-child(3) {
                animation-delay: 0.4s;
            }
            @keyframes aiTyping {
                0%, 60%, 100% {
                    opacity: 0.3;
                    transform: scale(0.8);
                }
                30% {
                    opacity: 1;
                    transform: scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }

    removeLoadingMessage() {
        this.isLoading = false;
        const loadingMessage = this.messagesContainer.querySelector('.ai-loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    updateQuickSuggestions(suggestions) {
        const quickActions = document.querySelector('.ai-quick-actions');
        if (quickActions && suggestions.length > 0) {
            quickActions.innerHTML = suggestions.map(suggestion => `
                <button class="ai-quick-btn" data-query="${suggestion}">
                    ${this.truncateText(suggestion, 15)}
                </button>
            `).join('');

            // Re-bind events for new buttons
            quickActions.querySelectorAll('.ai-quick-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const query = btn.getAttribute('data-query');
                    this.sendMessage(query);
                });
            });
        }
    }

    formatMessage(message) {
        // Convert emoji codes and format text
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')               // Italic
            .replace(/\n/g, '<br>')                             // Line breaks
            .replace(/🎯/g, '🎯')
            .replace(/💰/g, '💰')
            .replace(/🏷️/g, '🏷️')
            .replace(/📍/g, '📍')
            .replace(/♻️/g, '♻️');
    }

    getUserPreferences() {
        // Get user preferences from localStorage or session
        return localStorage.getItem('userPreferences') || 'budget-conscious, eco-friendly';
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
}

// Initialize AI Assistant Widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AIAssistantWidget();
});

// Global function to send message from external sources
window.sendAIMessage = function(message) {
    if (window.aiAssistant) {
        window.aiAssistant.openWidget();
        setTimeout(() => {
            window.aiAssistant.sendMessage(message);
        }, 300);
    }
};