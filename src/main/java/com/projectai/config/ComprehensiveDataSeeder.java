package com.projectai.config;

import com.projectai.models.Product;
import com.projectai.models.Seller;
import com.projectai.repository.ProductRepository;
import com.projectai.repository.SellerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

// @Component
@Order(2) // Run after DataInitializer
public class ComprehensiveDataSeeder implements CommandLineRunner {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SellerRepository sellerRepository;

    @Override
    public void run(String... args) throws Exception {
        // Temporarily disabled to fix transaction issues
        System.out.println("ℹ️ Comprehensive data seeding temporarily disabled");
        return;

        /*
        if (productRepository.count() > 15) { // Skip if we already have comprehensive data
            return;
        }

        System.out.println("🚀 Seeding comprehensive ThriftAI data (500+ products)...");

        // First create realistic sellers
        createRealisticSellers();

        // Then create comprehensive product catalog
        createComprehensiveProductCatalog();

        System.out.println("✅ Comprehensive data seeding completed successfully!");
        System.out.println("📊 Total products: " + productRepository.count());
        System.out.println("🏪 Total sellers: " + sellerRepository.count());
        */
    }

    private void createRealisticSellers() {
        if (sellerRepository.count() > 0) {
            return; // Sellers already exist
        }

        List<Seller> sellers = new ArrayList<>();

        // Individual sellers
        sellers.add(createSeller("store1", "Sarah's Closet", "Sarah Johnson", "INDIVIDUAL",
            "Curated vintage and designer clothing from my personal collection",
            "sarah.johnson@email.com", "555-0101", "123 Vintage St", "Portland", "OR"));

        sellers.add(createSeller("store2", "Tech Haven", "Michael Chen", "INDIVIDUAL",
            "Refurbished electronics and gadgets, all tested and guaranteed",
            "michael.chen@email.com", "555-0102", "456 Tech Ave", "Austin", "TX"));

        sellers.add(createSeller("store3", "BookWorm's Paradise", "Emma Rodriguez", "INDIVIDUAL",
            "Rare books, textbooks, and literary collections",
            "emma.rodriguez@email.com", "555-0103", "789 Library Ln", "Boston", "MA"));

        // Thrift stores
        sellers.add(createSeller("store4", "Retro Revival Thrift", "David Kim", "THRIFT_STORE",
            "Authentic vintage items from the 70s, 80s, and 90s",
            "david@retrorevival.com", "555-0104", "101 Retro Blvd", "San Francisco", "CA"));

        sellers.add(createSeller("store5", "Green Earth Consignment", "Lisa Thompson", "CONSIGNMENT_SHOP",
            "Eco-friendly consignment shop focusing on sustainable fashion",
            "lisa@greenearth.com", "555-0105", "202 Eco Way", "Seattle", "WA"));

        // Business sellers
        sellers.add(createSeller("store6", "Urban Outlet Co.", "James Wilson", "BUSINESS",
            "Overstock and returned items from major retailers",
            "james@urbanoutlet.com", "555-0106", "303 Commerce Dr", "Chicago", "IL"));

        sellers.add(createSeller("store7", "Home & Heart", "Maria Garcia", "THRIFT_STORE",
            "Home goods, furniture, and decor items",
            "maria@homeheart.com", "555-0107", "404 Home Ave", "Denver", "CO"));

        sellers.add(createSeller("store8", "Sneaker Vault", "Alex Morgan", "INDIVIDUAL",
            "Authentic sneakers and streetwear, all verified",
            "alex@sneakervault.com", "555-0108", "505 Street Ave", "Miami", "FL"));

        sellers.add(createSeller("store9", "Antique Treasures", "Robert Lee", "BUSINESS",
            "Antiques, collectibles, and unique vintage finds",
            "robert@antiquetreasures.com", "555-0109", "606 Antique Rd", "Nashville", "TN"));

        sellers.add(createSeller("store10", "Kids & More", "Jennifer Davis", "CONSIGNMENT_SHOP",
            "Children's clothing, toys, and family items",
            "jennifer@kidsandmore.com", "555-0110", "707 Family St", "Atlanta", "GA"));

        sellerRepository.saveAll(sellers);
    }

