package com.projectai.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @NotNull
    @Column(name = "buyer_id")
    private String buyerId;
    
    @Column(name = "session_id")
    private String sessionId;
    
    @NotNull
    @DecimalMin("0.0")
    private Double subtotal;
    
    @NotNull
    @DecimalMin("0.0")
    private Double tax;
    
    @NotNull
    @DecimalMin("0.0")
    private Double shipping;
    
    @NotNull
    @DecimalMin("0.0")
    private Double total;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;
    
    @Column(name = "payment_method")
    private String paymentMethod;
    
    @Column(name = "payment_transaction_id")
    private String paymentTransactionId;
    
    // Shipping Address
    @Column(name = "shipping_name")
    private String shippingName;
    
    @Column(name = "shipping_address")
    private String shippingAddress;
    
    @Column(name = "shipping_city")
    private String shippingCity;
    
    @Column(name = "shipping_state")
    private String shippingState;
    
    @Column(name = "shipping_zip")
    private String shippingZip;
    
    @Column(name = "shipping_country")
    private String shippingCountry;
    
    @Column(name = "shipping_phone")
    private String shippingPhone;
    
    // Billing Address
    @Column(name = "billing_name")
    private String billingName;
    
    @Column(name = "billing_address")
    private String billingAddress;
    
    @Column(name = "billing_city")
    private String billingCity;
    
    @Column(name = "billing_state")
    private String billingState;
    
    @Column(name = "billing_zip")
    private String billingZip;
    
    @Column(name = "billing_country")
    private String billingCountry;
    
    @Column(name = "order_notes", length = 500)
    private String orderNotes;
    
    @Column(name = "estimated_delivery")
    private LocalDateTime estimatedDelivery;
    
    @Column(name = "tracking_number")
    private String trackingNumber;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;
    
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;
    
    public enum OrderStatus {
        PENDING,
        CONFIRMED,
        PROCESSING,
        SHIPPED,
        DELIVERED,
        CANCELLED,
        RETURNED
    }
    
    public enum PaymentStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        REFUNDED,
        CANCELLED
    }
    
    // Constructors
    public Order() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = OrderStatus.PENDING;
        this.paymentStatus = PaymentStatus.PENDING;
    }
    
    public Order(String buyerId, String sessionId) {
        this();
        this.buyerId = buyerId;
        this.sessionId = sessionId;
    }
    
    // Update timestamp on any change
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Helper methods
    public boolean isDelivered() {
        return status == OrderStatus.DELIVERED;
    }
    
    public boolean isCancellable() {
        return status == OrderStatus.PENDING || status == OrderStatus.CONFIRMED;
    }
    
    public boolean isReturnable() {
        return status == OrderStatus.DELIVERED && 
               deliveredAt != null && 
               deliveredAt.isAfter(LocalDateTime.now().minusDays(30));
    }
    
    public String getFormattedOrderNumber() {
        return "TH" + id.substring(0, 8).toUpperCase();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getBuyerId() {
        return buyerId;
    }
    
    public void setBuyerId(String buyerId) {
        this.buyerId = buyerId;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public Double getSubtotal() {
        return subtotal;
    }
    
    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }
    
    public Double getTax() {
        return tax;
    }
    
    public void setTax(Double tax) {
        this.tax = tax;
    }
    
    public Double getShipping() {
        return shipping;
    }
    
    public void setShipping(Double shipping) {
        this.shipping = shipping;
    }
    
    public Double getTotal() {
        return total;
    }
    
    public void setTotal(Double total) {
        this.total = total;
    }
    
    public OrderStatus getStatus() {
        return status;
    }
    
    public void setStatus(OrderStatus status) {
        this.status = status;
    }
    
    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }
    
    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
    
    public String getPaymentMethod() {
        return paymentMethod;
    }
    
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    
    public String getPaymentTransactionId() {
        return paymentTransactionId;
    }
    
    public void setPaymentTransactionId(String paymentTransactionId) {
        this.paymentTransactionId = paymentTransactionId;
    }
    
    public String getShippingName() {
        return shippingName;
    }
    
    public void setShippingName(String shippingName) {
        this.shippingName = shippingName;
    }
    
    public String getShippingAddress() {
        return shippingAddress;
    }
    
    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
    
    public String getShippingCity() {
        return shippingCity;
    }
    
    public void setShippingCity(String shippingCity) {
        this.shippingCity = shippingCity;
    }
    
    public String getShippingState() {
        return shippingState;
    }
    
    public void setShippingState(String shippingState) {
        this.shippingState = shippingState;
    }
    
    public String getShippingZip() {
        return shippingZip;
    }
    
    public void setShippingZip(String shippingZip) {
        this.shippingZip = shippingZip;
    }
    
    public String getShippingCountry() {
        return shippingCountry;
    }
    
    public void setShippingCountry(String shippingCountry) {
        this.shippingCountry = shippingCountry;
    }
    
    public String getShippingPhone() {
        return shippingPhone;
    }
    
    public void setShippingPhone(String shippingPhone) {
        this.shippingPhone = shippingPhone;
    }
    
    public String getBillingName() {
        return billingName;
    }
    
    public void setBillingName(String billingName) {
        this.billingName = billingName;
    }
    
    public String getBillingAddress() {
        return billingAddress;
    }
    
    public void setBillingAddress(String billingAddress) {
        this.billingAddress = billingAddress;
    }
    
    public String getBillingCity() {
        return billingCity;
    }
    
    public void setBillingCity(String billingCity) {
        this.billingCity = billingCity;
    }
    
    public String getBillingState() {
        return billingState;
    }
    
    public void setBillingState(String billingState) {
        this.billingState = billingState;
    }
    
    public String getBillingZip() {
        return billingZip;
    }
    
    public void setBillingZip(String billingZip) {
        this.billingZip = billingZip;
    }
    
    public String getBillingCountry() {
        return billingCountry;
    }
    
    public void setBillingCountry(String billingCountry) {
        this.billingCountry = billingCountry;
    }
    
    public String getOrderNotes() {
        return orderNotes;
    }
    
    public void setOrderNotes(String orderNotes) {
        this.orderNotes = orderNotes;
    }
    
    public LocalDateTime getEstimatedDelivery() {
        return estimatedDelivery;
    }
    
    public void setEstimatedDelivery(LocalDateTime estimatedDelivery) {
        this.estimatedDelivery = estimatedDelivery;
    }
    
    public String getTrackingNumber() {
        return trackingNumber;
    }
    
    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public LocalDateTime getShippedAt() {
        return shippedAt;
    }
    
    public void setShippedAt(LocalDateTime shippedAt) {
        this.shippedAt = shippedAt;
    }
    
    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }
    
    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
    
    public List<OrderItem> getOrderItems() {
        return orderItems;
    }
    
    public void setOrderItems(List<OrderItem> orderItems) {
        this.orderItems = orderItems;
    }
}