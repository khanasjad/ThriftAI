package com.projectai.controller;

import com.projectai.models.Buyer;
import com.projectai.models.Seller;
import com.projectai.repository.BuyerRepository;
import com.projectai.repository.SellerRepository;
import com.projectai.service.PasswordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import org.springframework.http.ResponseEntity;

@Controller
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private BuyerRepository buyerRepository;
    
    @Autowired
    private SellerRepository sellerRepository;
    
    @Autowired
    private PasswordService passwordService;

    // ============= REGISTRATION ENDPOINTS =============
    
    @GetMapping("/signup")
    public String showSignupPage(Model model) {
        model.addAttribute("buyer", new Buyer());
        model.addAttribute("seller", new Seller());
        return "auth/signup";
    }
    
    @PostMapping("/signup/buyer")
    public String registerBuyer(@Valid @ModelAttribute("buyer") Buyer buyer,
                               BindingResult result,
                               RedirectAttributes redirectAttributes,
                               Model model) {

        System.out.println("🔍 Signup attempt - Email: " + buyer.getEmail() + ", FirstName: " + buyer.getFirstName());

        if (result.hasErrors()) {
            System.out.println("❌ Validation errors found:");
            result.getAllErrors().forEach(error ->
                System.out.println("  - " + error.getDefaultMessage()));
            model.addAttribute("seller", new Seller());
            model.addAttribute("signupType", "buyer");
            return "auth/signup";
        }
        
        // Check if email already exists
        if (buyerRepository.findByEmail(buyer.getEmail()).isPresent() ||
            sellerRepository.findByEmail(buyer.getEmail()).isPresent()) {
            result.rejectValue("email", "error.buyer", "Email is already registered");
            model.addAttribute("seller", new Seller());
            model.addAttribute("signupType", "buyer");
            return "auth/signup";
        }
        
        // Validate password strength
        if (!passwordService.isValidPassword(buyer.getPassword())) {
            result.rejectValue("password", "error.buyer", 
                "Password must be at least 8 characters with uppercase, lowercase, number and special character");
            model.addAttribute("seller", new Seller());
            model.addAttribute("signupType", "buyer");
            return "auth/signup";
        }
        
        // Hash password before saving
        buyer.setPassword(passwordService.hashPassword(buyer.getPassword()));
        
        // Set default values
        buyer.setId(UUID.randomUUID().toString());
        buyer.setCreatedAt(LocalDateTime.now());
        buyer.setUpdatedAt(LocalDateTime.now());
        buyer.setActive(true);
        buyer.setEmailVerified(false);
        buyer.setPhoneVerified(false);
        buyer.setTotalOrders(0);
        buyer.setTotalSpent(0.0);
        buyer.setLoyaltyPoints(0.0);
        buyer.setAverageOrderValue(0.0);
        buyer.setFavoriteItems(0);
        buyer.setMaxBudget(1000.0); // Default budget
        buyer.setMinDiscountThreshold(10.0); // Default 10% discount threshold
        buyer.setReceiveNewsletters(true);
        buyer.setReceiveDeals(true);
        buyer.setReceiveSms(false);
        
        buyerRepository.save(buyer);
        
        redirectAttributes.addFlashAttribute("successMessage", 
            "Account created successfully! Welcome to ThriftAI, " + buyer.getFirstName() + "!");
        
        return "redirect:/auth/login";
    }
    
    @PostMapping("/signup/seller")
    public String registerSeller(@Valid @ModelAttribute("seller") Seller seller,
                                BindingResult result,
                                RedirectAttributes redirectAttributes,
                                Model model) {
        
        if (result.hasErrors()) {
            model.addAttribute("buyer", new Buyer());
            model.addAttribute("signupType", "seller");
            return "auth/signup";
        }
        
        // Check if email already exists
        if (buyerRepository.findByEmail(seller.getEmail()).isPresent() ||
            sellerRepository.findByEmail(seller.getEmail()).isPresent()) {
            result.rejectValue("email", "error.seller", "Email is already registered");
            model.addAttribute("buyer", new Buyer());
            model.addAttribute("signupType", "seller");
            return "auth/signup";
        }
        
        // Validate password strength
        if (!passwordService.isValidPassword(seller.getPassword())) {
            result.rejectValue("password", "error.seller", 
                "Password must be at least 8 characters with uppercase, lowercase, number and special character");
            model.addAttribute("buyer", new Buyer());
            model.addAttribute("signupType", "seller");
            return "auth/signup";
        }
        
        // Hash password before saving
        seller.setPassword(passwordService.hashPassword(seller.getPassword()));
        
        // Set default values
        seller.setId(UUID.randomUUID().toString());
        seller.setCreatedAt(LocalDateTime.now());
        seller.setUpdatedAt(LocalDateTime.now());
        seller.setActive(true);
        seller.setVerified(false);
        seller.setStatus(Seller.SellerStatus.PENDING);
        seller.setRating(0.0);
        seller.setTotalSales(0);
        seller.setTotalRevenue(BigDecimal.ZERO);
        seller.setCommissionRate(5.0); // Default 5% commission
        
        sellerRepository.save(seller);
        
        redirectAttributes.addFlashAttribute("successMessage", 
            "Seller account created successfully! Your account is pending approval. We'll notify you once it's approved.");
        
        return "redirect:/auth/login";
    }

    // ============= LOGIN ENDPOINTS =============
    
    @GetMapping("/login")
    public String showLoginPage(Model model) {
        return "auth/login";
    }
    
    @PostMapping("/login")
    public String processLogin(@RequestParam String email,
                              @RequestParam String password,
                              @RequestParam(required = false) String userType,
                              HttpSession session,
                              RedirectAttributes redirectAttributes,
                              Model model) {

        System.out.println("🔍 Login attempt - Email: " + email + ", UserType: " + userType);

        if (userType == null || userType.isEmpty()) {
            userType = "buyer"; // Default to buyer
        }

        if ("buyer".equals(userType)) {
            var buyer = buyerRepository.findByEmail(email);
            System.out.println("🔍 Buyer lookup result: " + (buyer.isPresent() ? "Found" : "Not found"));

            if (buyer.isPresent()) {
                boolean passwordMatch = passwordService.verifyPassword(password, buyer.get().getPassword());
                System.out.println("🔍 Password verification: " + passwordMatch);

                if (passwordMatch) {
                    session.setAttribute("user", buyer.get());
                    session.setAttribute("userType", "buyer");

                    // Update last login
                    Buyer b = buyer.get();
                    b.setLastLoginAt(LocalDateTime.now());
                    buyerRepository.save(b);

                    System.out.println("✅ Buyer login successful for: " + b.getFirstName());
                    redirectAttributes.addFlashAttribute("successMessage",
                        "Welcome back, " + b.getFirstName() + "!");
                    return "redirect:/";
                }
            }
        } else if ("seller".equals(userType)) {
            var seller = sellerRepository.findByEmail(email);
            System.out.println("🔍 Seller lookup result: " + (seller.isPresent() ? "Found" : "Not found"));

            if (seller.isPresent()) {
                boolean passwordMatch = passwordService.verifyPassword(password, seller.get().getPassword());
                System.out.println("🔍 Password verification: " + passwordMatch);

                if (passwordMatch) {
                    session.setAttribute("user", seller.get());
                    session.setAttribute("userType", "seller");

                    // Update last login
                    Seller s = seller.get();
                    s.setLastLoginAt(LocalDateTime.now());
                    sellerRepository.save(s);

                    System.out.println("✅ Seller login successful for: " + s.getOwnerName());
                    redirectAttributes.addFlashAttribute("successMessage",
                        "Welcome back, " + s.getOwnerName() + "!");
                    return "redirect:/sellers";
                }
            }
        }

        System.out.println("❌ Login failed for: " + email + " (userType: " + userType + ")");
        model.addAttribute("errorMessage", "Invalid email or password");
        model.addAttribute("email", email);
        model.addAttribute("userType", userType);
        return "auth/login";
    }
    
    @GetMapping("/logout")
    public String logout(HttpSession session, RedirectAttributes redirectAttributes) {
        session.invalidate();
        redirectAttributes.addFlashAttribute("successMessage", "You have been logged out successfully");
        return "redirect:/";
    }

    // ============= REST API ENDPOINTS FOR REACT FRONTEND =============

    @GetMapping("/api/status")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getAuthStatus(HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        Object user = session.getAttribute("user");
        String userType = (String) session.getAttribute("userType");

        if (user != null) {
            Map<String, Object> userInfo = new HashMap<>();
            if ("buyer".equals(userType) && user instanceof Buyer) {
                Buyer buyer = (Buyer) user;
                userInfo.put("id", buyer.getId());
                userInfo.put("email", buyer.getEmail());
                userInfo.put("firstName", buyer.getFirstName());
                userInfo.put("lastName", buyer.getLastName());
                userInfo.put("userType", "buyer");
            } else if ("seller".equals(userType) && user instanceof Seller) {
                Seller seller = (Seller) user;
                userInfo.put("id", seller.getId());
                userInfo.put("email", seller.getEmail());
                userInfo.put("firstName", seller.getOwnerName());
                userInfo.put("lastName", "");
                userInfo.put("userType", "seller");
            }

            response.put("authenticated", true);
            response.put("user", userInfo);
        } else {
            response.put("authenticated", false);
            response.put("user", null);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/logout")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> apiLogout(HttpSession session) {
        session.invalidate();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out successfully");

        return ResponseEntity.ok(response);
    }

    // Allow CORS for React frontend
    @CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
    @PostMapping("/api/login")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> apiLogin(@RequestParam String email,
                                                       @RequestParam String password,
                                                       @RequestParam(required = false) String userType,
                                                       HttpSession session) {

        Map<String, Object> response = new HashMap<>();

        if (userType == null || userType.isEmpty()) {
            userType = "buyer";
        }

        try {
            if ("buyer".equals(userType)) {
                var buyer = buyerRepository.findByEmail(email);

                if (buyer.isPresent()) {
                    boolean passwordMatch = passwordService.verifyPassword(password, buyer.get().getPassword());

                    if (passwordMatch) {
                        session.setAttribute("user", buyer.get());
                        session.setAttribute("userType", "buyer");

                        // Update last login
                        Buyer b = buyer.get();
                        b.setLastLoginAt(LocalDateTime.now());
                        buyerRepository.save(b);

                        Map<String, Object> userInfo = new HashMap<>();
                        userInfo.put("id", b.getId());
                        userInfo.put("email", b.getEmail());
                        userInfo.put("firstName", b.getFirstName());
                        userInfo.put("lastName", b.getLastName());
                        userInfo.put("userType", "buyer");

                        response.put("success", true);
                        response.put("message", "Login successful");
                        response.put("user", userInfo);

                        return ResponseEntity.ok(response);
                    }
                }
            } else if ("seller".equals(userType)) {
                var seller = sellerRepository.findByEmail(email);

                if (seller.isPresent()) {
                    boolean passwordMatch = passwordService.verifyPassword(password, seller.get().getPassword());

                    if (passwordMatch) {
                        session.setAttribute("user", seller.get());
                        session.setAttribute("userType", "seller");

                        // Update last login
                        Seller s = seller.get();
                        s.setLastLoginAt(LocalDateTime.now());
                        sellerRepository.save(s);

                        Map<String, Object> userInfo = new HashMap<>();
                        userInfo.put("id", s.getId());
                        userInfo.put("email", s.getEmail());
                        userInfo.put("firstName", s.getOwnerName());
                        userInfo.put("lastName", "");
                        userInfo.put("userType", "seller");

                        response.put("success", true);
                        response.put("message", "Login successful");
                        response.put("user", userInfo);

                        return ResponseEntity.ok(response);
                    }
                }
            }

            response.put("success", false);
            response.put("error", "Invalid email or password");
            return ResponseEntity.badRequest().body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Login failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
    @PostMapping("/api/signup/buyer")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> apiRegisterBuyer(@RequestParam String firstName,
                                                               @RequestParam String lastName,
                                                               @RequestParam String email,
                                                               @RequestParam String phone,
                                                               @RequestParam String city,
                                                               @RequestParam String state,
                                                               @RequestParam String password) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Check if email already exists
            if (buyerRepository.findByEmail(email).isPresent() ||
                sellerRepository.findByEmail(email).isPresent()) {
                response.put("success", false);
                response.put("error", "Email is already registered");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate password strength
            if (!passwordService.isValidPassword(password)) {
                response.put("success", false);
                response.put("error", "Password must be at least 8 characters with uppercase, lowercase, number and special character");
                return ResponseEntity.badRequest().body(response);
            }

            // Create new buyer
            Buyer buyer = new Buyer();
            buyer.setFirstName(firstName);
            buyer.setLastName(lastName);
            buyer.setEmail(email);
            buyer.setPhone(phone);
            buyer.setCity(city);
            buyer.setState(state);
            buyer.setPassword(passwordService.hashPassword(password));

            // Set default values
            buyer.setId(UUID.randomUUID().toString());
            buyer.setCreatedAt(LocalDateTime.now());
            buyer.setUpdatedAt(LocalDateTime.now());
            buyer.setActive(true);
            buyer.setEmailVerified(false);
            buyer.setPhoneVerified(false);
            buyer.setTotalOrders(0);
            buyer.setTotalSpent(0.0);
            buyer.setLoyaltyPoints(0.0);
            buyer.setAverageOrderValue(0.0);
            buyer.setFavoriteItems(0);
            buyer.setMaxBudget(1000.0);
            buyer.setMinDiscountThreshold(10.0);
            buyer.setReceiveNewsletters(true);
            buyer.setReceiveDeals(true);
            buyer.setReceiveSms(false);

            buyerRepository.save(buyer);

            response.put("success", true);
            response.put("message", "Account created successfully! Welcome to ThriftAI, " + buyer.getFirstName() + "!");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
    @PostMapping("/api/signup/seller")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> apiRegisterSeller(@RequestParam String firstName,
                                                                @RequestParam String lastName,
                                                                @RequestParam String email,
                                                                @RequestParam String phone,
                                                                @RequestParam String city,
                                                                @RequestParam String state,
                                                                @RequestParam String password) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Check if email already exists
            if (buyerRepository.findByEmail(email).isPresent() ||
                sellerRepository.findByEmail(email).isPresent()) {
                response.put("success", false);
                response.put("error", "Email is already registered");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate password strength
            if (!passwordService.isValidPassword(password)) {
                response.put("success", false);
                response.put("error", "Password must be at least 8 characters with uppercase, lowercase, number and special character");
                return ResponseEntity.badRequest().body(response);
            }

            // Create new seller
            Seller seller = new Seller();
            seller.setOwnerName(firstName + " " + lastName);
            seller.setEmail(email);
            seller.setPhone(phone);
            seller.setCity(city);
            seller.setState(state);
            seller.setPassword(passwordService.hashPassword(password));

            // Set default values
            seller.setId(UUID.randomUUID().toString());
            seller.setCreatedAt(LocalDateTime.now());
            seller.setUpdatedAt(LocalDateTime.now());
            seller.setActive(true);
            seller.setVerified(false);
            seller.setStatus(Seller.SellerStatus.PENDING);
            seller.setRating(0.0);
            seller.setTotalSales(0);
            seller.setTotalRevenue(BigDecimal.ZERO);
            seller.setCommissionRate(5.0);

            sellerRepository.save(seller);

            response.put("success", true);
            response.put("message", "Seller account created successfully! Your account is pending approval.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}