    private Seller createSeller(String id, String businessName, String ownerName, String type,
                               String description, String email, String phone, String address,
                               String city, String state) {
        Seller seller = new Seller();
        seller.setId(id);
        seller.setBusinessName(businessName);
        seller.setOwnerName(ownerName);
        seller.setSellerType(Seller.SellerType.valueOf(type));
        seller.setDescription(description);
        seller.setEmail(email);
        seller.setPhone(phone);
        seller.setAddress(address);
        seller.setCity(city);
        seller.setState(state);
        seller.setZipCode("00000");
        seller.setPassword("hashed_password"); // In real app, this would be properly hashed
        seller.setStatus(Seller.SellerStatus.APPROVED);
        seller.setActive(true);
        seller.setVerified(true);
        seller.setRating(4.5 + new Random().nextDouble() * 0.5); // 4.5-5.0 rating
        seller.setCommissionRate(0.1); // 10% commission
        seller.setTotalSales(new Random().nextInt(100) + 10);
        seller.setTotalRevenue(BigDecimal.valueOf(1000 + new Random().nextInt(9000)));
        seller.setCreatedAt(LocalDateTime.now().minusDays(new Random().nextInt(365)));

        return seller;
    }

    private void createComprehensiveProductCatalog() {
        List<Product> allProducts = new ArrayList<>();
        String[] storeIds = {"store1", "store2", "store3", "store4", "store5", "store6", "store7", "store8", "store9", "store10"};
        String[] conditions = {"EXCELLENT", "VERY_GOOD", "GOOD", "FAIR", "LIKE_NEW"};

        // ELECTRONICS (120+ items)
        allProducts.addAll(createElectronicsProducts(storeIds, conditions));

        // CLOTHING (180+ items)
        allProducts.addAll(createClothingProducts(storeIds, conditions));

        // SHOES (100+ items)
        allProducts.addAll(createShoesProducts(storeIds, conditions));

        // HOME & GARDEN (80+ items)
        allProducts.addAll(createHomeProducts(storeIds, conditions));

        // BOOKS & MEDIA (60+ items)
        allProducts.addAll(createBooksProducts(storeIds, conditions));

        // ACCESSORIES (70+ items)
        allProducts.addAll(createAccessoriesProducts(storeIds, conditions));

        // FURNITURE (50+ items)
        allProducts.addAll(createFurnitureProducts(storeIds, conditions));

        // JEWELRY (40+ items)
        allProducts.addAll(createJewelryProducts(storeIds, conditions));

        // SPORTS & OUTDOORS (30+ items)
        allProducts.addAll(createSportsProducts(storeIds, conditions));

        // TOYS & GAMES (25+ items)
        allProducts.addAll(createToysProducts(storeIds, conditions));

        // Clear existing products first (except the initial 12)
        productRepository.deleteAll();

        // Save all products in batches
        int batchSize = 50;
        for (int i = 0; i < allProducts.size(); i += batchSize) {
            int end = Math.min(i + batchSize, allProducts.size());
            List<Product> batch = allProducts.subList(i, end);
            productRepository.saveAll(batch);
            System.out.println("Saved batch " + (i/batchSize + 1) + " (" + batch.size() + " products)");
        }
    }

