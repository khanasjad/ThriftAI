package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AdvancedSecurityAndFraudDetectionService {

    @Autowired
    private UserBehaviorAnalyticsService behaviorAnalyticsService;

    @Autowired
    private CachingAndPerformanceService cachingService;

    private final Map<String, SecurityProfile> userSecurityProfiles = new ConcurrentHashMap<>();
    private final Map<String, List<SecurityEvent>> securityEvents = new ConcurrentHashMap<>();
    private final Map<String, RiskAssessment> riskAssessments = new ConcurrentHashMap<>();
    private final Map<String, SecurityAlert> activeSecurityAlerts = new ConcurrentHashMap<>();
    private final Map<String, SessionData> activeSessions = new ConcurrentHashMap<>();
    private final Set<String> blacklistedIPs = ConcurrentHashMap.newKeySet();
    private final Set<String> blacklistedEmails = ConcurrentHashMap.newKeySet();
    private final Map<String, RateLimitData> rateLimits = new ConcurrentHashMap<>();

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 30;
    private static final int SESSION_TIMEOUT_MINUTES = 60;
    private static final double HIGH_RISK_THRESHOLD = 0.7;
    private static final double MEDIUM_RISK_THRESHOLD = 0.4;
    private static final String SECRET_KEY = "ThriftAI-Security-Key-2024"; // In production, use proper key management

    public enum ThreatType {
        BRUTE_FORCE_ATTACK, SUSPICIOUS_LOGIN, FRAUD_TRANSACTION, 
        FAKE_LISTING, ACCOUNT_TAKEOVER, DATA_BREACH_ATTEMPT,
        MALICIOUS_CONTENT, SPAM_ACTIVITY, PHISHING_ATTEMPT,
        PAYMENT_FRAUD, IDENTITY_THEFT, BOT_ACTIVITY
    }

    public enum SecurityEventType {
        LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, ACCOUNT_LOCKED,
        PASSWORD_CHANGED, SUSPICIOUS_ACTIVITY, PAYMENT_ATTEMPT,
        PROFILE_UPDATED, IP_BLOCKED, SESSION_EXPIRED
    }

    public enum RiskLevel {
        VERY_LOW(0.0, 0.2), LOW(0.2, 0.4), MEDIUM(0.4, 0.7), 
        HIGH(0.7, 0.9), CRITICAL(0.9, 1.0);

        private final double minScore;
        private final double maxScore;

        RiskLevel(double minScore, double maxScore) {
            this.minScore = minScore;
            this.maxScore = maxScore;
        }

        public static RiskLevel fromScore(double score) {
            for (RiskLevel level : values()) {
                if (score >= level.minScore && score < level.maxScore) {
                    return level;
                }
            }
            return CRITICAL;
        }
    }

    public enum SecurityAction {
        ALLOW, WARN, BLOCK, QUARANTINE, ESCALATE, MONITOR
    }

    public static class SecurityProfile {
        private String userId;
        private LocalDateTime createdAt;
        private LocalDateTime lastUpdated;
        private RiskLevel currentRiskLevel;
        private double riskScore;
        
        private AtomicInteger loginAttempts = new AtomicInteger(0);
        private LocalDateTime lastLoginAttempt;
        private LocalDateTime lockoutUntil;
        private Set<String> knownIPs = ConcurrentHashMap.newKeySet();
        private Set<String> knownDevices = ConcurrentHashMap.newKeySet();
        private List<String> securityFlags = new ArrayList<>();
        
        private boolean isVerified = false;
        private boolean twoFactorEnabled = false;
        private boolean isLocked = false;
        private boolean requiresVerification = false;
        
        private Map<String, Object> behaviorPattern = new HashMap<>();
        private Map<String, Integer> violationCounts = new HashMap<>();

        public SecurityProfile(String userId) {
            this.userId = userId;
            this.createdAt = LocalDateTime.now();
            this.lastUpdated = LocalDateTime.now();
            this.currentRiskLevel = RiskLevel.LOW;
            this.riskScore = 0.2;
        }

        // Getters and setters
        public String getUserId() { return userId; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
        
        public RiskLevel getCurrentRiskLevel() { return currentRiskLevel; }
        public void setCurrentRiskLevel(RiskLevel currentRiskLevel) { this.currentRiskLevel = currentRiskLevel; }
        
        public double getRiskScore() { return riskScore; }
        public void setRiskScore(double riskScore) { 
            this.riskScore = riskScore;
            this.currentRiskLevel = RiskLevel.fromScore(riskScore);
        }
        
        public int getLoginAttempts() { return loginAttempts.get(); }
        public void incrementLoginAttempts() { this.loginAttempts.incrementAndGet(); }
        public void resetLoginAttempts() { this.loginAttempts.set(0); }
        
        public LocalDateTime getLastLoginAttempt() { return lastLoginAttempt; }
        public void setLastLoginAttempt(LocalDateTime lastLoginAttempt) { this.lastLoginAttempt = lastLoginAttempt; }
        
        public LocalDateTime getLockoutUntil() { return lockoutUntil; }
        public void setLockoutUntil(LocalDateTime lockoutUntil) { this.lockoutUntil = lockoutUntil; }
        
        public Set<String> getKnownIPs() { return knownIPs; }
        public Set<String> getKnownDevices() { return knownDevices; }
        public List<String> getSecurityFlags() { return securityFlags; }
        
        public boolean isVerified() { return isVerified; }
        public void setVerified(boolean verified) { isVerified = verified; }
        
        public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
        public void setTwoFactorEnabled(boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }
        
        public boolean isLocked() { return isLocked; }
        public void setLocked(boolean locked) { isLocked = locked; }
        
        public boolean requiresVerification() { return requiresVerification; }
        public void setRequiresVerification(boolean requiresVerification) { this.requiresVerification = requiresVerification; }
        
        public Map<String, Object> getBehaviorPattern() { return behaviorPattern; }
        public Map<String, Integer> getViolationCounts() { return violationCounts; }
    }

    public static class SecurityEvent {
        private String eventId;
        private String userId;
        private SecurityEventType type;
        private String ipAddress;
        private String userAgent;
        private String deviceFingerprint;
        private LocalDateTime timestamp;
        private Map<String, Object> metadata;
        private boolean resolved;

        public SecurityEvent(String userId, SecurityEventType type, String ipAddress) {
            this.eventId = UUID.randomUUID().toString();
            this.userId = userId;
            this.type = type;
            this.ipAddress = ipAddress;
            this.timestamp = LocalDateTime.now();
            this.metadata = new HashMap<>();
            this.resolved = false;
        }

        // Getters and setters
        public String getEventId() { return eventId; }
        public String getUserId() { return userId; }
        public SecurityEventType getType() { return type; }
        public String getIpAddress() { return ipAddress; }
        public String getUserAgent() { return userAgent; }
        public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
        public String getDeviceFingerprint() { return deviceFingerprint; }
        public void setDeviceFingerprint(String deviceFingerprint) { this.deviceFingerprint = deviceFingerprint; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public Map<String, Object> getMetadata() { return metadata; }
        public boolean isResolved() { return resolved; }
        public void setResolved(boolean resolved) { this.resolved = resolved; }
    }

    public static class RiskAssessment {
        private String userId;
        private double overallRiskScore;
        private RiskLevel riskLevel;
        private Map<String, Double> riskFactors;
        private List<String> riskReasons;
        private SecurityAction recommendedAction;
        private LocalDateTime assessmentTime;
        private Map<String, Object> contextData;

        public RiskAssessment(String userId) {
            this.userId = userId;
            this.riskFactors = new HashMap<>();
            this.riskReasons = new ArrayList<>();
            this.assessmentTime = LocalDateTime.now();
            this.contextData = new HashMap<>();
        }

        // Getters and setters
        public String getUserId() { return userId; }
        public double getOverallRiskScore() { return overallRiskScore; }
        public void setOverallRiskScore(double overallRiskScore) { 
            this.overallRiskScore = overallRiskScore;
            this.riskLevel = RiskLevel.fromScore(overallRiskScore);
        }
        public RiskLevel getRiskLevel() { return riskLevel; }
        public Map<String, Double> getRiskFactors() { return riskFactors; }
        public List<String> getRiskReasons() { return riskReasons; }
        public SecurityAction getRecommendedAction() { return recommendedAction; }
        public void setRecommendedAction(SecurityAction recommendedAction) { this.recommendedAction = recommendedAction; }
        public LocalDateTime getAssessmentTime() { return assessmentTime; }
        public Map<String, Object> getContextData() { return contextData; }
    }

    public static class SecurityAlert {
        private String alertId;
        private String userId;
        private ThreatType threatType;
        private String title;
        private String description;
        private RiskLevel severity;
        private SecurityAction actionTaken;
        private LocalDateTime detectedAt;
        private LocalDateTime resolvedAt;
        private boolean isActive;
        private Map<String, Object> threatDetails;

        public SecurityAlert(String userId, ThreatType threatType, String title, String description) {
            this.alertId = UUID.randomUUID().toString();
            this.userId = userId;
            this.threatType = threatType;
            this.title = title;
            this.description = description;
            this.detectedAt = LocalDateTime.now();
            this.isActive = true;
            this.threatDetails = new HashMap<>();
        }

        // Getters and setters
        public String getAlertId() { return alertId; }
        public String getUserId() { return userId; }
        public ThreatType getThreatType() { return threatType; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public RiskLevel getSeverity() { return severity; }
        public void setSeverity(RiskLevel severity) { this.severity = severity; }
        public SecurityAction getActionTaken() { return actionTaken; }
        public void setActionTaken(SecurityAction actionTaken) { this.actionTaken = actionTaken; }
        public LocalDateTime getDetectedAt() { return detectedAt; }
        public LocalDateTime getResolvedAt() { return resolvedAt; }
        public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
        public boolean isActive() { return isActive; }
        public void setActive(boolean active) { isActive = active; }
        public Map<String, Object> getThreatDetails() { return threatDetails; }
    }

    public static class SessionData {
        private String sessionId;
        private String userId;
        private String ipAddress;
        private String deviceFingerprint;
        private LocalDateTime createdAt;
        private LocalDateTime lastActivity;
        private boolean isValid;
        private Map<String, Object> sessionAttributes;

        public SessionData(String sessionId, String userId, String ipAddress) {
            this.sessionId = sessionId;
            this.userId = userId;
            this.ipAddress = ipAddress;
            this.createdAt = LocalDateTime.now();
            this.lastActivity = LocalDateTime.now();
            this.isValid = true;
            this.sessionAttributes = new HashMap<>();
        }

        // Getters and setters
        public String getSessionId() { return sessionId; }
        public String getUserId() { return userId; }
        public String getIpAddress() { return ipAddress; }
        public String getDeviceFingerprint() { return deviceFingerprint; }
        public void setDeviceFingerprint(String deviceFingerprint) { this.deviceFingerprint = deviceFingerprint; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getLastActivity() { return lastActivity; }
        public void setLastActivity(LocalDateTime lastActivity) { this.lastActivity = lastActivity; }
        public boolean isValid() { return isValid; }
        public void setValid(boolean valid) { isValid = valid; }
        public Map<String, Object> getSessionAttributes() { return sessionAttributes; }
    }

    public static class RateLimitData {
        private String identifier;
        private AtomicInteger requestCount = new AtomicInteger(0);
        private LocalDateTime windowStart;
        private LocalDateTime lastRequest;
        private boolean isBlocked;

        public RateLimitData(String identifier) {
            this.identifier = identifier;
            this.windowStart = LocalDateTime.now();
            this.lastRequest = LocalDateTime.now();
        }

        // Getters and setters
        public String getIdentifier() { return identifier; }
        public int getRequestCount() { return requestCount.get(); }
        public void incrementRequestCount() { this.requestCount.incrementAndGet(); }
        public void resetRequestCount() { this.requestCount.set(0); }
        public LocalDateTime getWindowStart() { return windowStart; }
        public void setWindowStart(LocalDateTime windowStart) { this.windowStart = windowStart; }
        public LocalDateTime getLastRequest() { return lastRequest; }
        public void setLastRequest(LocalDateTime lastRequest) { this.lastRequest = lastRequest; }
        public boolean isBlocked() { return isBlocked; }
        public void setBlocked(boolean blocked) { isBlocked = blocked; }
    }

    @Async
    public CompletableFuture<RiskAssessment> assessUserRisk(String userId, Map<String, Object> context) {
        return CompletableFuture.supplyAsync(() -> {
            RiskAssessment assessment = new RiskAssessment(userId);
            SecurityProfile profile = userSecurityProfiles.get(userId);
            
            if (profile == null) {
                profile = createSecurityProfile(userId);
            }

            // Calculate risk factors
            Map<String, Double> riskFactors = assessment.getRiskFactors();
            
            // Account age factor
            long accountAgeDays = ChronoUnit.DAYS.between(profile.getCreatedAt(), LocalDateTime.now());
            riskFactors.put("account_age", calculateAccountAgeRisk(accountAgeDays));
            
            // Login pattern factor
            riskFactors.put("login_pattern", calculateLoginPatternRisk(userId, context));
            
            // Device/IP factor
            riskFactors.put("device_ip", calculateDeviceIPRisk(userId, context));
            
            // Behavior factor
            riskFactors.put("behavior", calculateBehaviorRisk(userId));
            
            // Transaction factor
            riskFactors.put("transaction", calculateTransactionRisk(userId, context));
            
            // Violation history factor
            riskFactors.put("violation_history", calculateViolationHistoryRisk(profile));
            
            // Calculate overall risk score
            double overallRisk = calculateOverallRiskScore(riskFactors);
            assessment.setOverallRiskScore(overallRisk);
            
            // Generate risk reasons
            generateRiskReasons(assessment, riskFactors);
            
            // Determine recommended action
            assessment.setRecommendedAction(determineSecurityAction(overallRisk));
            
            // Update user profile
            profile.setRiskScore(overallRisk);
            profile.setLastUpdated(LocalDateTime.now());
            
            riskAssessments.put(userId, assessment);
            return assessment;
        });
    }

    private SecurityProfile createSecurityProfile(String userId) {
        SecurityProfile profile = new SecurityProfile(userId);
        userSecurityProfiles.put(userId, profile);
        return profile;
    }

    private double calculateAccountAgeRisk(long accountAgeDays) {
        if (accountAgeDays < 1) return 0.8; // Very new account
        if (accountAgeDays < 7) return 0.6; // Less than a week
        if (accountAgeDays < 30) return 0.4; // Less than a month
        if (accountAgeDays < 90) return 0.2; // Less than 3 months
        return 0.1; // Established account
    }

    private double calculateLoginPatternRisk(String userId, Map<String, Object> context) {
        SecurityProfile profile = userSecurityProfiles.get(userId);
        if (profile == null) return 0.5;
        
        double risk = 0.0;
        
        // Check for multiple failed attempts
        if (profile.getLoginAttempts() > 3) {
            risk += 0.3;
        }
        
        // Check login frequency
        if (profile.getLastLoginAttempt() != null) {
            long minutesSinceLastAttempt = ChronoUnit.MINUTES.between(
                profile.getLastLoginAttempt(), LocalDateTime.now());
            if (minutesSinceLastAttempt < 1) {
                risk += 0.4; // Too frequent attempts
            }
        }
        
        // Check for unusual login times
        int currentHour = LocalDateTime.now().getHour();
        if (currentHour < 6 || currentHour > 23) {
            risk += 0.2; // Unusual hours
        }
        
        return Math.min(risk, 1.0);
    }

    private double calculateDeviceIPRisk(String userId, Map<String, Object> context) {
        SecurityProfile profile = userSecurityProfiles.get(userId);
        if (profile == null) return 0.5;
        
        String currentIP = (String) context.get("ip_address");
        String deviceFingerprint = (String) context.get("device_fingerprint");
        
        double risk = 0.0;
        
        // Check if IP is blacklisted
        if (currentIP != null && blacklistedIPs.contains(currentIP)) {
            risk += 0.9;
        }
        
        // Check if IP is new/unknown
        if (currentIP != null && !profile.getKnownIPs().contains(currentIP)) {
            risk += 0.3;
            profile.getKnownIPs().add(currentIP);
        }
        
        // Check if device is new/unknown
        if (deviceFingerprint != null && !profile.getKnownDevices().contains(deviceFingerprint)) {
            risk += 0.4;
            profile.getKnownDevices().add(deviceFingerprint);
        }
        
        // Check for rapid IP changes
        if (profile.getKnownIPs().size() > 10) {
            risk += 0.2; // Too many different IPs
        }
        
        return Math.min(risk, 1.0);
    }

    private double calculateBehaviorRisk(String userId) {
        // Analyze user behavior patterns
        double risk = 0.0;
        
        // Check for bot-like behavior
        if (detectBotBehavior(userId)) {
            risk += 0.6;
        }
        
        // Check for suspicious browsing patterns
        if (detectSuspiciousBrowsingPattern(userId)) {
            risk += 0.4;
        }
        
        return Math.min(risk, 1.0);
    }

    private double calculateTransactionRisk(String userId, Map<String, Object> context) {
        BigDecimal transactionAmount = (BigDecimal) context.get("transaction_amount");
        if (transactionAmount == null) return 0.0;
        
        double risk = 0.0;
        
        // Check for unusually large transactions
        if (transactionAmount.compareTo(new BigDecimal("1000")) > 0) {
            risk += 0.5;
        }
        
        // Check for rapid successive transactions
        if (detectRapidTransactions(userId)) {
            risk += 0.4;
        }
        
        return Math.min(risk, 1.0);
    }

    private double calculateViolationHistoryRisk(SecurityProfile profile) {
        int totalViolations = profile.getViolationCounts().values().stream()
            .mapToInt(Integer::intValue).sum();
        
        if (totalViolations == 0) return 0.0;
        if (totalViolations < 3) return 0.2;
        if (totalViolations < 5) return 0.5;
        return 0.8;
    }

    private double calculateOverallRiskScore(Map<String, Double> riskFactors) {
        // Weighted average of risk factors
        Map<String, Double> weights = Map.of(
            "account_age", 0.15,
            "login_pattern", 0.25,
            "device_ip", 0.20,
            "behavior", 0.20,
            "transaction", 0.15,
            "violation_history", 0.05
        );
        
        double weightedSum = 0.0;
        double totalWeight = 0.0;
        
        for (Map.Entry<String, Double> entry : weights.entrySet()) {
            Double riskValue = riskFactors.get(entry.getKey());
            if (riskValue != null) {
                weightedSum += riskValue * entry.getValue();
                totalWeight += entry.getValue();
            }
        }
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0.0;
    }

    private void generateRiskReasons(RiskAssessment assessment, Map<String, Double> riskFactors) {
        List<String> reasons = assessment.getRiskReasons();
        
        for (Map.Entry<String, Double> entry : riskFactors.entrySet()) {
            if (entry.getValue() > 0.5) {
                reasons.add(generateRiskReason(entry.getKey(), entry.getValue()));
            }
        }
    }

    private String generateRiskReason(String factor, double value) {
        switch (factor) {
            case "account_age":
                return "Account is relatively new";
            case "login_pattern":
                return "Suspicious login patterns detected";
            case "device_ip":
                return "Unknown device or IP address";
            case "behavior":
                return "Unusual user behavior detected";
            case "transaction":
                return "Suspicious transaction patterns";
            case "violation_history":
                return "Previous security violations";
            default:
                return "Unknown risk factor: " + factor;
        }
    }

    private SecurityAction determineSecurityAction(double riskScore) {
        if (riskScore >= 0.9) return SecurityAction.BLOCK;
        if (riskScore >= 0.7) return SecurityAction.QUARANTINE;
        if (riskScore >= 0.4) return SecurityAction.WARN;
        if (riskScore >= 0.2) return SecurityAction.MONITOR;
        return SecurityAction.ALLOW;
    }

    private boolean detectBotBehavior(String userId) {
        // Simulate bot detection logic
        return ThreadLocalRandom.current().nextDouble() < 0.1;
    }

    private boolean detectSuspiciousBrowsingPattern(String userId) {
        // Simulate suspicious browsing detection
        return ThreadLocalRandom.current().nextDouble() < 0.15;
    }

    private boolean detectRapidTransactions(String userId) {
        // Simulate rapid transaction detection
        return ThreadLocalRandom.current().nextDouble() < 0.2;
    }

    @Async
    public CompletableFuture<SecurityAlert> detectThreat(String userId, ThreatType threatType, Map<String, Object> context) {
        return CompletableFuture.supplyAsync(() -> {
            SecurityAlert alert = null;
            
            switch (threatType) {
                case BRUTE_FORCE_ATTACK:
                    alert = detectBruteForceAttack(userId, context);
                    break;
                case SUSPICIOUS_LOGIN:
                    alert = detectSuspiciousLogin(userId, context);
                    break;
                case FRAUD_TRANSACTION:
                    alert = detectFraudTransaction(userId, context);
                    break;
                case FAKE_LISTING:
                    alert = detectFakeListing(userId, context);
                    break;
                case BOT_ACTIVITY:
                    alert = detectBotActivity(userId, context);
                    break;
                default:
                    alert = createGenericThreatAlert(userId, threatType, context);
            }
            
            if (alert != null) {
                activeSecurityAlerts.put(alert.getAlertId(), alert);
                processSecurityAlert(alert);
            }
            
            return alert;
        });
    }

    private SecurityAlert detectBruteForceAttack(String userId, Map<String, Object> context) {
        SecurityProfile profile = userSecurityProfiles.get(userId);
        if (profile != null && profile.getLoginAttempts() >= MAX_LOGIN_ATTEMPTS) {
            SecurityAlert alert = new SecurityAlert(userId, ThreatType.BRUTE_FORCE_ATTACK,
                "Brute Force Attack Detected",
                "Multiple failed login attempts detected for user account.");
            alert.setSeverity(RiskLevel.HIGH);
            alert.setActionTaken(SecurityAction.BLOCK);
            
            // Lock account
            profile.setLocked(true);
            profile.setLockoutUntil(LocalDateTime.now().plusMinutes(LOCKOUT_DURATION_MINUTES));
            
            return alert;
        }
        return null;
    }

    private SecurityAlert detectSuspiciousLogin(String userId, Map<String, Object> context) {
        String ipAddress = (String) context.get("ip_address");
        String location = (String) context.get("location");
        
        if (ipAddress != null && isUnusualLocation(userId, location)) {
            SecurityAlert alert = new SecurityAlert(userId, ThreatType.SUSPICIOUS_LOGIN,
                "Suspicious Login Location",
                "Login detected from unusual location: " + location);
            alert.setSeverity(RiskLevel.MEDIUM);
            alert.setActionTaken(SecurityAction.WARN);
            
            return alert;
        }
        return null;
    }

    private SecurityAlert detectFraudTransaction(String userId, Map<String, Object> context) {
        BigDecimal amount = (BigDecimal) context.get("transaction_amount");
        if (amount != null && amount.compareTo(new BigDecimal("5000")) > 0) {
            SecurityAlert alert = new SecurityAlert(userId, ThreatType.FRAUD_TRANSACTION,
                "High Value Transaction Alert",
                "Large transaction amount detected: $" + amount);
            alert.setSeverity(RiskLevel.HIGH);
            alert.setActionTaken(SecurityAction.QUARANTINE);
            
            return alert;
        }
        return null;
    }

    private SecurityAlert detectFakeListing(String userId, Map<String, Object> context) {
        String productId = (String) context.get("product_id");
        if (productId != null && detectFakeProductListing(productId)) {
            SecurityAlert alert = new SecurityAlert(userId, ThreatType.FAKE_LISTING,
                "Fake Product Listing Detected",
                "Potentially fraudulent product listing identified.");
            alert.setSeverity(RiskLevel.MEDIUM);
            alert.setActionTaken(SecurityAction.QUARANTINE);
            
            return alert;
        }
        return null;
    }

    private SecurityAlert detectBotActivity(String userId, Map<String, Object> context) {
        if (detectBotBehavior(userId)) {
            SecurityAlert alert = new SecurityAlert(userId, ThreatType.BOT_ACTIVITY,
                "Bot Activity Detected",
                "Automated bot behavior patterns identified.");
            alert.setSeverity(RiskLevel.MEDIUM);
            alert.setActionTaken(SecurityAction.MONITOR);
            
            return alert;
        }
        return null;
    }

    private SecurityAlert createGenericThreatAlert(String userId, ThreatType threatType, Map<String, Object> context) {
        SecurityAlert alert = new SecurityAlert(userId, threatType,
            "Security Threat Detected",
            "Potential security threat of type: " + threatType);
        alert.setSeverity(RiskLevel.MEDIUM);
        alert.setActionTaken(SecurityAction.MONITOR);
        return alert;
    }

    private boolean isUnusualLocation(String userId, String location) {
        // Simulate location analysis
        return ThreadLocalRandom.current().nextDouble() < 0.3;
    }

    private boolean detectFakeProductListing(String productId) {
        // Simulate fake listing detection
        return ThreadLocalRandom.current().nextDouble() < 0.1;
    }

    private void processSecurityAlert(SecurityAlert alert) {
        // Log security event
        recordSecurityEvent(alert.getUserId(), SecurityEventType.SUSPICIOUS_ACTIVITY, 
            "Security alert generated: " + alert.getThreatType());
        
        // Execute security action
        executeSecurityAction(alert);
        
        // Notify security team if critical
        if (alert.getSeverity() == RiskLevel.CRITICAL || alert.getSeverity() == RiskLevel.HIGH) {
            notifySecurityTeam(alert);
        }
    }

    private void executeSecurityAction(SecurityAlert alert) {
        switch (alert.getActionTaken()) {
            case BLOCK:
                blockUser(alert.getUserId());
                break;
            case QUARANTINE:
                quarantineUser(alert.getUserId());
                break;
            case WARN:
                warnUser(alert.getUserId(), alert.getDescription());
                break;
            case MONITOR:
                addUserToMonitoring(alert.getUserId());
                break;
        }
    }

    private void blockUser(String userId) {
        SecurityProfile profile = userSecurityProfiles.get(userId);
        if (profile != null) {
            profile.setLocked(true);
            profile.getSecurityFlags().add("BLOCKED");
        }
        
        // Invalidate all user sessions
        invalidateUserSessions(userId);
    }

    private void quarantineUser(String userId) {
        SecurityProfile profile = userSecurityProfiles.get(userId);
        if (profile != null) {
            profile.setRequiresVerification(true);
            profile.getSecurityFlags().add("QUARANTINED");
        }
    }

    private void warnUser(String userId, String message) {
        SecurityProfile profile = userSecurityProfiles.get(userId);
        if (profile != null) {
            profile.getSecurityFlags().add("WARNING_ISSUED");
        }
        // In a real system, this would send a notification to the user
    }

    private void addUserToMonitoring(String userId) {
        SecurityProfile profile = userSecurityProfiles.get(userId);
        if (profile != null) {
            profile.getSecurityFlags().add("MONITORING");
        }
    }

    private void notifySecurityTeam(SecurityAlert alert) {
        // In a real system, this would send alerts to security team
        System.out.println("SECURITY ALERT: " + alert.getTitle() + " for user " + alert.getUserId());
    }

    public void recordSecurityEvent(String userId, SecurityEventType eventType, String ipAddress) {
        SecurityEvent event = new SecurityEvent(userId, eventType, ipAddress);
        
        securityEvents.computeIfAbsent(userId, k -> new ArrayList<>()).add(event);
        
        // Clean old events
        cleanOldSecurityEvents(userId);
        
        // Update security profile based on event
        updateSecurityProfileFromEvent(userId, event);
    }

    private void cleanOldSecurityEvents(String userId) {
        List<SecurityEvent> events = securityEvents.get(userId);
        if (events != null) {
            LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
            events.removeIf(event -> event.getTimestamp().isBefore(cutoff));
        }
    }

    private void updateSecurityProfileFromEvent(String userId, SecurityEvent event) {
        SecurityProfile profile = userSecurityProfiles.computeIfAbsent(userId, SecurityProfile::new);
        
        switch (event.getType()) {
            case LOGIN_FAILURE:
                profile.incrementLoginAttempts();
                profile.setLastLoginAttempt(LocalDateTime.now());
                break;
            case LOGIN_SUCCESS:
                profile.resetLoginAttempts();
                profile.setLastLoginAttempt(LocalDateTime.now());
                break;
            case ACCOUNT_LOCKED:
                profile.setLocked(true);
                break;
        }
        
        profile.setLastUpdated(LocalDateTime.now());
    }

    public boolean validateSession(String sessionId) {
        SessionData session = activeSessions.get(sessionId);
        if (session == null || !session.isValid()) {
            return false;
        }
        
        // Check session timeout
        if (ChronoUnit.MINUTES.between(session.getLastActivity(), LocalDateTime.now()) > SESSION_TIMEOUT_MINUTES) {
            session.setValid(false);
            recordSecurityEvent(session.getUserId(), SecurityEventType.SESSION_EXPIRED, session.getIpAddress());
            return false;
        }
        
        // Update last activity
        session.setLastActivity(LocalDateTime.now());
        return true;
    }

    public String createSecureSession(String userId, String ipAddress, String deviceFingerprint) {
        String sessionId = generateSecureSessionId();
        SessionData session = new SessionData(sessionId, userId, ipAddress);
        session.setDeviceFingerprint(deviceFingerprint);
        
        activeSessions.put(sessionId, session);
        return sessionId;
    }

    private String generateSecureSessionId() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }

    public void invalidateSession(String sessionId) {
        SessionData session = activeSessions.get(sessionId);
        if (session != null) {
            session.setValid(false);
            recordSecurityEvent(session.getUserId(), SecurityEventType.LOGOUT, session.getIpAddress());
        }
    }

    private void invalidateUserSessions(String userId) {
        activeSessions.values().stream()
            .filter(session -> session.getUserId().equals(userId))
            .forEach(session -> session.setValid(false));
    }

    public boolean checkRateLimit(String identifier, int maxRequests, int windowMinutes) {
        RateLimitData rateLimit = rateLimits.computeIfAbsent(identifier, RateLimitData::new);
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = rateLimit.getWindowStart();
        
        // Reset window if expired
        if (ChronoUnit.MINUTES.between(windowStart, now) >= windowMinutes) {
            rateLimit.setWindowStart(now);
            rateLimit.resetRequestCount();
            rateLimit.setBlocked(false);
        }
        
        // Check if already blocked
        if (rateLimit.isBlocked()) {
            return false;
        }
        
        // Increment and check limit
        rateLimit.incrementRequestCount();
        rateLimit.setLastRequest(now);
        
        if (rateLimit.getRequestCount() > maxRequests) {
            rateLimit.setBlocked(true);
            return false;
        }
        
        return true;
    }

    public String encryptSensitiveData(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String hashPassword(String password, String salt) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(salt.getBytes(StandardCharsets.UTF_8));
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Password hashing failed", e);
        }
    }

    public String generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[16];
        random.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }

    public void addToBlacklist(String ipAddress, String email) {
        if (ipAddress != null) {
            blacklistedIPs.add(ipAddress);
        }
        if (email != null) {
            blacklistedEmails.add(email);
        }
    }

    public boolean isBlacklisted(String ipAddress, String email) {
        return (ipAddress != null && blacklistedIPs.contains(ipAddress)) ||
               (email != null && blacklistedEmails.contains(email));
    }

    public CompletableFuture<List<SecurityAlert>> getActiveSecurityAlerts(String userId) {
        return CompletableFuture.supplyAsync(() -> {
            return activeSecurityAlerts.values().stream()
                .filter(alert -> alert.getUserId().equals(userId) && alert.isActive())
                .sorted((a, b) -> b.getDetectedAt().compareTo(a.getDetectedAt()))
                .collect(Collectors.toList());
        });
    }

    public CompletableFuture<Map<String, Object>> generateSecurityReport() {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> report = new HashMap<>();
            
            // Overall statistics
            report.put("total_users", userSecurityProfiles.size());
            report.put("active_sessions", activeSessions.size());
            report.put("active_alerts", activeSecurityAlerts.size());
            report.put("blacklisted_ips", blacklistedIPs.size());
            
            // Risk distribution
            Map<RiskLevel, Long> riskDistribution = userSecurityProfiles.values().stream()
                .collect(Collectors.groupingBy(SecurityProfile::getCurrentRiskLevel, Collectors.counting()));
            report.put("risk_distribution", riskDistribution);
            
            // Top threats
            Map<ThreatType, Long> threatCounts = activeSecurityAlerts.values().stream()
                .collect(Collectors.groupingBy(SecurityAlert::getThreatType, Collectors.counting()));
            report.put("threat_types", threatCounts);
            
            // Recent activity
            long recentEvents = securityEvents.values().stream()
                .flatMap(List::stream)
                .filter(event -> event.getTimestamp().isAfter(LocalDateTime.now().minusHours(24)))
                .count();
            report.put("events_24h", recentEvents);
            
            return report;
        });
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void performSecurityMaintenanceTasks() {
        // Clean expired sessions
        cleanExpiredSessions();
        
        // Reset lockouts
        resetExpiredLockouts();
        
        // Clean old events
        cleanOldEvents();
        
        // Update risk assessments
        updateRiskAssessments();
    }

    private void cleanExpiredSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(SESSION_TIMEOUT_MINUTES);
        activeSessions.entrySet().removeIf(entry -> 
            entry.getValue().getLastActivity().isBefore(cutoff));
    }

    private void resetExpiredLockouts() {
        LocalDateTime now = LocalDateTime.now();
        userSecurityProfiles.values().stream()
            .filter(profile -> profile.isLocked() && 
                     profile.getLockoutUntil() != null && 
                     profile.getLockoutUntil().isBefore(now))
            .forEach(profile -> {
                profile.setLocked(false);
                profile.setLockoutUntil(null);
                profile.resetLoginAttempts();
            });
    }

    private void cleanOldEvents() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        securityEvents.values().forEach(eventList -> 
            eventList.removeIf(event -> event.getTimestamp().isBefore(cutoff)));
    }

    private void updateRiskAssessments() {
        userSecurityProfiles.keySet().parallelStream()
            .forEach(userId -> {
                try {
                    assessUserRisk(userId, new HashMap<>()).get();
                } catch (Exception e) {
                    System.err.println("Error updating risk assessment for user " + userId + ": " + e.getMessage());
                }
            });
    }

    public void resolveSecurityAlert(String alertId) {
        SecurityAlert alert = activeSecurityAlerts.get(alertId);
        if (alert != null) {
            alert.setActive(false);
            alert.setResolvedAt(LocalDateTime.now());
        }
    }

    public CompletableFuture<Boolean> validateContentSafety(String content) {
        return CompletableFuture.supplyAsync(() -> {
            // Simulate content safety validation
            Pattern maliciousPattern = Pattern.compile("(?i)(hack|exploit|malware|phishing|scam)");
            return !maliciousPattern.matcher(content).find();
        });
    }
}