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
import java.time.LocalDateTime;
import java.util.UUID;

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
        
        if (result.hasErrors()) {
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
        seller.setTotalRevenue(0.0);
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
        
        if (userType == null || userType.isEmpty()) {
            userType = "buyer"; // Default to buyer
        }
        
        if ("buyer".equals(userType)) {
            var buyer = buyerRepository.findByEmail(email);
            if (buyer.isPresent() && passwordService.verifyPassword(password, buyer.get().getPassword())) {
                session.setAttribute("user", buyer.get());
                session.setAttribute("userType", "buyer");
                
                // Update last login
                Buyer b = buyer.get();
                b.setLastLoginAt(LocalDateTime.now());
                buyerRepository.save(b);
                
                redirectAttributes.addFlashAttribute("successMessage", 
                    "Welcome back, " + b.getFirstName() + "!");
                return "redirect:/";
            }
        } else if ("seller".equals(userType)) {
            var seller = sellerRepository.findByEmail(email);
            if (seller.isPresent() && passwordService.verifyPassword(password, seller.get().getPassword())) {
                session.setAttribute("user", seller.get());
                session.setAttribute("userType", "seller");
                
                // Update last login
                Seller s = seller.get();
                s.setLastLoginAt(LocalDateTime.now());
                sellerRepository.save(s);
                
                redirectAttributes.addFlashAttribute("successMessage", 
                    "Welcome back, " + s.getOwnerName() + "!");
                return "redirect:/sellers";
            }
        }
        
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
}