    private List<Product> createElectronicsProducts(String[] storeIds, String[] conditions) {
        List<Product> products = new ArrayList<>();
        Random random = new Random();

        // Laptops & Computers
        String[][] laptops = {
            {"MacBook Air M1 2021", "APPLE", "899.99", "1299.99", "MacBook Air with M1 chip, excellent performance and battery life"},
            {"MacBook Pro 13\" 2020", "APPLE", "1199.99", "1799.99", "MacBook Pro 13-inch with Touch Bar and Intel processor"},
            {"MacBook Pro 16\" M1", "APPLE", "1899.99", "2499.99", "MacBook Pro 16-inch with M1 Pro chip for professionals"},
            {"Dell XPS 13 9310", "DELL", "699.99", "1199.99", "Ultrabook with InfinityEdge display and premium build"},
            {"HP Pavilion 15-eg0021nr", "HP", "449.99", "699.99", "Mid-range laptop perfect for everyday computing"},
            {"Lenovo ThinkPad T480", "LENOVO", "599.99", "999.99", "Business laptop with legendary keyboard and durability"},
            {"Surface Laptop 4", "MICROSOFT", "799.99", "1199.99", "Premium Windows laptop with excellent display"},
            {"ASUS ZenBook 14", "ASUS", "649.99", "949.99", "Compact ultrabook with OLED display option"},
            {"Acer Aspire 5", "ACER", "379.99", "599.99", "Budget-friendly laptop perfect for students"},
            {"Gaming Laptop MSI GF65", "MSI", "899.99", "1399.99", "Gaming laptop with RTX 3060 graphics card"},
            {"Chromebook Pixelbook Go", "GOOGLE", "299.99", "649.99", "Premium Chromebook for cloud computing"}
        };

        for (String[] laptop : laptops) {
            for (int i = 0; i < 2; i++) { // Create 2 of each
                products.add(createProduct(laptop[0], "ELECTRONICS", laptop[1],
                    Double.parseDouble(laptop[2]), Double.parseDouble(laptop[3]),
                    laptop[4], conditions[random.nextInt(conditions.length)],
                    null, storeIds[random.nextInt(storeIds.length)]));
            }
        }

        // Smartphones
        String[][] phones = {
            {"iPhone 13 Pro", "APPLE", "699.99", "999.99", "Latest iPhone with Pro camera system and A15 chip"},
            {"iPhone 13", "APPLE", "599.99", "799.99", "Latest iPhone with great camera and performance"},
            {"iPhone 12 Pro Max", "APPLE", "649.99", "1099.99", "Large iPhone with professional camera features"},
            {"iPhone 12", "APPLE", "499.99", "699.99", "Previous generation iPhone with 5G capability"},
            {"iPhone 11", "APPLE", "399.99", "599.99", "Popular iPhone model with dual camera system"},
            {"Samsung Galaxy S22 Ultra", "SAMSUNG", "749.99", "1199.99", "Flagship Android with S Pen and amazing cameras"},
            {"Samsung Galaxy S21", "SAMSUNG", "549.99", "799.99", "Flagship Android phone with premium features"},
            {"Samsung Galaxy Note 20", "SAMSUNG", "479.99", "999.99", "Note series with S Pen for productivity"},
            {"Google Pixel 6 Pro", "GOOGLE", "499.99", "899.99", "Pure Android with computational photography"},
            {"Google Pixel 6", "GOOGLE", "399.99", "599.99", "Great camera and clean Android experience"},
            {"OnePlus 9 Pro", "ONEPLUS", "529.99", "969.99", "Fast charging flagship with Hasselblad cameras"},
            {"Xiaomi Mi 11", "XIAOMI", "349.99", "749.99", "High-spec phone with premium features at great price"}
        };

        for (String[] phone : phones) {
            for (int i = 0; i < 3; i++) { // Create 3 of each
                products.add(createProduct(phone[0], "ELECTRONICS", phone[1],
                    Double.parseDouble(phone[2]), Double.parseDouble(phone[3]),
                    phone[4], conditions[random.nextInt(conditions.length)],
                    null, storeIds[random.nextInt(storeIds.length)]));
            }
        }

        // Gaming & Audio Equipment
        String[][] gaming = {
            {"PlayStation 5", "SONY", "449.99", "499.99", "Latest gaming console with 4K gaming and haptic feedback"},
            {"Xbox Series X", "MICROSOFT", "429.99", "499.99", "Microsoft's most powerful gaming console"},
            {"Nintendo Switch OLED", "NINTENDO", "299.99", "349.99", "Portable gaming console with OLED screen"},
            {"AirPods Pro 2nd Gen", "APPLE", "199.99", "249.99", "Active noise cancelling with spatial audio"},
            {"Sony WH-1000XM4", "SONY", "249.99", "349.99", "Industry-leading noise cancelling headphones"},
            {"Bose QuietComfort 45", "BOSE", "229.99", "329.99", "Comfortable noise-cancelling headphones"},
            {"iPad Air 5th Gen", "APPLE", "499.99", "599.99", "Versatile tablet with M1 chip"},
            {"iPad Pro 11\"", "APPLE", "699.99", "799.99", "Professional tablet with M1 chip and Liquid Retina"},
            {"Surface Pro 8", "MICROSOFT", "799.99", "1099.99", "2-in-1 tablet and laptop replacement"},
            {"Galaxy Tab S8", "SAMSUNG", "549.99", "699.99", "Android tablet with S Pen included"},
            {"Amazon Echo Dot 5th Gen", "AMAZON", "29.99", "49.99", "Smart speaker with improved sound"},
            {"Google Nest Hub", "GOOGLE", "69.99", "99.99", "Smart display for home control"}
        };

        for (String[] item : gaming) {
            for (int i = 0; i < 2; i++) {
                products.add(createProduct(item[0], "ELECTRONICS", item[1],
                    Double.parseDouble(item[2]), Double.parseDouble(item[3]),
                    item[4], conditions[random.nextInt(conditions.length)],
                    null, storeIds[random.nextInt(storeIds.length)]));
            }
        }

        return products;
    }

