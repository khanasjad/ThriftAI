package com.projectai.service;

import org.springframework.stereotype.Service;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Modern password service with proper encryption and salt generation
 * Following 2025 security best practices
 */
@Service
public class PasswordService {
    
    private static final String ALGORITHM = "SHA-256";
    private static final int SALT_LENGTH = 32;
    
    /**
     * Hash password with salt using modern cryptographic practices
     */
    public String hashPassword(String password) {
        try {
            // Generate a random salt
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[SALT_LENGTH];
            random.nextBytes(salt);
            
            // Hash password with salt
            MessageDigest md = MessageDigest.getInstance(ALGORITHM);
            md.update(salt);
            byte[] hashedPassword = md.digest(password.getBytes(StandardCharsets.UTF_8));
            
            // Combine salt and hash for storage
            byte[] saltedHash = new byte[SALT_LENGTH + hashedPassword.length];
            System.arraycopy(salt, 0, saltedHash, 0, SALT_LENGTH);
            System.arraycopy(hashedPassword, 0, saltedHash, SALT_LENGTH, hashedPassword.length);
            
            return Base64.getEncoder().encodeToString(saltedHash);
            
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Password hashing failed", e);
        }
    }
    
    /**
     * Verify password against stored hash
     */
    public boolean verifyPassword(String password, String storedHash) {
        try {
            // Decode the stored hash
            byte[] saltedHash = Base64.getDecoder().decode(storedHash);
            
            // Extract salt
            byte[] salt = new byte[SALT_LENGTH];
            System.arraycopy(saltedHash, 0, salt, 0, SALT_LENGTH);
            
            // Hash the provided password with the same salt
            MessageDigest md = MessageDigest.getInstance(ALGORITHM);
            md.update(salt);
            byte[] hashedPassword = md.digest(password.getBytes(StandardCharsets.UTF_8));
            
            // Compare hashes
            if (saltedHash.length != SALT_LENGTH + hashedPassword.length) {
                return false;
            }
            
            for (int i = 0; i < hashedPassword.length; i++) {
                if (saltedHash[SALT_LENGTH + i] != hashedPassword[i]) {
                    return false;
                }
            }
            
            return true;
            
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Generate a secure random password (useful for temporary passwords)
     */
    public String generateSecurePassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();
        
        for (int i = 0; i < length; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return password.toString();
    }
    
    /**
     * Validate password strength (2025 standards)
     */
    public boolean isValidPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;
        
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
            else if ("!@#$%^&*()_+-=[]{}|;:,.<>?".contains(String.valueOf(c))) hasSpecial = true;
        }
        
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
    
    /**
     * Get password strength score (0-100)
     */
    public int getPasswordStrength(String password) {
        if (password == null) return 0;
        
        int score = 0;
        
        // Length bonus
        score += Math.min(password.length() * 4, 25);
        
        // Character variety bonus
        boolean hasUpper = password.matches(".*[A-Z].*");
        boolean hasLower = password.matches(".*[a-z].*");
        boolean hasDigit = password.matches(".*\\d.*");
        boolean hasSpecial = password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{}|;:,.<>?].*");
        
        if (hasUpper) score += 10;
        if (hasLower) score += 10;
        if (hasDigit) score += 10;
        if (hasSpecial) score += 15;
        
        // Complexity bonus
        if (hasUpper && hasLower && hasDigit && hasSpecial) score += 20;
        
        // Length penalties for short passwords
        if (password.length() < 8) score -= 20;
        if (password.length() < 6) score -= 20;
        
        return Math.max(0, Math.min(100, score));
    }
}