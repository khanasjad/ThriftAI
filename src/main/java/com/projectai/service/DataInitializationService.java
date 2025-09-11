package com.projectai.service;

import com.projectai.models.Product;
import com.projectai.models.Seller;
import com.projectai.repository.ProductRepository;
import com.projectai.repository.SellerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class DataInitializationService implements CommandLineRunner {

    @Autowired
    private SellerRepository sellerRepository;
    
    @Autowired
    private ProductRepository productRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only initialize data if the database is empty
        if (sellerRepository.count() == 0 && productRepository.count() == 0) {
            initializeData();
        }
    }

    private void initializeData() {
        System.out.println("Initializing sample data...");
        
        // Create sample sellers
        List<Seller> sellers = createSampleSellers();
        sellerRepository.saveAll(sellers);
        
        // Create sample products
        List<Product> products = createSampleProducts(sellers);
        productRepository.saveAll(products);
        
        System.out.println("Sample data initialization completed!");
    }

    private List<Seller> createSampleSellers() {
        Seller seller1 = new Seller();
        seller1.setBusinessName("Vintage Treasures");
        seller1.setOwnerName("Sarah Johnson");
        seller1.setEmail("sarah@vintagetreasures.com");
        seller1.setPhone("555-0101");
        seller1.setAddress("123 Main Street");
        seller1.setCity("New York");
        seller1.setState("NY");
        seller1.setZipCode("10001");
        seller1.setSellerType(Seller.SellerType.THRIFT_STORE);
        seller1.setStatus(Seller.SellerStatus.APPROVED);
        seller1.setActive(true);
        seller1.setVerified(true);
        seller1.setRating(4.8);
        seller1.setTotalSales(150);
        seller1.setTotalRevenue(12500.0);
        seller1.setCommissionRate(0.08);
        seller1.setDescription("Curated vintage clothing and accessories from the 60s-90s");
        seller1.setCategories(Arrays.asList("Clothing", "Accessories", "Shoes"));

        Seller seller2 = new Seller();
        seller2.setBusinessName("Second Chance Boutique");
        seller2.setOwnerName("Michael Rodriguez");
        seller2.setEmail("mike@secondchance.com");
        seller2.setPhone("555-0102");
        seller2.setAddress("456 Oak Avenue");
        seller2.setCity("Los Angeles");
        seller2.setState("CA");
        seller2.setZipCode("90210");
        seller2.setSellerType(Seller.SellerType.CONSIGNMENT_SHOP);
        seller2.setStatus(Seller.SellerStatus.APPROVED);
        seller2.setActive(true);
        seller2.setVerified(true);
        seller2.setRating(4.6);
        seller2.setTotalSales(200);
        seller2.setTotalRevenue(18750.0);
        seller2.setCommissionRate(0.10);
        seller2.setDescription("High-end consignment with designer brands");
        seller2.setCategories(Arrays.asList("Designer Clothing", "Luxury Bags", "Jewelry"));

        Seller seller3 = new Seller();
        seller3.setBusinessName("Eco Fashion Hub");
        seller3.setOwnerName("Emma Chen");
        seller3.setEmail("emma@ecofashion.com");
        seller3.setPhone("555-0103");
        seller3.setAddress("789 Green Street");
        seller3.setCity("Portland");
        seller3.setState("OR");
        seller3.setZipCode("97201");
        seller3.setSellerType(Seller.SellerType.THRIFT_STORE);
        seller3.setStatus(Seller.SellerStatus.APPROVED);
        seller3.setActive(true);
        seller3.setVerified(true);
        seller3.setRating(4.9);
        seller3.setTotalSales(180);
        seller3.setTotalRevenue(15600.0);
        seller3.setCommissionRate(0.07);
        seller3.setDescription("Sustainable fashion for the environmentally conscious");
        seller3.setCategories(Arrays.asList("Sustainable Clothing", "Eco Accessories", "Organic Cotton"));

        return Arrays.asList(seller1, seller2, seller3);
    }

    private List<Product> createSampleProducts(List<Seller> sellers) {
        // Products for Vintage Treasures
        Product product1 = new Product();
        product1.setName("Vintage Levi's 501 Jeans");
        product1.setCategory("Clothing");
        product1.setBrand("Levi's");
        product1.setPrice(45.00);
        product1.setOriginalPrice(120.00);
        product1.setCondition("Excellent");
        product1.setDescription("Classic vintage Levi's 501 jeans from the 80s, perfect condition");
        product1.setSize("32x34");
        product1.setAvailable(true);
        product1.setSeller(sellers.get(0));
        product1.setImageUrl("https://via.placeholder.com/300x300?text=Vintage+Levis");

        Product product2 = new Product();
        product2.setName("Vintage Band T-Shirt - Led Zeppelin");
        product2.setCategory("Clothing");
        product2.setBrand("Vintage");
        product2.setPrice(35.00);
        product2.setOriginalPrice(80.00);
        product2.setCondition("Very Good");
        product2.setDescription("Authentic Led Zeppelin tour shirt from 1979");
        product2.setSize("Medium");
        product2.setAvailable(true);
        product2.setSeller(sellers.get(0));
        product2.setImageUrl("https://via.placeholder.com/300x300?text=Led+Zeppelin+Tee");

        Product product3 = new Product();
        product3.setName("Vintage Leather Jacket");
        product3.setCategory("Outerwear");
        product3.setBrand("Wilson's Leather");
        product3.setPrice(75.00);
        product3.setOriginalPrice(250.00);
        product3.setCondition("Good");
        product3.setDescription("Black leather motorcycle jacket with classic styling");
        product3.setSize("Large");
        product3.setAvailable(true);
        product3.setSeller(sellers.get(0));
        product3.setImageUrl("https://via.placeholder.com/300x300?text=Leather+Jacket");

        // Products for Second Chance Boutique
        Product product4 = new Product();
        product4.setName("Gucci Designer Handbag");
        product4.setCategory("Accessories");
        product4.setBrand("Gucci");
        product4.setPrice(850.00);
        product4.setOriginalPrice(1800.00);
        product4.setCondition("Like New");
        product4.setDescription("Authentic Gucci GG Marmont leather shoulder bag");
        product4.setSize("Medium");
        product4.setAvailable(true);
        product4.setSeller(sellers.get(1));
        product4.setImageUrl("https://via.placeholder.com/300x300?text=Gucci+Bag");

        Product product5 = new Product();
        product5.setName("Chanel Little Black Dress");
        product5.setCategory("Clothing");
        product5.setBrand("Chanel");
        product5.setPrice(1200.00);
        product5.setOriginalPrice(3500.00);
        product5.setCondition("Excellent");
        product5.setDescription("Timeless Chanel little black dress, perfect for any occasion");
        product5.setSize("Size 6");
        product5.setAvailable(true);
        product5.setSeller(sellers.get(1));
        product5.setImageUrl("https://via.placeholder.com/300x300?text=Chanel+Dress");

        Product product6 = new Product();
        product6.setName("Louboutin Red Sole Heels");
        product6.setCategory("Shoes");
        product6.setBrand("Christian Louboutin");
        product6.setPrice(450.00);
        product6.setOriginalPrice(1200.00);
        product6.setCondition("Very Good");
        product6.setDescription("Classic red sole heels, minor wear on soles");
        product6.setSize("Size 8");
        product6.setAvailable(true);
        product6.setSeller(sellers.get(1));
        product6.setImageUrl("https://via.placeholder.com/300x300?text=Louboutin+Heels");

        // Products for Eco Fashion Hub
        Product product7 = new Product();
        product7.setName("Organic Cotton Sundress");
        product7.setCategory("Clothing");
        product7.setBrand("Eileen Fisher");
        product7.setPrice(65.00);
        product7.setOriginalPrice(180.00);
        product7.setCondition("Like New");
        product7.setDescription("Sustainable organic cotton sundress, barely worn");
        product7.setSize("Medium");
        product7.setAvailable(true);
        product7.setSeller(sellers.get(2));
        product7.setImageUrl("https://via.placeholder.com/300x300?text=Organic+Sundress");

        Product product8 = new Product();
        product8.setName("Recycled Denim Jacket");
        product8.setCategory("Outerwear");
        product8.setBrand("Patagonia");
        product8.setPrice(55.00);
        product8.setOriginalPrice(149.00);
        product8.setCondition("Excellent");
        product8.setDescription("Sustainable denim jacket made from recycled materials");
        product8.setSize("Large");
        product8.setAvailable(true);
        product8.setSeller(sellers.get(2));
        product8.setImageUrl("https://via.placeholder.com/300x300?text=Recycled+Denim");

        Product product9 = new Product();
        product9.setName("Hemp Canvas Tote Bag");
        product9.setCategory("Accessories");
        product9.setBrand("Baggu");
        product9.setPrice(25.00);
        product9.setOriginalPrice(45.00);
        product9.setCondition("Very Good");
        product9.setDescription("Durable hemp canvas tote, perfect for everyday use");
        product9.setSize("Large");
        product9.setAvailable(true);
        product9.setSeller(sellers.get(2));
        product9.setImageUrl("https://via.placeholder.com/300x300?text=Hemp+Tote");

        Product product10 = new Product();
        product10.setName("Vintage Nike Air Jordans");
        product10.setCategory("Shoes");
        product10.setBrand("Nike");
        product10.setPrice(180.00);
        product10.setOriginalPrice(450.00);
        product10.setCondition("Good");
        product10.setDescription("Classic Air Jordan 1s from 1990s, some wear but still great");
        product10.setSize("Size 10");
        product10.setAvailable(true);
        product10.setSeller(sellers.get(0));
        product10.setImageUrl("https://via.placeholder.com/300x300?text=Air+Jordans");

        // Additional products for better search diversity
        Product product11 = new Product();
        product11.setName("Adidas Track Jacket");
        product11.setCategory("Clothing");
        product11.setBrand("Adidas");
        product11.setPrice(28.00);
        product11.setOriginalPrice(65.00);
        product11.setCondition("Very Good");
        product11.setDescription("Classic three-stripe track jacket in navy blue");
        product11.setSize("Large");
        product11.setAvailable(true);
        product11.setSeller(sellers.get(1));
        product11.setImageUrl("https://via.placeholder.com/300x300?text=Adidas+Jacket");

        Product product12 = new Product();
        product12.setName("Nintendo Game Console");
        product12.setCategory("Electronics");
        product12.setBrand("Nintendo");
        product12.setPrice(85.00);
        product12.setOriginalPrice(200.00);
        product12.setCondition("Good");
        product12.setDescription("Retro Nintendo gaming console with controllers");
        product12.setSize("Standard");
        product12.setAvailable(true);
        product12.setSeller(sellers.get(2));
        product12.setImageUrl("https://via.placeholder.com/300x300?text=Nintendo+Console");

        Product product13 = new Product();
        product13.setName("Ray-Ban Sunglasses");
        product13.setCategory("Accessories");
        product13.setBrand("Ray-Ban");
        product13.setPrice(45.00);
        product13.setOriginalPrice(150.00);
        product13.setCondition("Excellent");
        product13.setDescription("Classic aviator sunglasses with original case");
        product13.setSize("One Size");
        product13.setAvailable(true);
        product13.setSeller(sellers.get(0));
        product13.setImageUrl("https://via.placeholder.com/300x300?text=Ray-Ban");

        Product product14 = new Product();
        product14.setName("Vintage Cookbook Collection");
        product14.setCategory("Books");
        product14.setBrand("Various");
        product14.setPrice(15.00);
        product14.setOriginalPrice(45.00);
        product14.setCondition("Good");
        product14.setDescription("Set of 5 vintage cookbooks from the 1970s");
        product14.setSize("Standard");
        product14.setAvailable(true);
        product14.setSeller(sellers.get(1));
        product14.setImageUrl("https://via.placeholder.com/300x300?text=Cookbooks");

        Product product15 = new Product();
        product15.setName("Levi's Denim Jacket");
        product15.setCategory("Outerwear");
        product15.setBrand("Levi's");
        product15.setPrice(42.00);
        product15.setOriginalPrice(89.00);
        product15.setCondition("Very Good");
        product15.setDescription("Classic blue denim jacket with vintage wash");
        product15.setSize("Medium");
        product15.setAvailable(true);
        product15.setSeller(sellers.get(2));
        product15.setImageUrl("https://via.placeholder.com/300x300?text=Levi+Denim");

        return Arrays.asList(product1, product2, product3, product4, product5, 
                           product6, product7, product8, product9, product10,
                           product11, product12, product13, product14, product15);
    }
}