    private List<Product> createClothingProducts(String[] storeIds, String[] conditions) {
        List<Product> products = new ArrayList<>();
        Random random = new Random();
        String[] sizes = {"XS", "S", "M", "L", "XL", "XXL"};

        // Men's Clothing
        String[][] mensClothing = {
            {"Vintage Levi's 501 Jeans", "LEVI'S", "45.99", "120.00", "Classic vintage jeans in authentic indigo wash"},
            {"Ralph Lauren Polo Shirt", "POLO RALPH LAUREN", "35.99", "89.99", "Classic polo shirt in navy blue with logo"},
            {"Nike Dri-FIT T-Shirt", "NIKE", "19.99", "34.99", "Athletic t-shirt with moisture-wicking technology"},
            {"Adidas Originals Track Jacket", "ADIDAS", "49.99", "89.99", "Retro track jacket with classic 3-stripes"},
            {"Calvin Klein Dress Shirt", "CALVIN KLEIN", "34.99", "69.99", "Professional white dress shirt, non-iron"},
            {"Tommy Hilfiger Crew Sweater", "TOMMY HILFIGER", "54.99", "119.99", "Cotton crew neck sweater in classic colors"},
            {"Gap Slim Khaki Chinos", "GAP", "29.99", "59.99", "Versatile khaki pants for casual or business casual"},
            {"J.Crew Oxford Shirt", "J.CREW", "39.99", "79.99", "Oxford cotton button-down shirt in multiple colors"},
            {"Patagonia Better Sweater Fleece", "PATAGONIA", "79.99", "149.99", "Eco-friendly fleece jacket for outdoor activities"},
            {"Uniqlo Merino Wool Sweater", "UNIQLO", "44.99", "79.99", "Premium merino wool crew neck sweater"},
            {"Carhartt Work Jacket", "CARHARTT", "69.99", "129.99", "Durable work jacket with multiple pockets"},
            {"Champion Reverse Weave Hoodie", "CHAMPION", "39.99", "65.99", "Classic hoodie with reverse weave construction"}
        };

        for (String[] item : mensClothing) {
            for (String size : sizes) {
                for (int i = 0; i < 2; i++) { // 2 of each size
                    products.add(createProduct(item[0], "CLOTHING", item[1],
                        Double.parseDouble(item[2]), Double.parseDouble(item[3]),
                        item[4], conditions[random.nextInt(conditions.length)],
                        size, storeIds[random.nextInt(storeIds.length)]));
                }
            }
        }

        // Women's Clothing
        String[][] womensClothing = {
            {"Zara Wool Blend Coat", "ZARA", "89.99", "199.99", "Elegant wool blend coat perfect for winter"},
            {"H&M Floral Midi Dress", "H&M", "24.99", "49.99", "Beautiful floral print midi dress for spring"},
            {"Lululemon Align Leggings", "LULULEMON", "79.99", "128.00", "Buttery-soft yoga leggings with four-way stretch"},
            {"Forever 21 Crop Top", "FOREVER 21", "14.99", "24.99", "Trendy crop top in seasonal colors"},
            {"Banana Republic Blazer", "BANANA REPUBLIC", "89.99", "169.99", "Professional blazer perfect for the office"},
            {"Old Navy High-Waisted Jeans", "OLD NAVY", "24.99", "44.99", "Comfortable high-waisted denim jeans"},
            {"Madewell Denim Jacket", "MADEWELL", "69.99", "118.00", "Classic denim jacket in vintage wash"},
            {"Anthropologie Blouse", "ANTHROPOLOGIE", "54.99", "88.00", "Bohemian-style blouse with unique prints"},
            {"Everlane Cashmere Sweater", "EVERLANE", "99.99", "168.00", "Sustainable cashmere crew neck sweater"},
            {"Free People Maxi Dress", "FREE PEOPLE", "79.99", "128.00", "Flowy maxi dress perfect for festivals"},
            {"Reformation Midi Skirt", "REFORMATION", "64.99", "118.00", "Sustainable midi skirt in vintage-inspired style"},
            {"& Other Stories Cardigan", "& OTHER STORIES", "49.99", "89.00", "Oversized cardigan in neutral tones"}
        };

        for (String[] item : womensClothing) {
            for (String size : sizes) {
                for (int i = 0; i < 2; i++) { // 2 of each size
                    products.add(createProduct(item[0], "CLOTHING", item[1],
                        Double.parseDouble(item[2]), Double.parseDouble(item[3]),
                        item[4], conditions[random.nextInt(conditions.length)],
                        size, storeIds[random.nextInt(storeIds.length)]));
                }
            }
        }

        return products;
    }

