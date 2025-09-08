package com.projectai.controller;

import com.projectai.models.Buyer;
import com.projectai.repository.BuyerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/buyers")
public class BuyerController {

    @Autowired
    private BuyerRepository buyerRepository;

    @GetMapping
    public String buyersHome(Model model) {
        List<Buyer> recentBuyers = buyerRepository.findAll().stream()
                .sorted((b1, b2) -> b2.getCreatedAt().compareTo(b1.getCreatedAt()))
                .limit(8)
                .toList();
        
        model.addAttribute("recentBuyers", recentBuyers);
        model.addAttribute("totalBuyers", buyerRepository.count());
        model.addAttribute("activeBuyers", buyerRepository.countActiveBuyers());
        model.addAttribute("verifiedBuyers", buyerRepository.countVerifiedBuyers());
        
        // Get top buyers
        List<Buyer> topBuyers = buyerRepository.findByTotalSpentGreaterThanEqual(0.0).stream().limit(5).toList();
        model.addAttribute("topBuyers", topBuyers);
        
        return "buyers/index";
    }

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("buyer", new Buyer());
        return "buyers/register";
    }

    @PostMapping("/register")
    public String registerBuyer(@Valid @ModelAttribute("buyer") Buyer buyer, 
                              BindingResult result, 
                              RedirectAttributes redirectAttributes, 
                              Model model) {
        
        if (result.hasErrors()) {
            return "buyers/register";
        }
        
        // Check if email already exists
        Optional<Buyer> existingBuyer = buyerRepository.findByEmail(buyer.getEmail());
        if (existingBuyer.isPresent()) {
            result.rejectValue("email", "error.buyer", "Email already registered");
            return "buyers/register";
        }
        
        try {
            buyerRepository.save(buyer);
            redirectAttributes.addFlashAttribute("successMessage", 
                "Registration successful! Welcome to ThriftAI!");
            return "redirect:/buyers/dashboard/" + buyer.getId();
        } catch (Exception e) {
            result.rejectValue("email", "error.buyer", "Registration failed. Please try again.");
            return "buyers/register";
        }
    }

    @GetMapping("/dashboard/{buyerId}")
    public String buyerDashboard(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        Buyer buyer = buyerOpt.get();
        model.addAttribute("buyer", buyer);
        
        // Update last login
        buyer.setLastLoginAt(LocalDateTime.now());
        buyerRepository.save(buyer);
        
        return "buyers/dashboard";
    }

    @GetMapping("/profile/{buyerId}")
    public String buyerProfile(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        model.addAttribute("buyer", buyerOpt.get());
        return "buyers/profile";
    }

    @GetMapping("/edit/{buyerId}")
    public String editBuyerForm(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        model.addAttribute("buyer", buyerOpt.get());
        return "buyers/edit";
    }

    @PostMapping("/edit/{buyerId}")
    public String updateBuyer(@PathVariable String buyerId,
                            @Valid @ModelAttribute("buyer") Buyer buyer,
                            BindingResult result,
                            RedirectAttributes redirectAttributes) {
        
        if (result.hasErrors()) {
            return "buyers/edit";
        }
        
        try {
            buyer.setId(buyerId);
            buyerRepository.save(buyer);
            redirectAttributes.addFlashAttribute("successMessage", "Profile updated successfully!");
            return "redirect:/buyers/profile/" + buyerId;
        } catch (Exception e) {
            result.rejectValue("email", "error.buyer", "Update failed. Please try again.");
            return "buyers/edit";
        }
    }

    @GetMapping("/preferences/{buyerId}")
    public String buyerPreferences(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        model.addAttribute("buyer", buyerOpt.get());
        return "buyers/preferences";
    }

    @PostMapping("/preferences/{buyerId}")
    public String updatePreferences(@PathVariable String buyerId,
                                  @RequestParam(required = false) List<String> preferredCategories,
                                  @RequestParam(required = false) List<String> preferredBrands,
                                  @RequestParam(required = false) List<String> preferredSizes,
                                  @RequestParam double maxBudget,
                                  @RequestParam double minDiscountThreshold,
                                  @RequestParam(defaultValue = "false") boolean receiveNewsletters,
                                  @RequestParam(defaultValue = "false") boolean receiveDeals,
                                  @RequestParam(defaultValue = "false") boolean receiveSms,
                                  @RequestParam String notificationFrequency,
                                  RedirectAttributes redirectAttributes) {
        
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        Buyer buyer = buyerOpt.get();
        
        // Update preferences
        buyer.setPreferredCategories(preferredCategories != null ? preferredCategories : List.of());
        buyer.setPreferredBrands(preferredBrands != null ? preferredBrands : List.of());
        buyer.setPreferredSizes(preferredSizes != null ? preferredSizes : List.of());
        buyer.setMaxBudget(maxBudget);
        buyer.setMinDiscountThreshold(minDiscountThreshold);
        buyer.setReceiveNewsletters(receiveNewsletters);
        buyer.setReceiveDeals(receiveDeals);
        buyer.setReceiveSms(receiveSms);
        
        try {
            Buyer.NotificationFrequency freq = Buyer.NotificationFrequency.valueOf(notificationFrequency.toUpperCase());
            buyer.setNotificationFrequency(freq);
        } catch (IllegalArgumentException e) {
            buyer.setNotificationFrequency(Buyer.NotificationFrequency.WEEKLY);
        }
        
        buyerRepository.save(buyer);
        redirectAttributes.addFlashAttribute("successMessage", "Preferences updated successfully!");
        
        return "redirect:/buyers/dashboard/" + buyerId;
    }

    @GetMapping("/directory")
    public String buyerDirectory(@RequestParam(required = false) String search,
                               @RequestParam(required = false) String city,
                               @RequestParam(required = false) String buyerType,
                               Model model) {
        
        List<Buyer> buyers;
        
        if (search != null && !search.trim().isEmpty()) {
            buyers = buyerRepository.searchBuyers(search.trim());
        } else if (city != null && !city.trim().isEmpty()) {
            buyers = buyerRepository.findByCityIgnoreCase(city.trim());
        } else if (buyerType != null && !buyerType.trim().isEmpty()) {
            try {
                Buyer.BuyerType type = Buyer.BuyerType.valueOf(buyerType.toUpperCase());
                buyers = buyerRepository.findByBuyerType(type);
            } catch (IllegalArgumentException e) {
                buyers = buyerRepository.findByIsActiveTrue();
            }
        } else {
            buyers = buyerRepository.findByIsActiveTrue();
        }
        
        model.addAttribute("buyers", buyers);
        model.addAttribute("search", search);
        model.addAttribute("city", city);
        model.addAttribute("buyerType", buyerType);
        model.addAttribute("buyerTypes", Buyer.BuyerType.values());
        
        return "buyers/directory";
    }

    @GetMapping("/analytics")
    public String buyerAnalytics(Model model) {
        model.addAttribute("totalBuyers", buyerRepository.count());
        model.addAttribute("activeBuyers", buyerRepository.countActiveBuyers());
        model.addAttribute("verifiedBuyers", buyerRepository.countVerifiedBuyers());
        
        // Get recent buyers (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Buyer> recentBuyers = buyerRepository.findNewBuyers(thirtyDaysAgo);
        model.addAttribute("recentBuyersCount", recentBuyers.size());
        
        // Get top buyers
        List<Buyer> topBuyers = buyerRepository.findTopLoyaltyCustomers(100.0).stream().limit(10).toList();
        model.addAttribute("topBuyers", topBuyers);
        
        // Get buyer type distribution
        List<Object[]> buyerTypeStats = buyerRepository.countByBuyerType();
        model.addAttribute("buyerTypeStats", buyerTypeStats);
        
        // Get city distribution
        List<Object[]> cityStats = buyerRepository.countByCity();
        model.addAttribute("cityStats", cityStats);
        
        // Get spending stats
        Double averageSpending = buyerRepository.getAverageSpending();
        Double averageOrderValue = buyerRepository.getAverageOrderValue();
        model.addAttribute("averageSpending", averageSpending != null ? averageSpending : 0.0);
        model.addAttribute("averageOrderValue", averageOrderValue != null ? averageOrderValue : 0.0);
        
        return "buyers/analytics";
    }

    @GetMapping("/wishlist/{buyerId}")
    public String buyerWishlist(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        model.addAttribute("buyer", buyerOpt.get());
        // TODO: Add wishlist items when Product-Buyer relationship is implemented
        
        return "buyers/wishlist";
    }

    @GetMapping("/orders/{buyerId}")
    public String buyerOrders(@PathVariable String buyerId, Model model) {
        Optional<Buyer> buyerOpt = buyerRepository.findById(buyerId);
        
        if (buyerOpt.isEmpty()) {
            return "redirect:/buyers?error=buyer-not-found";
        }
        
        model.addAttribute("buyer", buyerOpt.get());
        // TODO: Add order history when Order model is implemented
        
        return "buyers/orders";
    }
}