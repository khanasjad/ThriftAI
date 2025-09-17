package com.projectai.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "buyers")
public class Buyer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must be less than 50 characters")
    @Column(nullable = false, length = 50)
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must be less than 50 characters")
    @Column(nullable = false, length = 50)
    private String lastName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email")
    @Column(nullable = false, unique = true)
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Column(nullable = false)
    private String password;
    
    @Pattern(regexp = "^$|^\\+?[1-9]\\d{1,14}$", message = "Please enter a valid phone number or leave empty")
    private String phone;
    
    private LocalDate dateOfBirth;
    
    @Enumerated(EnumType.STRING)
    private Gender gender;
    
    // Address Information
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    
    // Shopping Preferences
    @ElementCollection
    @Enumerated(EnumType.STRING)
    private List<String> preferredCategories = new ArrayList<>();
    
    @ElementCollection
    private List<String> preferredBrands = new ArrayList<>();
    
    @ElementCollection
    private List<String> preferredSizes = new ArrayList<>();
    
    private double maxBudget = 500.0;
    private double minDiscountThreshold = 10.0; // Minimum discount percentage
    
    @Enumerated(EnumType.STRING)
    private BuyerType buyerType = BuyerType.CASUAL;
    
    // Account Status
    @Column(nullable = false)
    private boolean isActive = true;
    
    @Column(nullable = false)
    private boolean emailVerified = false;
    
    @Column(nullable = false)
    private boolean phoneVerified = false;
    
    // Shopping Stats
    private int totalOrders = 0;
    private double totalSpent = 0.0;
    private double averageOrderValue = 0.0;
    private int favoriteItems = 0;
    private double loyaltyPoints = 0.0;
    
    // Preferences
    private boolean receiveNewsletters = true;
    private boolean receiveDeals = true;
    private boolean receiveSms = false;
    
    @Enumerated(EnumType.STRING)
    private NotificationFrequency notificationFrequency = NotificationFrequency.WEEKLY;
    
    // Timestamps
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    private LocalDateTime lastOrderAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public Buyer() {}
    
    public Buyer(String firstName, String lastName, String email) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }
    
    // Helper methods
    public String getFullName() {
        return firstName + " " + lastName;
    }
    
    public void addPreferredCategory(String category) {
        if (!preferredCategories.contains(category)) {
            preferredCategories.add(category);
        }
    }
    
    public void addPreferredBrand(String brand) {
        if (!preferredBrands.contains(brand)) {
            preferredBrands.add(brand);
        }
    }
    
    public void addPreferredSize(String size) {
        if (!preferredSizes.contains(size)) {
            preferredSizes.add(size);
        }
    }
    
    public void updateOrderStats(double orderValue) {
        totalOrders++;
        totalSpent += orderValue;
        averageOrderValue = totalSpent / totalOrders;
        lastOrderAt = LocalDateTime.now();
        
        // Award loyalty points (1 point per dollar spent)
        loyaltyPoints += orderValue;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    
    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    
    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }
    
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    
    public List<String> getPreferredCategories() { return preferredCategories; }
    public void setPreferredCategories(List<String> preferredCategories) { this.preferredCategories = preferredCategories; }
    
    public List<String> getPreferredBrands() { return preferredBrands; }
    public void setPreferredBrands(List<String> preferredBrands) { this.preferredBrands = preferredBrands; }
    
    public List<String> getPreferredSizes() { return preferredSizes; }
    public void setPreferredSizes(List<String> preferredSizes) { this.preferredSizes = preferredSizes; }
    
    public double getMaxBudget() { return maxBudget; }
    public void setMaxBudget(double maxBudget) { this.maxBudget = maxBudget; }
    
    public double getMinDiscountThreshold() { return minDiscountThreshold; }
    public void setMinDiscountThreshold(double minDiscountThreshold) { this.minDiscountThreshold = minDiscountThreshold; }
    
    public BuyerType getBuyerType() { return buyerType; }
    public void setBuyerType(BuyerType buyerType) { this.buyerType = buyerType; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    
    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }
    
    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }
    
    public double getTotalSpent() { return totalSpent; }
    public void setTotalSpent(double totalSpent) { this.totalSpent = totalSpent; }
    
    public double getAverageOrderValue() { return averageOrderValue; }
    public void setAverageOrderValue(double averageOrderValue) { this.averageOrderValue = averageOrderValue; }
    
    public int getFavoriteItems() { return favoriteItems; }
    public void setFavoriteItems(int favoriteItems) { this.favoriteItems = favoriteItems; }
    
    public double getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(double loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }
    
    public boolean isReceiveNewsletters() { return receiveNewsletters; }
    public void setReceiveNewsletters(boolean receiveNewsletters) { this.receiveNewsletters = receiveNewsletters; }
    
    public boolean isReceiveDeals() { return receiveDeals; }
    public void setReceiveDeals(boolean receiveDeals) { this.receiveDeals = receiveDeals; }
    
    public boolean isReceiveSms() { return receiveSms; }
    public void setReceiveSms(boolean receiveSms) { this.receiveSms = receiveSms; }
    
    public NotificationFrequency getNotificationFrequency() { return notificationFrequency; }
    public void setNotificationFrequency(NotificationFrequency notificationFrequency) { this.notificationFrequency = notificationFrequency; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    
    public LocalDateTime getLastOrderAt() { return lastOrderAt; }
    public void setLastOrderAt(LocalDateTime lastOrderAt) { this.lastOrderAt = lastOrderAt; }
    
    // Enums
    public enum Gender {
        MALE, FEMALE, NON_BINARY, PREFER_NOT_TO_SAY
    }
    
    public enum BuyerType {
        CASUAL, FREQUENT, VIP, BULK_BUYER
    }
    
    public enum NotificationFrequency {
        NEVER, DAILY, WEEKLY, MONTHLY
    }
}