    private List<Product> createShoesProducts(String[] storeIds, String[] conditions) {
        List<Product> products = new ArrayList<>();
        Random random = new Random();
        String[] shoeSizes = {"6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"};

        String[][] shoes = {
            {"Nike Air Max 90", "NIKE", "89.99", "130.00", "Classic retro running shoes with visible Air cushioning"},
            {"Adidas Ultraboost 22", "ADIDAS", "149.99", "190.00", "Premium running shoes with Boost technology"},
            {"Converse Chuck Taylor All Star", "CONVERSE", "39.99", "65.00", "Iconic canvas sneakers in classic high-top style"},
            {"Vans Old Skool", "VANS", "44.99", "65.00", "Classic skate shoes with signature side stripe"},
            {"Air Jordan 1 Retro High", "JORDAN", "129.99", "170.00", "Legendary basketball shoes in OG colorways"},
            {"New Balance 574", "NEW BALANCE", "64.99", "85.00", "Comfortable lifestyle sneakers with ENCAP technology"},
            {"Puma RS-X³", "PUMA", "79.99", "110.00", "Chunky retro-inspired sneakers with bold styling"},
            {"Reebok Classic Leather", "REEBOK", "54.99", "75.00", "Timeless leather sneakers in clean white"},
            {"Dr. Martens 1460", "DR. MARTENS", "139.99", "170.00", "Iconic 8-eyelet leather boots with AirWair sole"},
            {"Timberland 6-Inch Premium Boots", "TIMBERLAND", "149.99", "190.00", "Waterproof leather work boots"},
            {"UGG Classic Short II", "UGG", "139.99", "180.00", "Cozy sheepskin boots with signature comfort"},
            {"Birkenstock Arizona Soft", "BIRKENSTOCK", "89.99", "135.00", "Comfortable two-strap sandals with cork footbed"},
            {"Clarks Desert Boot", "CLARKS", "99.99", "140.00", "Classic suede chukka boots in desert colorway"},
            {"Sperry Top-Sider", "SPERRY", "69.99", "95.00", "Traditional boat shoes with non-slip soles"},
            {"Hunter Original Tall Rain Boots", "HUNTER", "109.99", "150.00", "Waterproof wellington boots for all weather"}
        };

        for (String[] shoe : shoes) {
            for (String size : shoeSizes) {
                for (int i = 0; i < 2; i++) { // 2 of each size
                    products.add(createProduct(shoe[0], "SHOES", shoe[1],
                        Double.parseDouble(shoe[2]), Double.parseDouble(shoe[3]),
                        shoe[4], conditions[random.nextInt(conditions.length)],
                        size, storeIds[random.nextInt(storeIds.length)]));
                }
            }
        }

        return products;
    }

