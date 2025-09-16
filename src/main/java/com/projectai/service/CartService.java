package com.projectai.service;

import com.projectai.models.CartItem;
import com.projectai.models.Product;
import com.projectai.repository.CartRepository;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class CartService {
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    // Add item to cart
    public CartItem addToCart(String sessionId, String buyerId, String productId, Integer quantity) {
        // Validate product exists and is available
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
        
        if (!product.isAvailable()) {
            throw new IllegalStateException("Product is not available: " + product.getName());
        }
        
        // Check if item already exists in cart
        Optional<CartItem> existingItem = cartRepository
            .findBySessionIdOrBuyerIdAndProductId(sessionId, buyerId, productId);
        
        if (existingItem.isPresent()) {
            // Update quantity
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            return cartRepository.save(item);
        } else {
            // Create new cart item
            CartItem newItem = new CartItem(sessionId, buyerId, productId, quantity, product.getPrice());
            return cartRepository.save(newItem);
        }
    }
    
    // Update cart item quantity
    public CartItem updateCartItemQuantity(String sessionId, String buyerId, String cartItemId, Integer quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        
        CartItem cartItem = cartRepository.findById(cartItemId)
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found: " + cartItemId));
        
        // Verify ownership
        if (!isCartItemOwnedBy(cartItem, sessionId, buyerId)) {
            throw new SecurityException("Unauthorized access to cart item");
        }
        
        cartItem.setQuantity(quantity);
        return cartRepository.save(cartItem);
    }
    
    // Remove item from cart
    public void removeFromCart(String sessionId, String buyerId, String cartItemId) {
        CartItem cartItem = cartRepository.findById(cartItemId)
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found: " + cartItemId));
        
        // Verify ownership
        if (!isCartItemOwnedBy(cartItem, sessionId, buyerId)) {
            throw new SecurityException("Unauthorized access to cart item");
        }
        
        cartRepository.delete(cartItem);
    }
    
    // Get all cart items for a user/session
    public List<CartItem> getCartItems(String sessionId, String buyerId) {
        List<CartItem> items;
        if (buyerId != null) {
            items = cartRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        } else {
            items = cartRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
        }
        
        return items;
    }
    
    // Get cart summary with totals and analytics
    public Map<String, Object> getCartSummary(String sessionId, String buyerId) {
        List<CartItem> items = getCartItems(sessionId, buyerId);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("items", items);
        summary.put("itemCount", items.size());
        summary.put("totalQuantity", getTotalQuantity(items));
        summary.put("subtotal", getSubtotal(items));
        summary.put("savings", getTotalSavings(items));
        summary.put("unavailableItems", getUnavailableItems(items));
        summary.put("priceChangedItems", getPriceChangedItems(items));
        summary.put("isEmpty", items.isEmpty());
        
        // Calculate estimated taxes and shipping (mock implementation)
        double subtotal = getSubtotal(items);
        double estimatedTax = subtotal * 0.08; // 8% tax
        double estimatedShipping = subtotal > 50 ? 0.0 : 9.99; // Free shipping over $50
        double total = subtotal + estimatedTax + estimatedShipping;
        
        summary.put("estimatedTax", estimatedTax);
        summary.put("estimatedShipping", estimatedShipping);
        summary.put("total", total);
        
        return summary;
    }
    
    // Clear entire cart
    public void clearCart(String sessionId, String buyerId) {
        if (buyerId != null) {
            cartRepository.deleteByBuyerId(buyerId);
        } else {
            cartRepository.deleteBySessionId(sessionId);
        }
    }
    
    // Transfer guest cart to user account on login
    public void transferGuestCartToUser(String sessionId, String buyerId) {
        List<CartItem> guestItems = cartRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
        List<CartItem> userItems = cartRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        
        // Merge carts, handling duplicates
        Map<String, CartItem> userItemsMap = userItems.stream()
            .collect(Collectors.toMap(CartItem::getProductId, item -> item));
        
        for (CartItem guestItem : guestItems) {
            if (userItemsMap.containsKey(guestItem.getProductId())) {
                // Merge quantities
                CartItem userItem = userItemsMap.get(guestItem.getProductId());
                userItem.setQuantity(userItem.getQuantity() + guestItem.getQuantity());
                cartRepository.save(userItem);
                cartRepository.delete(guestItem);
            } else {
                // Transfer item to user
                guestItem.setBuyerId(buyerId);
                cartRepository.save(guestItem);
            }
        }
    }
    
    // Validate cart before checkout
    public Map<String, Object> validateCart(String sessionId, String buyerId) {
        List<CartItem> items = getCartItems(sessionId, buyerId);
        Map<String, Object> validation = new HashMap<>();
        
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        
        // Check for empty cart
        if (items.isEmpty()) {
            errors.add("Cart is empty");
        }
        
        // Check for unavailable products
        List<CartItem> unavailableItems = getUnavailableItems(items);
        if (!unavailableItems.isEmpty()) {
            errors.add("Some items are no longer available");
            validation.put("unavailableItems", unavailableItems);
        }
        
        // Check for price changes
        List<CartItem> priceChangedItems = getPriceChangedItems(items);
        if (!priceChangedItems.isEmpty()) {
            warnings.add("Some item prices have changed");
            validation.put("priceChangedItems", priceChangedItems);
        }
        
        validation.put("isValid", errors.isEmpty());
        validation.put("errors", errors);
        validation.put("warnings", warnings);
        validation.put("items", items);
        
        return validation;
    }
    
    // Get recommended products based on cart contents
    public List<Product> getCartBasedRecommendations(String sessionId, String buyerId, int limit) {
        List<CartItem> cartItems = getCartItems(sessionId, buyerId);
        
        if (cartItems.isEmpty()) {
            return productRepository.findAll().stream()
                .filter(Product::isAvailable)
                .limit(limit)
                .collect(Collectors.toList());
        }
        
        // Get categories and brands from cart items
        Set<String> categories = cartItems.stream()
            .map(item -> item.getProduct().getCategory())
            .collect(Collectors.toSet());
        
        Set<String> brands = cartItems.stream()
            .map(item -> item.getProduct().getBrand())
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        
        Set<String> cartProductIds = cartItems.stream()
            .map(CartItem::getProductId)
            .collect(Collectors.toSet());
        
        // Find products in similar categories/brands not already in cart
        return productRepository.findAll().stream()
            .filter(Product::isAvailable)
            .filter(p -> !cartProductIds.contains(p.getId()))
            .filter(p -> categories.contains(p.getCategory()) || brands.contains(p.getBrand()))
            .limit(limit)
            .collect(Collectors.toList());
    }
    
    // Clean up old guest carts (scheduled task)
    public void cleanupOldGuestCarts() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7); // 7 days old
        cartRepository.deleteOldGuestCarts(cutoff);
    }
    
    // Get cart analytics for admin dashboard
    public Map<String, Object> getCartAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
        // Total cart items across all users
        long totalCartItems = cartRepository.count();
        analytics.put("totalCartItems", totalCartItems);
        
        // Most popular products in carts
        List<Object[]> popularProducts = cartRepository.findAll().stream()
            .collect(Collectors.groupingBy(CartItem::getProductId, Collectors.counting()))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .map(entry -> new Object[]{entry.getKey(), entry.getValue()})
            .collect(Collectors.toList());
        
        analytics.put("popularProductsInCarts", popularProducts);
        
        return analytics;
    }
    
    // Private helper methods
    private boolean isCartItemOwnedBy(CartItem item, String sessionId, String buyerId) {
        return (buyerId != null && buyerId.equals(item.getBuyerId())) ||
               (sessionId != null && sessionId.equals(item.getSessionId()));
    }
    
    private int getTotalQuantity(List<CartItem> items) {
        return items.stream().mapToInt(CartItem::getQuantity).sum();
    }
    
    private double getSubtotal(List<CartItem> items) {
        return items.stream()
            .filter(item -> item.getProduct() != null && item.getProduct().isAvailable())
            .mapToDouble(CartItem::getSubtotal)
            .sum();
    }
    
    private double getTotalSavings(List<CartItem> items) {
        return items.stream()
            .filter(item -> item.getProduct() != null && item.getProduct().isAvailable())
            .filter(item -> item.getProduct().getOriginalPrice() > 0)
            .filter(item -> item.getProduct().getOriginalPrice() > item.getProduct().getPrice())
            .mapToDouble(item -> {
                Product product = item.getProduct();
                double savings = (product.getOriginalPrice() - product.getPrice()) * item.getQuantity();
                return savings;
            })
            .sum();
    }
    
    private List<CartItem> getUnavailableItems(List<CartItem> items) {
        return items.stream()
            .filter(item -> item.getProduct() == null || !item.getProduct().isAvailable())
            .collect(Collectors.toList());
    }
    
    private List<CartItem> getPriceChangedItems(List<CartItem> items) {
        return items.stream()
            .filter(CartItem::isPriceChanged)
            .collect(Collectors.toList());
    }
    
    // Quick add to cart (for AJAX requests)
    public Map<String, Object> quickAddToCart(String sessionId, String buyerId, String productId, Integer quantity) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            CartItem item = addToCart(sessionId, buyerId, productId, quantity);
            Map<String, Object> summary = getCartSummary(sessionId, buyerId);
            
            response.put("success", true);
            response.put("message", "Item added to cart");
            response.put("cartItem", item);
            response.put("cartSummary", summary);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return response;
    }
}