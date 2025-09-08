package com.projectai.controller;

import com.projectai.models.Seller;
import com.projectai.repository.SellerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/sellers")
public class SellerController {

    @Autowired
    private SellerRepository sellerRepository;

    @GetMapping
    public String sellersHome(Model model) {
        List<Seller> recentSellers = sellerRepository.findAll().stream()
                .sorted((s1, s2) -> s2.getCreatedAt().compareTo(s1.getCreatedAt()))
                .limit(6)
                .toList();
        
        model.addAttribute("recentSellers", recentSellers);
        model.addAttribute("totalSellers", sellerRepository.count());
        model.addAttribute("activeSellers", sellerRepository.countActiveSellers());
        model.addAttribute("verifiedSellers", sellerRepository.countVerifiedSellers());
        model.addAttribute("pendingSellers", sellerRepository.countByStatus(Seller.SellerStatus.PENDING));
        
        return "sellers/index";
    }

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("seller", new Seller());
        return "sellers/register";
    }

    @PostMapping("/register")
    public String registerSeller(@Valid @ModelAttribute("seller") Seller seller, 
                               BindingResult result, 
                               RedirectAttributes redirectAttributes, 
                               Model model) {
        
        if (result.hasErrors()) {
            return "sellers/register";
        }
        
        // Check if email already exists
        Optional<Seller> existingSeller = sellerRepository.findByEmail(seller.getEmail());
        if (existingSeller.isPresent()) {
            result.rejectValue("email", "error.seller", "Email already registered");
            return "sellers/register";
        }
        
        try {
            sellerRepository.save(seller);
            redirectAttributes.addFlashAttribute("successMessage", 
                "Registration successful! Your application is under review.");
            return "redirect:/sellers/dashboard/" + seller.getId();
        } catch (Exception e) {
            result.rejectValue("email", "error.seller", "Registration failed. Please try again.");
            return "sellers/register";
        }
    }

    @GetMapping("/dashboard/{sellerId}")
    public String sellerDashboard(@PathVariable String sellerId, Model model) {
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        
        if (sellerOpt.isEmpty()) {
            return "redirect:/sellers?error=seller-not-found";
        }
        
        Seller seller = sellerOpt.get();
        model.addAttribute("seller", seller);
        
        // Add dashboard stats
        model.addAttribute("totalSales", seller.getTotalSales());
        model.addAttribute("totalRevenue", seller.getTotalRevenue());
        model.addAttribute("rating", seller.getRating());
        model.addAttribute("status", seller.getStatus().toString());
        
        return "sellers/dashboard";
    }

    @GetMapping("/profile/{sellerId}")
    public String sellerProfile(@PathVariable String sellerId, Model model) {
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        
        if (sellerOpt.isEmpty()) {
            return "redirect:/sellers?error=seller-not-found";
        }
        
        model.addAttribute("seller", sellerOpt.get());
        return "sellers/profile";
    }

    @GetMapping("/edit/{sellerId}")
    public String editSellerForm(@PathVariable String sellerId, Model model) {
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        
        if (sellerOpt.isEmpty()) {
            return "redirect:/sellers?error=seller-not-found";
        }
        
        model.addAttribute("seller", sellerOpt.get());
        return "sellers/edit";
    }

    @PostMapping("/edit/{sellerId}")
    public String updateSeller(@PathVariable String sellerId,
                             @Valid @ModelAttribute("seller") Seller seller,
                             BindingResult result,
                             RedirectAttributes redirectAttributes) {
        
        if (result.hasErrors()) {
            return "sellers/edit";
        }
        
        try {
            seller.setId(sellerId);
            sellerRepository.save(seller);
            redirectAttributes.addFlashAttribute("successMessage", "Profile updated successfully!");
            return "redirect:/sellers/profile/" + sellerId;
        } catch (Exception e) {
            result.rejectValue("email", "error.seller", "Update failed. Please try again.");
            return "sellers/edit";
        }
    }

    @GetMapping("/directory")
    public String sellerDirectory(@RequestParam(required = false) String search,
                                @RequestParam(required = false) String city,
                                @RequestParam(required = false) String sellerType,
                                Model model) {
        
        List<Seller> sellers;
        
        if (search != null && !search.trim().isEmpty()) {
            sellers = sellerRepository.searchSellers(search.trim());
        } else if (city != null && !city.trim().isEmpty()) {
            sellers = sellerRepository.findByCityIgnoreCase(city.trim());
        } else if (sellerType != null && !sellerType.trim().isEmpty()) {
            try {
                Seller.SellerType type = Seller.SellerType.valueOf(sellerType.toUpperCase());
                sellers = sellerRepository.findBySellerType(type);
            } catch (IllegalArgumentException e) {
                sellers = sellerRepository.findActiveAndVerifiedSellers();
            }
        } else {
            sellers = sellerRepository.findActiveAndVerifiedSellers();
        }
        
        model.addAttribute("sellers", sellers);
        model.addAttribute("search", search);
        model.addAttribute("city", city);
        model.addAttribute("sellerType", sellerType);
        model.addAttribute("sellerTypes", Seller.SellerType.values());
        
        return "sellers/directory";
    }

    @GetMapping("/analytics")
    public String sellerAnalytics(Model model) {
        model.addAttribute("totalSellers", sellerRepository.count());
        model.addAttribute("activeSellers", sellerRepository.countActiveSellers());
        model.addAttribute("verifiedSellers", sellerRepository.countVerifiedSellers());
        model.addAttribute("pendingSellers", sellerRepository.countByStatus(Seller.SellerStatus.PENDING));
        model.addAttribute("approvedSellers", sellerRepository.countByStatus(Seller.SellerStatus.APPROVED));
        model.addAttribute("rejectedSellers", sellerRepository.countByStatus(Seller.SellerStatus.REJECTED));
        
        // Get top sellers
        List<Seller> topSellers = sellerRepository.findTopSellersByRevenue().stream().limit(10).toList();
        model.addAttribute("topSellers", topSellers);
        
        // Get seller type distribution
        List<Object[]> sellerTypeStats = sellerRepository.countBySellerType();
        model.addAttribute("sellerTypeStats", sellerTypeStats);
        
        // Get city distribution
        List<Object[]> cityStats = sellerRepository.countByCity();
        model.addAttribute("cityStats", cityStats);
        
        return "sellers/analytics";
    }

    @PostMapping("/approve/{sellerId}")
    @ResponseBody
    public String approveSeller(@PathVariable String sellerId) {
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        
        if (sellerOpt.isPresent()) {
            Seller seller = sellerOpt.get();
            seller.setStatus(Seller.SellerStatus.APPROVED);
            seller.setVerified(true);
            sellerRepository.save(seller);
            return "success";
        }
        
        return "error";
    }

    @PostMapping("/reject/{sellerId}")
    @ResponseBody
    public String rejectSeller(@PathVariable String sellerId) {
        Optional<Seller> sellerOpt = sellerRepository.findById(sellerId);
        
        if (sellerOpt.isPresent()) {
            Seller seller = sellerOpt.get();
            seller.setStatus(Seller.SellerStatus.REJECTED);
            sellerRepository.save(seller);
            return "success";
        }
        
        return "error";
    }
}