    private List<Product> createHomeProducts(String[] storeIds, String[] conditions) {
        List<Product> products = new ArrayList<>();
        Random random = new Random();

        String[][] homeItems = {
            {"KitchenAid Artisan Stand Mixer", "KITCHENAID", "199.99", "379.99", "Professional 5-quart stand mixer in multiple colors"},
            {"Ninja Professional Blender", "NINJA", "79.99", "149.99", "High-powered blender perfect for smoothies and food prep"},
            {"Instant Pot Duo 7-in-1", "INSTANT POT", "89.99", "129.99", "Multi-functional pressure cooker and slow cooker"},
            {"Dyson V15 Detect", "DYSON", "449.99", "649.99", "Cordless stick vacuum with laser detection"},
            {"Le Creuset Dutch Oven 5.5qt", "LE CREUSET", "199.99", "329.99", "Enameled cast iron Dutch oven in signature colors"},
            {"Vitamix 5200 Blender", "VITAMIX", "349.99", "449.99", "Professional-grade blender for restaurants and homes"},
            {"Nespresso Vertuo Next", "NESPRESSO", "149.99", "199.99", "Compact capsule coffee maker with one-touch brewing"},
            {"Cosori Air Fryer Max XL", "COSORI", "89.99", "129.99", "Large capacity air fryer for healthy cooking"},
            {"iRobot Roomba j7+", "IROBOT", "499.99", "649.99", "Smart robot vacuum with self-emptying base"},
            {"Breville Barista Express", "BREVILLE", "549.99", "699.99", "Semi-automatic espresso machine with built-in grinder"},
            {"Lodge Cast Iron Skillet 12\"", "LODGE", "34.99", "49.99", "Pre-seasoned cast iron cookware made in USA"},
            {"Cuisinart Food Processor 14-cup", "CUISINART", "149.99", "199.99", "Large capacity food processor for meal prep"}
        };

        for (String[] item : homeItems) {
            for (int i = 0; i < 3; i++) { // Create 3 of each
                products.add(createProduct(item[0], "HOME", item[1],
                    Double.parseDouble(item[2]), Double.parseDouble(item[3]),
                    item[4], conditions[random.nextInt(conditions.length)],
                    null, storeIds[random.nextInt(storeIds.length)]));
            }
        }

        return products;
    }

    private List<Product> createBooksProducts(String[] storeIds, String[] conditions) {
        List<Product> products = new ArrayList<>();
        Random random = new Random();

        String[][] books = {
            {"The Great Gatsby", "PENGUIN CLASSICS", "8.99", "16.99", "F. Scott Fitzgerald's masterpiece of American literature"},
            {"To Kill a Mockingbird", "HARPER LEE", "9.99", "17.99", "Pulitzer Prize winning novel about justice and morality"},
            {"1984", "GEORGE ORWELL", "10.99", "15.99", "Dystopian classic about surveillance and totalitarianism"},
            {"Pride and Prejudice", "JANE AUSTEN", "7.99", "14.99", "Romantic novel exploring marriage and society"},
            {"Harry Potter Complete Series", "J.K. ROWLING", "89.99", "159.99", "Complete 7-book magical series in box set"},
            {"The Lord of the Rings Trilogy", "J.R.R. TOLKIEN", "59.99", "89.99", "Epic fantasy trilogy in beautiful edition"},
            {"Dune", "FRANK HERBERT", "12.99", "19.99", "Science fiction epic about power and ecology"},
            {"The Catcher in the Rye", "J.D. SALINGER", "9.99", "16.99", "Coming-of-age novel about teenage alienation"},
            {"Atomic Habits", "JAMES CLEAR", "14.99", "18.99", "Bestselling guide to building good habits"},
            {"Educated", "TARA WESTOVER", "13.99", "17.99", "Powerful memoir about education and family"}
        };

        for (String[] book : books) {
            for (int i = 0; i < 4; i++) { // Create 4 of each
                products.add(createProduct(book[0], "BOOKS", book[1],
                    Double.parseDouble(book[2]), Double.parseDouble(book[3]),
                    book[4], conditions[random.nextInt(conditions.length)],
                    null, storeIds[random.nextInt(storeIds.length)]));
            }
        }

        return products;
    }

    private List<Product> createAccessoriesProducts(String[] storeIds, String[] conditions) {
        List<Product> products = new ArrayList<>();
        Random random = new Random();

        String[][] accessories = {
            {"Ray-Ban Aviator Classic", "RAY-BAN", "109.99", "154.99", "Iconic aviator sunglasses with crystal lenses"},
            {"Apple Watch Series 8", "APPLE", "329.99", "399.99", "Latest smartwatch with health monitoring features"},
            {"Fossil Grant Leather Wallet", "FOSSIL", "39.99", "79.99", "Genuine leather bifold wallet with RFID protection"},
            {"Herschel Little America Backpack", "HERSCHEL", "79.99", "99.99", "Classic mountaineering backpack for daily use"},
            {"Hermès Silk Scarf 90cm", "HERMÈS", "299.99", "390.00", "Luxury silk scarf with iconic design patterns"},
            {"New Era 59FIFTY Fitted Cap", "NEW ERA", "24.99", "39.99", "Official fitted baseball cap in team colors"},
            {"Calvin Klein Leather Belt", "CALVIN KLEIN", "34.99", "59.99", "Classic leather dress belt with silver buckle"},
            {"Coach Crossbody Bag", "COACH", "179.99", "295.00", "Designer leather crossbody in signature style"},
            {"The North Face Etip Gloves", "THE NORTH FACE", "29.99", "45.99", "Touchscreen compatible winter gloves"},
            {"Kate Spade Crossbody Purse", "KATE SPADE", "129.99", "198.00", "Elegant crossbody purse in saffiano leather"}
        };

        for (String[] accessory : accessories) {
            for (int i = 0; i < 3; i++) { // Create 3 of each
                products.add(createProduct(accessory[0], "ACCESSORIES", accessory[1],
                    Double.parseDouble(accessory[2]), Double.parseDouble(accessory[3]),
                    accessory[4], conditions[random.nextInt(conditions.length)],
                    null, storeIds[random.nextInt(storeIds.length)]));
            }
        }

        return products;
    }

