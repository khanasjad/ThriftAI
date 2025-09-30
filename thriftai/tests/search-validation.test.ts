/**
 * Comprehensive Search Validation Test Suite
 * Tests 100 realistic user queries to ensure accurate product matching
 */

interface SearchTestCase {
  query: string
  expectedKeywords: string[]
  expectedCategory?: string
  minResults?: number
  shouldNotContain?: string[]
  description: string
}

const searchTestCases: SearchTestCase[] = [
  // Electronics & Technology (20 queries)
  {
    query: "gaming laptop under 1000",
    expectedKeywords: ["laptop", "gaming"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    shouldNotContain: ["shirt", "shoes"],
    description: "Gaming laptop with price filter"
  },
  {
    query: "wireless headphones",
    expectedKeywords: ["headphones", "wireless"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Wireless audio devices"
  },
  {
    query: "smartphone with good camera",
    expectedKeywords: ["phone", "smartphone", "camera"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Phone with camera feature"
  },
  {
    query: "mechanical keyboard",
    expectedKeywords: ["keyboard"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Computer keyboard"
  },
  {
    query: "usb c charger fast charging",
    expectedKeywords: ["charger", "usb"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "USB-C charging cable"
  },
  {
    query: "4k monitor 27 inch",
    expectedKeywords: ["monitor"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Computer monitor with size"
  },
  {
    query: "bluetooth speaker waterproof",
    expectedKeywords: ["speaker", "bluetooth"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Portable speaker"
  },
  {
    query: "smartwatch fitness tracker",
    expectedKeywords: ["watch", "smart"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Wearable fitness device"
  },
  {
    query: "tablet for drawing",
    expectedKeywords: ["tablet"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Digital drawing tablet"
  },
  {
    query: "webcam 1080p",
    expectedKeywords: ["webcam", "camera"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "HD webcam"
  },
  {
    query: "external hard drive 2tb",
    expectedKeywords: ["hard drive", "storage"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "External storage device"
  },
  {
    query: "gaming mouse rgb",
    expectedKeywords: ["mouse", "gaming"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Gaming mouse with RGB"
  },
  {
    query: "portable power bank",
    expectedKeywords: ["power bank", "battery"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Portable charger"
  },
  {
    query: "noise cancelling earbuds",
    expectedKeywords: ["earbuds", "headphones"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Noise cancelling audio"
  },
  {
    query: "graphic tablet for artists",
    expectedKeywords: ["tablet", "graphic"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Drawing tablet for art"
  },
  {
    query: "hdmi cable 10 feet",
    expectedKeywords: ["hdmi", "cable"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "HDMI connection cable"
  },
  {
    query: "wifi router dual band",
    expectedKeywords: ["router", "wifi"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Wireless router"
  },
  {
    query: "laptop stand adjustable",
    expectedKeywords: ["laptop", "stand"],
    expectedCategory: "ELECTRONICS",
    minResults: 1,
    description: "Laptop accessory stand"
  },
  {
    query: "phone case with card holder",
    expectedKeywords: ["phone", "case"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Phone protective case"
  },
  {
    query: "led desk lamp",
    expectedKeywords: ["lamp", "led"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Desk lighting"
  },

  // Clothing & Fashion (20 queries)
  {
    query: "men's running shoes",
    expectedKeywords: ["shoes", "running"],
    expectedCategory: "SHOES",
    minResults: 1,
    description: "Athletic footwear for men"
  },
  {
    query: "women's summer dress",
    expectedKeywords: ["dress"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Summer clothing for women"
  },
  {
    query: "vintage leather jacket",
    expectedKeywords: ["jacket", "leather"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Vintage outerwear"
  },
  {
    query: "casual t-shirt cotton",
    expectedKeywords: ["shirt", "t-shirt"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Cotton t-shirt"
  },
  {
    query: "denim jeans slim fit",
    expectedKeywords: ["jeans", "denim"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Slim fit denim pants"
  },
  {
    query: "winter coat warm",
    expectedKeywords: ["coat", "jacket"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Winter outerwear"
  },
  {
    query: "athletic shorts",
    expectedKeywords: ["shorts"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Sports shorts"
  },
  {
    query: "formal dress shirt",
    expectedKeywords: ["shirt", "dress"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Formal wear shirt"
  },
  {
    query: "yoga pants women",
    expectedKeywords: ["pants", "yoga"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Yoga workout pants"
  },
  {
    query: "hoodie sweatshirt",
    expectedKeywords: ["hoodie", "sweatshirt"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Casual hoodie"
  },
  {
    query: "sneakers white",
    expectedKeywords: ["sneakers", "shoes"],
    expectedCategory: "SHOES",
    minResults: 1,
    description: "White sneakers"
  },
  {
    query: "business suit men",
    expectedKeywords: ["suit"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Men's business suit"
  },
  {
    query: "sundress floral",
    expectedKeywords: ["dress"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Floral sundress"
  },
  {
    query: "leather boots",
    expectedKeywords: ["boots", "leather"],
    expectedCategory: "SHOES",
    minResults: 1,
    description: "Leather footwear"
  },
  {
    query: "tank top workout",
    expectedKeywords: ["tank", "top", "shirt"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Workout tank top"
  },
  {
    query: "cardigan sweater",
    expectedKeywords: ["cardigan", "sweater"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Cardigan sweater"
  },
  {
    query: "polo shirt",
    expectedKeywords: ["polo", "shirt"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Polo style shirt"
  },
  {
    query: "cargo pants",
    expectedKeywords: ["pants", "cargo"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Cargo style pants"
  },
  {
    query: "rain jacket waterproof",
    expectedKeywords: ["jacket", "rain"],
    expectedCategory: "CLOTHING",
    minResults: 1,
    description: "Waterproof jacket"
  },
  {
    query: "flip flops sandals",
    expectedKeywords: ["sandals", "flip"],
    expectedCategory: "SHOES",
    minResults: 1,
    description: "Summer sandals"
  },

  // Accessories & Bags (15 queries)
  {
    query: "leather backpack",
    expectedKeywords: ["backpack", "bag"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Leather bag"
  },
  {
    query: "designer handbag",
    expectedKeywords: ["handbag", "bag"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Designer purse"
  },
  {
    query: "travel duffel bag",
    expectedKeywords: ["bag", "duffel"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Travel bag"
  },
  {
    query: "wallet for men",
    expectedKeywords: ["wallet"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Men's wallet"
  },
  {
    query: "crossbody purse",
    expectedKeywords: ["purse", "bag", "crossbody"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Crossbody style bag"
  },
  {
    query: "laptop bag professional",
    expectedKeywords: ["laptop", "bag"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Professional laptop bag"
  },
  {
    query: "messenger bag canvas",
    expectedKeywords: ["messenger", "bag"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Canvas messenger bag"
  },
  {
    query: "tote bag large",
    expectedKeywords: ["tote", "bag"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Large tote bag"
  },
  {
    query: "sunglasses polarized",
    expectedKeywords: ["sunglasses", "glasses"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Polarized sunglasses"
  },
  {
    query: "leather belt",
    expectedKeywords: ["belt"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Leather belt"
  },
  {
    query: "watch leather strap",
    expectedKeywords: ["watch"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Watch with leather strap"
  },
  {
    query: "baseball cap",
    expectedKeywords: ["cap", "hat"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Baseball style cap"
  },
  {
    query: "scarf winter",
    expectedKeywords: ["scarf"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Winter scarf"
  },
  {
    query: "gym bag with shoe compartment",
    expectedKeywords: ["gym", "bag"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Gym duffel bag"
  },
  {
    query: "fanny pack",
    expectedKeywords: ["pack", "bag"],
    expectedCategory: "ACCESSORIES",
    minResults: 1,
    description: "Waist pack"
  },

  // Home & Kitchen (15 queries)
  {
    query: "coffee maker programmable",
    expectedKeywords: ["coffee", "maker"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Coffee brewing machine"
  },
  {
    query: "blender for smoothies",
    expectedKeywords: ["blender"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Smoothie blender"
  },
  {
    query: "non stick frying pan",
    expectedKeywords: ["pan", "frying"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Non-stick cookware"
  },
  {
    query: "knife set kitchen",
    expectedKeywords: ["knife", "kitchen"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Kitchen knife set"
  },
  {
    query: "cutting board bamboo",
    expectedKeywords: ["cutting", "board"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Bamboo cutting board"
  },
  {
    query: "mixing bowls set",
    expectedKeywords: ["bowl", "mixing"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Kitchen mixing bowls"
  },
  {
    query: "storage containers",
    expectedKeywords: ["storage", "container"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Food storage containers"
  },
  {
    query: "vacuum cleaner cordless",
    expectedKeywords: ["vacuum", "cleaner"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Cordless vacuum"
  },
  {
    query: "throw pillows decorative",
    expectedKeywords: ["pillow"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Decorative pillows"
  },
  {
    query: "bed sheets cotton",
    expectedKeywords: ["sheets", "bed"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Cotton bed sheets"
  },
  {
    query: "towel set bathroom",
    expectedKeywords: ["towel"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Bathroom towels"
  },
  {
    query: "candles scented",
    expectedKeywords: ["candle"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Scented candles"
  },
  {
    query: "picture frames",
    expectedKeywords: ["frame", "picture"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Photo frames"
  },
  {
    query: "alarm clock digital",
    expectedKeywords: ["alarm", "clock"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Digital alarm clock"
  },
  {
    query: "trash can kitchen",
    expectedKeywords: ["trash", "can"],
    expectedCategory: "HOME",
    minResults: 1,
    description: "Kitchen waste bin"
  },

  // Sports & Outdoors (15 queries)
  {
    query: "yoga mat thick",
    expectedKeywords: ["yoga", "mat"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Thick yoga mat"
  },
  {
    query: "dumbbell set",
    expectedKeywords: ["dumbbell", "weight"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Weight training dumbbells"
  },
  {
    query: "resistance bands",
    expectedKeywords: ["resistance", "band"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Exercise resistance bands"
  },
  {
    query: "camping tent 4 person",
    expectedKeywords: ["tent", "camping"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "4-person camping tent"
  },
  {
    query: "sleeping bag warm",
    expectedKeywords: ["sleeping", "bag"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Warm sleeping bag"
  },
  {
    query: "hiking backpack",
    expectedKeywords: ["backpack", "hiking"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Hiking backpack"
  },
  {
    query: "water bottle insulated",
    expectedKeywords: ["water", "bottle"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Insulated water bottle"
  },
  {
    query: "bicycle helmet",
    expectedKeywords: ["helmet", "bike"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Cycling helmet"
  },
  {
    query: "soccer ball",
    expectedKeywords: ["soccer", "ball"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Soccer ball"
  },
  {
    query: "basketball indoor",
    expectedKeywords: ["basketball", "ball"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Indoor basketball"
  },
  {
    query: "tennis racket",
    expectedKeywords: ["tennis", "racket"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Tennis racket"
  },
  {
    query: "golf clubs set",
    expectedKeywords: ["golf", "club"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Golf club set"
  },
  {
    query: "jump rope",
    expectedKeywords: ["jump", "rope"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Exercise jump rope"
  },
  {
    query: "foam roller",
    expectedKeywords: ["foam", "roller"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Muscle foam roller"
  },
  {
    query: "fishing rod",
    expectedKeywords: ["fishing", "rod"],
    expectedCategory: "SPORTS",
    minResults: 1,
    description: "Fishing rod"
  },

  // Books & Media (10 queries)
  {
    query: "best selling novel",
    expectedKeywords: ["book", "novel"],
    expectedCategory: "BOOKS",
    minResults: 1,
    description: "Popular fiction book"
  },
  {
    query: "cookbook healthy recipes",
    expectedKeywords: ["cookbook", "book"],
    expectedCategory: "BOOKS",
    minResults: 1,
    description: "Healthy cooking book"
  },
  {
    query: "self help book",
    expectedKeywords: ["book"],
    expectedCategory: "BOOKS",
    minResults: 1,
    description: "Self-improvement book"
  },
  {
    query: "children's picture book",
    expectedKeywords: ["book"],
    expectedCategory: "BOOKS",
    minResults: 1,
    description: "Kids picture book"
  },
  {
    query: "mystery thriller",
    expectedKeywords: ["book", "thriller"],
    expectedCategory: "BOOKS",
    minResults: 1,
    description: "Mystery genre book"
  },
  {
    query: "biography famous person",
    expectedKeywords: ["biography", "book"],
    expectedCategory: "BOOKS",
    minResults: 1,
    description: "Biography book"
  },
  {
    query: "science fiction novel",
    expectedKeywords: ["book", "fiction"],
    expectedCategory: "BOOKS",
    minResults: 1,
    description: "Sci-fi book"
  },
  {
    query: "business book",
    expectedKeywords: ["business", "book"],
    expectedCategory: "BOOKS",
    minResults: 1,
    description: "Business strategy book"
  },
  {
    query: "poetry collection",
    expectedKeywords: ["poetry", "book"],
    expectedCategory: "BOOKS",
    minResults: 1,
    description: "Poetry book"
  },
  {
    query: "history book",
    expectedKeywords: ["history", "book"],
    expectedCategory: "BOOKS",
    minResults: 1,
    description: "Historical book"
  },

  // Automotive (5 queries)
  {
    query: "car phone mount",
    expectedKeywords: ["car", "phone", "mount"],
    expectedCategory: "AUTOMOTIVE",
    minResults: 1,
    description: "Car phone holder"
  },
  {
    query: "car vacuum cleaner",
    expectedKeywords: ["car", "vacuum"],
    expectedCategory: "AUTOMOTIVE",
    minResults: 1,
    description: "Automotive vacuum"
  },
  {
    query: "car charger usb",
    expectedKeywords: ["car", "charger"],
    expectedCategory: "AUTOMOTIVE",
    minResults: 1,
    description: "Car USB charger"
  },
  {
    query: "dash cam",
    expectedKeywords: ["dash", "cam", "camera"],
    expectedCategory: "AUTOMOTIVE",
    minResults: 1,
    description: "Dashboard camera"
  },
  {
    query: "car air freshener",
    expectedKeywords: ["car", "air", "freshener"],
    expectedCategory: "AUTOMOTIVE",
    minResults: 1,
    description: "Car air freshener"
  }
]

export { searchTestCases, SearchTestCase }