    private List<Product> createFurnitureProducts(String[] storeIds, String[] conditions) {
        List<Product> products = new ArrayList<>();
        Random random = new Random();

        String[][] furniture = {
            {"IKEA BILLY Bookshelf White", "IKEA", "49.99", "59.99", "Classic white bookshelf with adjustable shelves"},
            {"Herman Miller Aeron Chair Size B", "HERMAN MILLER", "799.99", "1395.00", "Ergonomic office chair with PostureFit support"},
            {"West Elm Mid-Century Sofa", "WEST ELM", "999.99", "1399.99", "Modern 82\" sofa in performance velvet"},
            {"CB2 Compass Dining Table", "CB2", "699.99", "999.99", "Round walnut dining table seats 4"},
            {"IKEA HEMNES 8-Drawer Dresser", "IKEA", "179.99", "229.99", "White stain pine dresser with classic design"},
            {"Article Sven Armchair", "ARTICLE", "499.99", "699.99", "Mid-century modern armchair in charme tan"},
            {"Target Brightroom 5-Shelf Bookcase", "TARGET", "119.99", "149.99", "White wooden bookcase for any room"},
            {"Wayfair Zipcode Design Coffee Table", "WAYFAIR", "199.99", "299.99", "Glass-top coffee table with storage"},
            {"World Market Campaign Bar Cart", "WORLD MARKET", "249.99", "349.99", "Brass and marble bar cart for entertaining"},
            {"Ashley Signature Sectional", "ASHLEY", "1199.99", "1799.99", "Large sectional sofa with chaise lounge"}
        };

        for (String[] item : furniture) {
            products.add(createProduct(item[0], "FURNITURE", item[1],
                Double.parseDouble(item[2]), Double.parseDouble(item[3]),
                item[4], conditions[random.nextInt(conditions.length)],
                null, storeIds[random.nextInt(storeIds.length)]));
        }

        return products;
    }

    private List<Product> createJewelryProducts(String[] storeIds, String[] conditions) {
        List<Product> products = new ArrayList<>();
        Random random = new Random();

        String[][] jewelry = {
            {"Tiffany & Co. Return to Tiffany Necklace", "TIFFANY & CO.", "249.99", "395.00", "Sterling silver heart tag pendant necklace"},
            {"Pandora Moments Snake Chain Bracelet", "PANDORA", "99.99", "150.00", "Sterling silver bracelet perfect for charms"},
            {"Cartier Love Bracelet", "CARTIER", "1299.99", "1760.00", "18k yellow gold iconic love bracelet"},
            {"David Yurman Cable Classics Bracelet", "DAVID YURMAN", "395.00", "650.00", "Sterling silver cable bracelet with 14k gold"},
            {"Rolex Submariner Date", "ROLEX", "7999.99", "8550.00", "Iconic diving watch in stainless steel"},
            {"Omega Speedmaster Professional", "OMEGA", "3999.99", "5350.00", "Legendary moonwatch chronograph"},
            {"Monica Vinader Siren Wire Earrings", "MONICA VINADER", "195.00", "275.00", "18k gold vermeil wire earrings with gemstones"},
            {"Mejuri Bold Pearl Hoops", "MEJURI", "148.00", "198.00", "14k gold hoops with freshwater pearls"},
            {"Vintage Chanel Pearl Necklace", "CHANEL", "899.99", "1200.00", "Classic faux pearl necklace with CC logo"},
            {"Gucci Silver Ring with Interlocking G", "GUCCI", "250.00", "350.00", "Sterling silver ring with iconic logo"}
        };

        for (String[] item : jewelry) {
            for (int i = 0; i < 2; i++) { // Create 2 of each
                products.add(createProduct(item[0], "JEWELRY", item[1],
                    Double.parseDouble(item[2]), Double.parseDouble(item[3]),
                    item[4], conditions[random.nextInt(conditions.length)],
                    null, storeIds[random.nextInt(storeIds.length)]));
            }
        }

        return products;
    }

    private List<Product> createSportsProducts(String[] storeIds, String[] conditions) {
        List<Product> products = new ArrayList<>();
        Random random = new Random();

        String[][] sports = {
            {"Peloton Bike+", "PELOTON", "1899.99", "2495.00", "Interactive exercise bike with rotating touchscreen"},
            {"NordicTrack Treadmill", "NORDICTRACK", "999.99", "1499.99", "Incline trainer with iFit workouts"},
            {"Bowflex SelectTech Dumbbells", "BOWFLEX", "299.99", "429.99", "Adjustable dumbbells replace 15 sets"},
            {"Yeti Cooler 45qt", "YETI", "299.99", "399.99", "Premium cooler for camping and tailgating"},
            {"Patagonia Down Jacket", "PATAGONIA", "179.99", "279.99", "Lightweight down jacket for outdoor adventures"},
            {"REI Co-op Trail Running Shoes", "REI", "89.99", "130.00", "Lightweight trail running shoes for any terrain"},
            {"Hydro Flask Water Bottle", "HYDRO FLASK", "34.99", "44.99", "Insulated stainless steel water bottle"},
            {"Wilson Tennis Racket", "WILSON", "129.99", "199.99", "Professional tennis racket for intermediate players"},
            {"Specialized Road Bike", "SPECIALIZED", "899.99", "1299.99", "Lightweight carbon road bike for cyclists"}
        };

        for (String[] item : sports) {
            products.add(createProduct(item[0], "SPORTS", item[1],
                Double.parseDouble(item[2]), Double.parseDouble(item[3]),
                item[4], conditions[random.nextInt(conditions.length)],
                null, storeIds[random.nextInt(storeIds.length)]));
        }

        return products;
    }

    private List<Product> createToysProducts(String[] storeIds, String[] conditions) {
        List<Product> products = new ArrayList<>();
        Random random = new Random();

        String[][] toys = {
            {"LEGO Creator Expert Set", "LEGO", "149.99", "199.99", "Advanced building set for teens and adults"},
            {"Nintendo Switch Mario Kart Bundle", "NINTENDO", "359.99", "399.99", "Gaming console with Mario Kart game included"},
            {"Barbie Dreamhouse", "BARBIE", "169.99", "219.99", "3-story dollhouse with furniture and accessories"},
            {"Hot Wheels Track Set", "HOT WHEELS", "49.99", "79.99", "Ultimate racing track with loops and stunts"},
            {"Pokémon Trading Card Game Deck", "POKEMON", "24.99", "39.99", "Complete deck for competitive play"},
            {"American Girl Doll", "AMERICAN GIRL", "89.99", "110.00", "18-inch doll with historical storyline"},
            {"NERF Elite 2.0 Blaster", "NERF", "19.99", "29.99", "Foam dart blaster for active play"},
            {"Monopoly Board Game", "HASBRO", "14.99", "19.99", "Classic property trading board game"}
        };

        for (String[] item : toys) {
            for (int i = 0; i < 2; i++) { // Create 2 of each
                products.add(createProduct(item[0], "TOYS", item[1],
                    Double.parseDouble(item[2]), Double.parseDouble(item[3]),
                    item[4], conditions[random.nextInt(conditions.length)],
                    null, storeIds[random.nextInt(storeIds.length)]));
            }
        }

        return products;
    }

    private Product createProduct(String name, String category, String brand,
                                 double price, double originalPrice, String description,
                                 String condition, String size, String storeId) {
        Product product = new Product();
        product.setName(name);
        product.setCategory(category);
        product.setBrand(brand);
        product.setPrice(price);
        product.setOriginalPrice(originalPrice);
        product.setDescription(description);
        product.setCondition(condition);
        product.setSize(size);
        product.setStoreId(storeId);
        product.setAvailable(true);
        // Note: createdAt and updatedAt are automatically managed by JPA

        return product;
    }
}