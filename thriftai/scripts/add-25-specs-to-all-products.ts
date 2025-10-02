import { prisma } from '../src/lib/prisma'

// Helper functions for random selection
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const pickMultiple = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// Comprehensive 25-parameter specification templates for all categories
const categorySpecs: Record<string, any> = {
  // ============ ELECTRONICS ============

  LAPTOPS: () => ({
    processor: pick(['Intel Core i5-13500H', 'Intel Core i7-13700H', 'Intel Core i9-13900H', 'AMD Ryzen 5 7600', 'AMD Ryzen 7 7700', 'AMD Ryzen 9 7900', 'Apple M1', 'Apple M2', 'Apple M2 Pro']),
    ram: pick(['8GB DDR4', '16GB DDR4', '16GB DDR5', '32GB DDR4', '32GB DDR5', '64GB DDR5']),
    storage: pick(['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD', '512GB NVMe', '1TB NVMe', '2TB NVMe']),
    storageType: pick(['NVMe SSD', 'SATA SSD', 'PCIe Gen 4 SSD']),
    screenSize: pick(['13.3 inches', '14 inches', '15.6 inches', '16 inches', '17.3 inches']),
    screenResolution: pick(['1920x1080 (FHD)', '2560x1440 (QHD)', '3840x2160 (4K)', '2880x1800 (Retina)']),
    refreshRate: pick(['60Hz', '120Hz', '144Hz', '165Hz', '240Hz']),
    panelType: pick(['IPS', 'OLED', 'Mini-LED', 'LCD']),
    gpu: pick(['Integrated Graphics', 'NVIDIA RTX 3050', 'NVIDIA RTX 3060', 'NVIDIA RTX 4050', 'NVIDIA RTX 4060', 'AMD Radeon RX 6600M', 'Intel Iris Xe']),
    batteryCapacity: pick(['45Wh', '56Wh', '68Wh', '80Wh', '99Wh']),
    batteryLife: pick(['6 hours', '8 hours', '10 hours', '12 hours', '15 hours', '18 hours']),
    weight: pick(['1.2 kg', '1.5 kg', '1.8 kg', '2.0 kg', '2.3 kg', '2.5 kg']),
    thickness: pick(['14.9 mm', '16.8 mm', '18.5 mm', '19.9 mm']),
    operatingSystem: pick(['Windows 11 Home', 'Windows 11 Pro', 'macOS Ventura', 'macOS Sonoma', 'Ubuntu Linux']),
    ports: pick(['2x USB-A, 2x USB-C, HDMI', '3x USB-A, 1x USB-C, HDMI', '4x USB-C (Thunderbolt)', '2x USB-C, 1x USB-A, HDMI, SD Card']),
    wifi: pick(['Wi-Fi 6 (802.11ax)', 'Wi-Fi 6E', 'Wi-Fi 5 (802.11ac)']),
    bluetooth: pick(['Bluetooth 5.0', 'Bluetooth 5.1', 'Bluetooth 5.2', 'Bluetooth 5.3']),
    webcam: pick(['720p HD', '1080p FHD', '1080p with IR', '4K']),
    keyboard: pick(['Backlit', 'RGB Backlit', 'Non-backlit', 'Mechanical']),
    touchscreen: pick(['Yes', 'No']),
    fingerprint: pick(['Yes', 'No']),
    build: pick(['Aluminum Unibody', 'Plastic', 'Magnesium Alloy', 'Carbon Fiber']),
    color: pick(['Silver', 'Space Gray', 'Black', 'White', 'Blue', 'Rose Gold']),
    warranty: pick(['1 Year', '2 Years', '3 Years', 'AppleCare+']),
    condition: pick(['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'])
  }),

  SMARTPHONES: () => ({
    processor: pick(['Snapdragon 8 Gen 2', 'Snapdragon 8 Gen 1', 'Apple A16 Bionic', 'Apple A15 Bionic', 'Google Tensor G3', 'MediaTek Dimensity 9200', 'Exynos 2200']),
    ram: pick(['4GB', '6GB', '8GB', '12GB', '16GB', '18GB']),
    storage: pick(['64GB', '128GB', '256GB', '512GB', '1TB']),
    expandableStorage: pick(['Yes (up to 1TB)', 'Yes (up to 512GB)', 'No']),
    screenSize: pick(['5.8 inches', '6.1 inches', '6.4 inches', '6.7 inches', '6.9 inches']),
    screenResolution: pick(['1080x2340 (FHD+)', '1440x3200 (QHD+)', '1284x2778', '1170x2532']),
    refreshRate: pick(['60Hz', '90Hz', '120Hz', '144Hz']),
    displayType: pick(['AMOLED', 'Super AMOLED', 'OLED', 'IPS LCD', 'Dynamic AMOLED']),
    rearCamera: pick(['12MP', '48MP', '50MP', '64MP', '108MP', '200MP']),
    cameraSetup: pick(['Single', 'Dual (Main + Ultra-wide)', 'Triple (Main + Ultra-wide + Telephoto)', 'Quad Camera']),
    frontCamera: pick(['8MP', '12MP', '16MP', '32MP', '40MP']),
    videoRecording: pick(['1080p@30fps', '1080p@60fps', '4K@30fps', '4K@60fps', '8K@24fps']),
    battery: pick(['3000mAh', '4000mAh', '4500mAh', '5000mAh', '5500mAh', '6000mAh']),
    fastCharging: pick(['18W', '25W', '33W', '45W', '65W', '120W', '150W']),
    wirelessCharging: pick(['Yes (15W)', 'Yes (10W)', 'Yes (7.5W)', 'No']),
    operatingSystem: pick(['Android 13', 'Android 14', 'iOS 16', 'iOS 17', 'One UI 5.1', 'MIUI 14']),
    simSlots: pick(['Dual SIM', 'Single SIM', 'eSIM + Nano SIM', 'Dual eSIM']),
    network: pick(['5G', '4G LTE', '5G mmWave']),
    waterResistance: pick(['IP68', 'IP67', 'IP53', 'None']),
    biometrics: pick(['Fingerprint (under display)', 'Fingerprint (side)', 'Face ID', 'Face Unlock + Fingerprint']),
    nfc: pick(['Yes', 'No']),
    weight: pick(['150g', '170g', '190g', '210g', '230g']),
    build: pick(['Glass front + Glass back', 'Glass front + Plastic back', 'Ceramic Shield', 'Gorilla Glass Victus']),
    color: pick(['Black', 'White', 'Blue', 'Red', 'Green', 'Purple', 'Gold', 'Silver']),
    condition: pick(['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'])
  }),

  TABLETS: () => ({
    processor: pick(['Apple M2', 'Apple M1', 'Snapdragon 8 Gen 2', 'Snapdragon 870', 'MediaTek Helio G99', 'Exynos 1380']),
    ram: pick(['3GB', '4GB', '6GB', '8GB', '12GB', '16GB']),
    storage: pick(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB']),
    expandableStorage: pick(['Yes (up to 1TB)', 'Yes (up to 512GB)', 'No']),
    screenSize: pick(['8 inches', '9.7 inches', '10.2 inches', '10.9 inches', '11 inches', '12.9 inches']),
    screenResolution: pick(['1280x800', '1920x1200', '2160x1620', '2388x1668', '2732x2048']),
    refreshRate: pick(['60Hz', '90Hz', '120Hz']),
    displayType: pick(['IPS LCD', 'AMOLED', 'Liquid Retina', 'Mini-LED']),
    rearCamera: pick(['5MP', '8MP', '12MP', '13MP']),
    frontCamera: pick(['5MP', '7MP', '8MP', '12MP']),
    videoRecording: pick(['1080p@30fps', '4K@30fps', '4K@60fps']),
    battery: pick(['5000mAh', '7000mAh', '8000mAh', '10000mAh', '12000mAh']),
    batteryLife: pick(['8 hours', '10 hours', '12 hours', '15 hours']),
    fastCharging: pick(['18W', '20W', '25W', '30W', '45W']),
    operatingSystem: pick(['iPadOS 17', 'Android 13', 'Android 14', 'HarmonyOS']),
    wifi: pick(['Wi-Fi 6', 'Wi-Fi 6E', 'Wi-Fi 5']),
    cellular: pick(['5G', '4G LTE', 'Wi-Fi Only']),
    stylus: pick(['Apple Pencil (2nd gen)', 'S Pen included', 'Compatible (sold separately)', 'Not supported']),
    keyboard: pick(['Magic Keyboard compatible', 'Smart Keyboard compatible', 'Detachable keyboard included', 'Not supported']),
    speakers: pick(['Quad speakers', 'Dual speakers', 'Single speaker']),
    weight: pick(['300g', '450g', '500g', '600g', '700g']),
    thickness: pick(['5.9mm', '6.1mm', '6.9mm', '7.5mm']),
    build: pick(['Aluminum', 'Plastic', 'Glass back']),
    color: pick(['Space Gray', 'Silver', 'Gold', 'Blue', 'Purple', 'Black']),
    condition: pick(['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'])
  }),

  SMARTWATCHES: () => ({
    brand: pick(['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Amazfit', 'Huawei', 'Fossil']),
    displaySize: pick(['1.1 inches', '1.3 inches', '1.4 inches', '1.7 inches', '1.9 inches']),
    displayType: pick(['AMOLED', 'OLED', 'LCD', 'E-ink', 'Retina']),
    resolution: pick(['240x240', '360x360', '390x390', '454x454', '368x448']),
    alwaysOnDisplay: pick(['Yes', 'No']),
    touchscreen: pick(['Yes', 'No']),
    batteryLife: pick(['18 hours', '24 hours', '36 hours', '2 days', '5 days', '7 days', '14 days']),
    chargingTime: pick(['1 hour', '1.5 hours', '2 hours', '2.5 hours']),
    chargingType: pick(['Magnetic', 'Wireless', 'USB']),
    waterResistance: pick(['3 ATM (30m)', '5 ATM (50m)', '10 ATM (100m)', 'IP68']),
    sensors: pickMultiple(['Heart Rate', 'SpO2', 'ECG', 'GPS', 'Gyroscope', 'Accelerometer', 'Altimeter', 'Compass', 'Temperature'], 5).join(', '),
    gps: pick(['Built-in GPS', 'Connected GPS', 'GLONASS', 'GPS + GLONASS']),
    heartRateMonitor: pick(['Optical', 'Electrical', 'Both']),
    sleepTracking: pick(['Yes', 'Advanced', 'Basic', 'No']),
    workoutModes: pick(['20+ modes', '50+ modes', '100+ modes', '120+ modes']),
    nfc: pick(['Yes (NFC Payments)', 'No']),
    wifi: pick(['Yes', 'No']),
    bluetooth: pick(['Bluetooth 5.0', 'Bluetooth 5.1', 'Bluetooth 5.2', 'Bluetooth 5.3']),
    cellular: pick(['LTE', '4G', 'Wi-Fi only']),
    voiceAssistant: pick(['Siri', 'Google Assistant', 'Alexa', 'Bixby', 'None']),
    storage: pick(['8GB', '16GB', '32GB', '64GB']),
    strapMaterial: pick(['Silicone', 'Leather', 'Stainless Steel', 'Nylon', 'Titanium']),
    caseMaterial: pick(['Aluminum', 'Stainless Steel', 'Titanium', 'Plastic', 'Ceramic']),
    weight: pick(['25g', '30g', '40g', '50g', '60g']),
    condition: pick(['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'])
  }),

  HEADPHONES: () => ({
    type: pick(['Over-ear', 'On-ear', 'In-ear', 'Earbuds', 'True Wireless']),
    connectivity: pick(['Wired', 'Wireless', 'Wired + Wireless']),
    bluetooth: pick(['Bluetooth 5.0', 'Bluetooth 5.1', 'Bluetooth 5.2', 'Bluetooth 5.3', 'Not applicable']),
    noiseCancellation: pick(['Active (ANC)', 'Passive', 'Hybrid ANC', 'None']),
    drivers: pick(['30mm', '40mm', '50mm', 'Dynamic drivers', 'Planar magnetic']),
    frequencyResponse: pick(['20Hz-20kHz', '10Hz-40kHz', '5Hz-35kHz']),
    impedance: pick(['16 Ohms', '32 Ohms', '48 Ohms', '80 Ohms', '250 Ohms']),
    sensitivity: pick(['95 dB', '100 dB', '105 dB', '110 dB']),
    microphoneType: pick(['Built-in', 'Detachable boom', 'Inline', 'Beamforming', 'None']),
    battery: pick(['Not applicable', '20 hours', '30 hours', '40 hours', '50 hours', '60 hours']),
    chargingTime: pick(['Not applicable', '1.5 hours', '2 hours', '3 hours']),
    chargingType: pick(['Not applicable', 'USB-C', 'Micro-USB', 'Wireless', 'Lightning']),
    quickCharge: pick(['Not applicable', '10 min = 3 hours', '15 min = 5 hours', 'No']),
    waterResistance: pick(['IPX4', 'IPX5', 'IPX7', 'None']),
    controls: pick(['Touch controls', 'Button controls', 'Both', 'App control']),
    voiceAssistant: pick(['Siri', 'Google Assistant', 'Alexa', 'Multiple', 'None']),
    codec: pick(['SBC', 'AAC', 'aptX', 'aptX HD', 'LDAC', 'LC3']),
    multipoint: pick(['Yes (2 devices)', 'Yes (3+ devices)', 'No']),
    foldable: pick(['Yes', 'No']),
    caseIncluded: pick(['Hard case', 'Soft pouch', 'Charging case', 'No case']),
    cableLength: pick(['Not applicable', '1.2m', '1.5m', '2m', '3m']),
    weight: pick(['150g', '200g', '250g', '300g', '4g (per earbud)', '6g (per earbud)']),
    color: pick(['Black', 'White', 'Silver', 'Blue', 'Red', 'Pink', 'Green']),
    warranty: pick(['6 months', '1 year', '2 years', '3 years']),
    condition: pick(['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'])
  }),

  CAMERAS: () => ({
    type: pick(['DSLR', 'Mirrorless', 'Point & Shoot', 'Action Camera', 'Film Camera']),
    megapixels: pick(['16MP', '20MP', '24MP', '32MP', '45MP', '50MP', '61MP']),
    sensorSize: pick(['Full Frame', 'APS-C', 'Micro Four Thirds', '1 inch', '1/2.3 inch']),
    sensorType: pick(['CMOS', 'BSI-CMOS', 'Stacked CMOS', 'CCD']),
    processor: pick(['DIGIC X', 'EXPEED 7', 'BIONZ XR', 'TruePic X', 'Venus Engine']),
    isoRange: pick(['100-12800', '100-25600', '100-51200', '100-102400', '50-204800']),
    shutterSpeed: pick(['1/4000s', '1/8000s', '1/16000s', '30s-1/8000s']),
    burstMode: pick(['5 fps', '10 fps', '15 fps', '20 fps', '30 fps']),
    autofocusPoints: pick(['11 AF points', '45 AF points', '153 AF points', '399 AF points', '693 AF points']),
    autofocusType: pick(['Phase detection', 'Contrast detection', 'Hybrid AF', 'Eye AF']),
    videoResolution: pick(['1080p', '4K 30fps', '4K 60fps', '6K', '8K 30fps', '8K 60fps']),
    videoFormat: pick(['MP4', 'MOV', 'AVCHD', 'H.264', 'H.265', 'ProRes']),
    stabilization: pick(['In-body (5-axis)', 'In-body (3-axis)', 'Lens-based', 'Electronic', 'None']),
    viewfinder: pick(['Optical', 'Electronic (EVF)', 'Hybrid', 'LCD only']),
    lcdScreen: pick(['3 inch fixed', '3 inch tilting', '3.2 inch articulating', 'Touchscreen']),
    connectivity: pick(['Wi-Fi', 'Bluetooth', 'Wi-Fi + Bluetooth', 'NFC', 'USB-C']),
    storage: pick(['SD card', 'CFexpress', 'Dual SD', 'SD + CFexpress']),
    batteryLife: pick(['200 shots', '400 shots', '600 shots', '800 shots', '1000+ shots']),
    mountType: pick(['Canon EF', 'Canon RF', 'Nikon F', 'Nikon Z', 'Sony E', 'Micro Four Thirds', 'Fuji X']),
    weather: pick(['Weather-sealed', 'Splash-resistant', 'Not weather-sealed']),
    builtInFlash: pick(['Yes', 'No']),
    weight: pick(['400g', '600g', '800g', '1000g', '1200g']),
    dimensions: pick(['120x90x70mm', '130x100x80mm', '140x110x90mm']),
    color: pick(['Black', 'Silver', 'Graphite', 'White']),
    condition: pick(['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'])
  }),

  MONITORS: () => ({
    screenSize: pick(['21.5 inches', '24 inches', '27 inches', '32 inches', '34 inches', '38 inches', '43 inches', '49 inches']),
    resolution: pick(['1920x1080 (FHD)', '2560x1440 (QHD)', '3440x1440 (UWQHD)', '3840x2160 (4K)', '5120x2160 (5K)', '7680x4320 (8K)']),
    panelType: pick(['IPS', 'VA', 'TN', 'OLED', 'Mini-LED', 'Quantum Dot']),
    refreshRate: pick(['60Hz', '75Hz', '100Hz', '120Hz', '144Hz', '165Hz', '240Hz', '360Hz']),
    responseTime: pick(['1ms', '2ms', '4ms', '5ms', '8ms']),
    aspectRatio: pick(['16:9', '21:9', '32:9', '16:10', '4:3']),
    brightness: pick(['250 cd/m²', '300 cd/m²', '350 cd/m²', '400 cd/m²', '500 cd/m²', '1000 cd/m²']),
    contrastRatio: pick(['1000:1', '3000:1', '5000:1', '1000000:1 (dynamic)']),
    colorGamut: pick(['72% NTSC', '99% sRGB', '95% DCI-P3', '100% Adobe RGB']),
    hdr: pick(['HDR10', 'HDR400', 'HDR600', 'HDR1000', 'Dolby Vision', 'None']),
    curvedScreen: pick(['Yes (1800R)', 'Yes (1500R)', 'Yes (1000R)', 'Flat']),
    adaptiveSync: pick(['G-Sync', 'FreeSync', 'G-Sync Compatible', 'None']),
    ports: pick(['HDMI x2, DisplayPort', 'HDMI x2, DisplayPort x2', 'HDMI, DisplayPort, USB-C', 'Thunderbolt 4, DisplayPort']),
    usbHub: pick(['USB 3.0 x4', 'USB-C x2', 'No USB hub']),
    speakers: pick(['Built-in 2W x2', 'Built-in 5W x2', 'Built-in 10W x2', 'None']),
    stand: pick(['Tilt only', 'Tilt + Swivel', 'Fully adjustable (Height + Tilt + Swivel + Pivot)', 'VESA mount only']),
    vesaMount: pick(['75x75mm', '100x100mm', '200x200mm', 'Not supported']),
    bluelightFilter: pick(['Yes', 'No']),
    flickerFree: pick(['Yes', 'No']),
    powerConsumption: pick(['20W', '30W', '40W', '50W', '65W']),
    weight: pick(['3 kg', '4.5 kg', '6 kg', '8 kg', '10 kg']),
    warranty: pick(['1 year', '2 years', '3 years', '5 years']),
    color: pick(['Black', 'Silver', 'White', 'Space Gray']),
    condition: pick(['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'])
  }),

  KEYBOARDS: () => ({
    type: pick(['Mechanical', 'Membrane', 'Optical', 'Chiclet', 'Scissor-switch']),
    switchType: pick(['Cherry MX Red', 'Cherry MX Blue', 'Cherry MX Brown', 'Cherry MX Silent', 'Razer Green', 'Gateron Yellow', 'Kailh Box White', 'Membrane']),
    switchLifespan: pick(['50 million keystrokes', '100 million keystrokes', '150 million keystrokes', 'N/A']),
    layout: pick(['Full-size (104-key)', 'TKL (87-key)', '75%', '60%', 'Compact (84-key)', 'Ergonomic split']),
    connectivity: pick(['Wired (USB)', 'Wireless (2.4GHz)', 'Bluetooth', 'Tri-mode (Wired + 2.4GHz + BT)']),
    backlighting: pick(['RGB per-key', 'RGB zones', 'Single color', 'White', 'None']),
    keycaps: pick(['ABS plastic', 'PBT double-shot', 'PBT dye-sublimated', 'Pudding keycaps']),
    polling: pick(['125Hz', '500Hz', '1000Hz', '2000Hz', '4000Hz', '8000Hz']),
    nkro: pick(['Full N-key rollover', '10-key rollover', '6-key rollover']),
    macroKeys: pick(['Dedicated macro keys', 'Programmable keys', 'None']),
    mediaKeys: pick(['Dedicated media controls', 'Function layer', 'None']),
    wristRest: pick(['Detachable', 'Integrated', 'Sold separately', 'None']),
    batteryLife: pick(['Not applicable', '40 hours (RGB on)', '200 hours (RGB off)', '6 months', '1 year']),
    chargingPort: pick(['Not applicable', 'USB-C', 'Micro-USB', 'Replaceable batteries']),
    software: pick(['RGB customization', 'Macro programming', 'Profile switching', 'No software']),
    cableType: pick(['Detachable USB-C', 'Detachable USB-A', 'Braided cable', 'Coiled cable', 'Not applicable']),
    hotswap: pick(['Yes (hot-swappable)', 'No']),
    sound: pick(['Clicky', 'Tactile', 'Linear', 'Silent', 'Quiet']),
    weight: pick(['600g', '800g', '1 kg', '1.2 kg', '1.5 kg']),
    dimensions: pick(['440x130x35mm', '360x130x35mm', '320x110x30mm', 'Compact']),
    build: pick(['Aluminum frame', 'Plastic frame', 'ABS plastic', 'Full aluminum']),
    waterResistance: pick(['IPX4', 'Splash-resistant', 'None']),
    warranty: pick(['1 year', '2 years', '3 years', '5 years']),
    color: pick(['Black', 'White', 'Gray', 'RGB multicolor']),
    condition: pick(['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'])
  }),

  // ============ CLOTHING ============

  MENS_TSHIRTS: () => ({
    material: pick(['100% Cotton', '95% Cotton 5% Spandex', '60% Cotton 40% Polyester', '50% Cotton 50% Polyester', 'Tri-blend', '100% Organic Cotton']),
    fabricWeight: pick(['Lightweight (120-140 GSM)', 'Medium (150-180 GSM)', 'Heavyweight (200-240 GSM)']),
    fit: pick(['Regular', 'Slim', 'Relaxed', 'Athletic', 'Oversized', 'Tailored']),
    neckline: pick(['Crew neck', 'V-neck', 'Henley', 'Scoop neck']),
    sleeveLength: pick(['Short sleeve', 'Long sleeve', '3/4 sleeve', 'Sleeveless']),
    sleeveType: pick(['Set-in', 'Raglan', 'Cuffed']),
    hemType: pick(['Straight hem', 'Curved hem', 'Side slits']),
    necklineRib: pick(['Ribbed', 'Self-fabric', 'Binded']),
    stitching: pick(['Single-needle', 'Double-needle', 'Flatlock']),
    pocket: pick(['Chest pocket', 'No pocket', 'Hidden pocket']),
    pattern: pick(['Solid', 'Striped', 'Graphic print', 'All-over print', 'Tie-dye', 'Camo']),
    printType: pick(['Screen print', 'Direct-to-garment', 'Embroidered', 'Heat transfer', 'None']),
    breathability: pick(['High', 'Medium', 'Standard']),
    moistureWicking: pick(['Yes', 'No']),
    stretchable: pick(['Yes (4-way stretch)', 'Yes (2-way stretch)', 'No']),
    shrinkResistant: pick(['Pre-shrunk', 'May shrink', 'Shrink-resistant']),
    uvProtection: pick(['UPF 50+', 'UPF 30+', 'None']),
    careInstructions: pick(['Machine wash cold', 'Hand wash only', 'Dry clean', 'Machine wash warm']),
    season: pick(['All season', 'Summer', 'Winter', 'Spring/Fall']),
    sustainability: pick(['Organic', 'Recycled materials', 'Fair Trade', 'Eco-friendly dye', 'Standard']),
    countryOfOrigin: pick(['Made in USA', 'Made in China', 'Made in Bangladesh', 'Made in Vietnam', 'Made in India', 'Made in Mexico']),
    size: pick(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']),
    color: pick(['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Pink']),
    warranty: pick(['30-day return', '60-day return', '90-day return', 'No return']),
    condition: pick(['Brand New with tags', 'Brand New', 'Like New', 'Excellent', 'Good'])
  }),

  MENS_JEANS: () => ({
    material: pick(['100% Cotton Denim', '98% Cotton 2% Elastane', '90% Cotton 10% Polyester', '80% Cotton 18% Polyester 2% Spandex', 'Selvedge Denim']),
    fabricWeight: pick(['Lightweight (9-10 oz)', 'Medium (11-13 oz)', 'Heavyweight (14-16 oz)', 'Extra heavyweight (17+ oz)']),
    fit: pick(['Regular', 'Slim', 'Skinny', 'Straight', 'Bootcut', 'Relaxed', 'Athletic', 'Tapered']),
    rise: pick(['Low rise', 'Mid rise', 'High rise']),
    waist: pick(['28"', '30"', '32"', '34"', '36"', '38"', '40"', '42"']),
    inseam: pick(['28"', '30"', '32"', '34"', '36"']),
    legOpening: pick(['Narrow (12")', 'Regular (14")', 'Wide (16")', 'Boot cut (18")']),
    stretch: pick(['No stretch', 'Slight stretch', 'Moderate stretch', 'High stretch']),
    wash: pick(['Raw/Dry', 'Light wash', 'Medium wash', 'Dark wash', 'Black', 'Distressed', 'Acid wash']),
    distressing: pick(['None', 'Light distress', 'Heavy distress', 'Ripped knees', 'Whiskering']),
    closure: pick(['Button fly', 'Zipper fly']),
    pockets: pick(['5-pocket', '7-pocket', 'Cargo pockets', 'Zippered pockets']),
    belt: pick(['Belt loops', 'No belt loops', 'Hidden belt loops']),
    stitching: pick(['Single-stitch', 'Double-stitch', 'Triple-stitch', 'Contrast stitching']),
    hem: pick(['Raw hem', 'Finished hem', 'Cuffed', 'Frayed']),
    lining: pick(['Unlined', 'Lined', 'Fleece-lined']),
    fadeResistant: pick(['Yes', 'No', 'Colorfast']),
    shrinkage: pick(['Pre-shrunk', 'Sanforized', 'May shrink up to 3%', 'Raw (expect shrinkage)']),
    season: pick(['All season', 'Summer weight', 'Winter weight']),
    careInstructions: pick(['Machine wash cold', 'Hand wash', 'Dry clean recommended', 'Wash inside out']),
    sustainability: pick(['Organic cotton', 'Recycled denim', 'Water-saving process', 'Standard']),
    countryOfOrigin: pick(['Made in USA', 'Made in Japan', 'Made in Italy', 'Made in China', 'Made in Bangladesh', 'Made in Mexico']),
    size: pick(['28x30', '30x32', '32x32', '34x34', '36x32', '38x32']),
    color: pick(['Blue', 'Black', 'Gray', 'Indigo', 'White', 'Khaki']),
    warranty: pick(['30-day return', '60-day return', '90-day return', '1-year warranty']),
    condition: pick(['Brand New with tags', 'Brand New', 'Like New', 'Excellent', 'Good'])
  }),

  WOMENS_DRESSES: () => ({
    material: pick(['100% Polyester', '95% Polyester 5% Spandex', '100% Cotton', 'Silk', 'Chiffon', 'Velvet', 'Lace', 'Satin', 'Rayon blend']),
    fabricWeight: pick(['Lightweight', 'Medium weight', 'Heavyweight']),
    length: pick(['Mini (above knee)', 'Knee-length', 'Midi (below knee)', 'Maxi (ankle)', 'Floor-length']),
    style: pick(['A-line', 'Bodycon', 'Shift', 'Wrap', 'Fit-and-flare', 'Sheath', 'Empire waist', 'Ball gown']),
    neckline: pick(['V-neck', 'Scoop neck', 'High neck', 'Off-shoulder', 'Sweetheart', 'Halter', 'Square neck', 'Cowl neck']),
    sleeveLength: pick(['Sleeveless', 'Cap sleeve', 'Short sleeve', '3/4 sleeve', 'Long sleeve']),
    sleeveType: pick(['Regular', 'Puff sleeve', 'Bell sleeve', 'Bishop sleeve', 'Flutter sleeve']),
    waistline: pick(['Natural waist', 'Empire waist', 'Dropped waist', 'Belted', 'Elastic waist']),
    back: pick(['Zipper', 'Button-up', 'Open back', 'Lace-up', 'Keyhole', 'Hidden zipper']),
    lining: pick(['Fully lined', 'Partially lined', 'Unlined']),
    closure: pick(['Zipper', 'Buttons', 'Tie', 'Pull-on', 'Hook-and-eye']),
    pockets: pick(['Side pockets', 'Hidden pockets', 'No pockets']),
    embellishments: pick(['Plain', 'Embroidered', 'Sequined', 'Beaded', 'Ruffles', 'Lace details', 'Pleats']),
    pattern: pick(['Solid', 'Floral', 'Striped', 'Polka dot', 'Animal print', 'Geometric', 'Abstract']),
    transparency: pick(['Opaque', 'Semi-sheer', 'Sheer (requires slip)']),
    stretch: pick(['No stretch', 'Slight stretch', 'Moderate stretch', 'High stretch']),
    occasion: pick(['Casual', 'Work/Office', 'Cocktail', 'Formal/Evening', 'Wedding guest', 'Beach/Resort']),
    season: pick(['Spring', 'Summer', 'Fall', 'Winter', 'All season']),
    careInstructions: pick(['Machine wash cold', 'Hand wash only', 'Dry clean only', 'Hand wash cold']),
    sustainability: pick(['Organic', 'Recycled materials', 'Eco-friendly', 'Standard']),
    countryOfOrigin: pick(['Made in USA', 'Made in China', 'Made in India', 'Made in Vietnam', 'Made in Italy']),
    size: pick(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Plus size']),
    color: pick(['Black', 'White', 'Red', 'Blue', 'Green', 'Pink', 'Purple', 'Yellow', 'Floral print']),
    warranty: pick(['30-day return', '60-day return', '90-day return']),
    condition: pick(['Brand New with tags', 'Brand New', 'Like New', 'Excellent', 'Good'])
  }),

  WOMENS_TOPS: () => ({
    material: pick(['100% Cotton', '95% Cotton 5% Spandex', '100% Polyester', 'Silk', 'Rayon blend', 'Linen', 'Chiffon']),
    fabricWeight: pick(['Lightweight', 'Medium weight', 'Heavyweight']),
    fit: pick(['Regular', 'Slim', 'Loose', 'Oversized', 'Fitted', 'Relaxed']),
    style: pick(['Casual', 'Formal', 'Athletic', 'Bohemian', 'Preppy', 'Elegant']),
    neckline: pick(['Crew neck', 'V-neck', 'Scoop neck', 'High neck', 'Off-shoulder', 'Boat neck', 'Cowl neck']),
    sleeveLength: pick(['Sleeveless', 'Cap sleeve', 'Short sleeve', '3/4 sleeve', 'Long sleeve']),
    sleeveType: pick(['Regular', 'Puff sleeve', 'Bell sleeve', 'Flutter sleeve', 'Bishop sleeve', 'Dolman']),
    hemType: pick(['Straight hem', 'Curved hem', 'High-low hem', 'Asymmetric']),
    closure: pick(['Pull-over', 'Button-up', 'Zipper', 'Wrap', 'Tie-front']),
    collar: pick(['No collar', 'Pointed collar', 'Peter Pan collar', 'Mandarin collar', 'Ruffled collar']),
    pockets: pick(['Chest pocket', 'Side pockets', 'No pockets']),
    embellishments: pick(['Plain', 'Embroidered', 'Sequined', 'Ruffles', 'Lace trim', 'Buttons']),
    pattern: pick(['Solid', 'Striped', 'Floral', 'Polka dot', 'Animal print', 'Geometric', 'Abstract']),
    transparency: pick(['Opaque', 'Semi-sheer', 'Sheer']),
    stretch: pick(['No stretch', 'Slight stretch', 'Moderate stretch', 'High stretch']),
    length: pick(['Cropped', 'Hip-length', 'Tunic', 'Longline']),
    layering: pick(['Base layer', 'Mid layer', 'Outer layer', 'Standalone']),
    breathability: pick(['High', 'Medium', 'Standard']),
    season: pick(['Spring', 'Summer', 'Fall', 'Winter', 'All season']),
    careInstructions: pick(['Machine wash cold', 'Hand wash only', 'Dry clean', 'Machine wash warm']),
    sustainability: pick(['Organic', 'Recycled materials', 'Eco-friendly', 'Standard']),
    countryOfOrigin: pick(['Made in USA', 'Made in China', 'Made in India', 'Made in Bangladesh', 'Made in Vietnam']),
    size: pick(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    color: pick(['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Pink', 'Green']),
    warranty: pick(['30-day return', '60-day return', '90-day return']),
    condition: pick(['Brand New with tags', 'Brand New', 'Like New', 'Excellent', 'Good'])
  }),

  // ============ SHOES ============

  MENS_SNEAKERS: () => ({
    upperMaterial: pick(['Leather', 'Synthetic leather', 'Canvas', 'Mesh', 'Knit', 'Suede', 'Nubuck']),
    soleMaterial: pick(['Rubber', 'EVA foam', 'Phylon', 'Polyurethane', 'Gum rubber']),
    innerMaterial: pick(['Textile', 'Mesh', 'Leather', 'Synthetic']),
    closure: pick(['Lace-up', 'Slip-on', 'Velcro', 'Zipper', 'Elastic']),
    toeStyle: pick(['Round toe', 'Cap toe', 'Square toe', 'Reinforced toe']),
    heelType: pick(['Flat', 'Low (1")', 'Mid (1.5")', 'High (2")']),
    cushioning: pick(['Standard', 'Enhanced (Air)', 'Maximum (Boost)', 'Gel cushioning', 'Memory foam']),
    support: pick(['Neutral', 'Stability', 'Motion control', 'Minimalist']),
    archSupport: pick(['Low', 'Medium', 'High', 'Neutral']),
    insole: pick(['Removable', 'Fixed', 'Ortholite', 'Memory foam', 'EVA']),
    outsole: pick(['Non-marking', 'Grippy', 'Traction pattern', 'Herringbone', 'Waffle']),
    midsole: pick(['EVA', 'Phylon', 'Boost', 'React', 'Air cushioning']),
    ankle: pick(['Low-top', 'Mid-top', 'High-top']),
    breathability: pick(['Highly breathable', 'Moderately breathable', 'Standard', 'Insulated']),
    waterResistance: pick(['Waterproof', 'Water-resistant', 'None']),
    weight: pick(['Lightweight (< 250g)', 'Standard (250-350g)', 'Heavy (> 350g)']),
    flexibility: pick(['Very flexible', 'Moderately flexible', 'Stiff']),
    drop: pick(['0mm (minimalist)', '4mm', '8mm', '10mm', '12mm']),
    style: pick(['Casual', 'Athletic', 'Retro', 'Fashion', 'Performance', 'Skate']),
    purpose: pick(['Everyday wear', 'Running', 'Basketball', 'Training', 'Skateboarding', 'Lifestyle']),
    season: pick(['All season', 'Summer', 'Winter']),
    careInstructions: pick(['Wipe clean', 'Machine washable', 'Hand wash only', 'Spot clean']),
    size: pick(['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12', 'US 13']),
    color: pick(['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Multi-color']),
    warranty: pick(['30-day return', '60-day return', '90-day return', '6-month warranty']),
    condition: pick(['Brand New in box', 'Brand New', 'Like New', 'Excellent', 'Good'])
  }),

  RUNNING_SHOES: () => ({
    type: pick(['Road running', 'Trail running', 'Track', 'Racing flats', 'Marathon']),
    upperMaterial: pick(['Engineered mesh', 'Flyknit', 'Primeknit', 'Jacquard mesh', 'Synthetic']),
    soleMaterial: pick(['Carbon rubber', 'Blown rubber', 'Continental rubber', 'Vibram']),
    cushioning: pick(['Minimal', 'Moderate', 'Maximum (Plush)', 'Responsive']),
    cushioningTech: pick(['Air Zoom', 'Boost', 'React', 'Fresh Foam', 'HOVR', 'FlyteFoam', 'DNA Loft']),
    support: pick(['Neutral', 'Stability (Moderate pronation)', 'Motion control (Severe pronation)']),
    drop: pick(['0mm (zero drop)', '4mm', '6mm', '8mm', '10mm', '12mm']),
    weight: pick(['Ultra-light (< 200g)', 'Light (200-250g)', 'Standard (250-300g)', 'Heavy (> 300g)']),
    breathability: pick(['Highly breathable', 'Moderately breathable', 'Water-resistant']),
    upperConstruction: pick(['One-piece', 'Multi-layer', 'Seamless', 'Bootie']),
    tongueType: pick(['Gusseted', 'Traditional', 'Integrated']),
    heelCounter: pick(['Rigid', 'Semi-rigid', 'Flexible', 'External']),
    outsolePattern: pick(['Road traction', 'Trail lugs', 'Waffle', 'Hexagonal']),
    midsole: pick(['EVA', 'Dual-density EVA', 'TPU', 'Full-length foam']),
    plateIncluded: pick(['Carbon fiber plate', 'TPU plate', 'None']),
    rockPlate: pick(['Yes (for trail)', 'No']),
    reflectiveElements: pick(['Yes', 'Minimal', 'No']),
    archSupport: pick(['Low', 'Medium', 'High', 'Neutral']),
    flexibility: pick(['Very flexible', 'Moderately flexible', 'Stiff (racing)']),
    durability: pick(['300+ miles', '400+ miles', '500+ miles', '600+ miles']),
    terrain: pick(['Road', 'Trail', 'Mixed', 'Track']),
    distance: pick(['5K/10K', 'Half marathon', 'Marathon', 'Ultra-marathon', 'Daily trainer']),
    purpose: pick(['Training', 'Racing', 'Tempo runs', 'Long runs', 'Speed work']),
    size: pick(['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12', 'US 13']),
    color: pick(['Black', 'White', 'Blue', 'Red', 'Neon', 'Gray']),
    condition: pick(['Brand New in box', 'Brand New', 'Lightly used', 'Good', 'Fair'])
  }),

  // ============ HOME & KITCHEN ============

  KITCHEN_APPLIANCES: () => ({
    type: pick(['Blender', 'Food processor', 'Coffee maker', 'Toaster', 'Microwave', 'Air fryer', 'Slow cooker', 'Instant pot']),
    power: pick(['600W', '800W', '1000W', '1200W', '1500W', '1800W']),
    voltage: pick(['110V', '120V', '220V', '240V']),
    capacity: pick(['1L', '1.5L', '2L', '3L', '4L', '5L', '6L', '8L']),
    material: pick(['Stainless steel', 'Plastic (BPA-free)', 'Glass', 'Ceramic', 'Aluminum']),
    finish: pick(['Brushed stainless', 'Polished', 'Matte black', 'White', 'Chrome']),
    programs: pick(['3 preset programs', '5 preset programs', '8 preset programs', '12 preset programs', 'Manual only']),
    speedSettings: pick(['2 speeds', '3 speeds', '5 speeds', 'Variable speed', '10 speeds']),
    timer: pick(['Yes (digital)', 'Yes (manual)', 'No timer']),
    display: pick(['LED', 'LCD touchscreen', 'Digital', 'Analog', 'No display']),
    autoShutoff: pick(['Yes', 'No']),
    cordLength: pick(['2 feet', '3 feet', '4 feet', 'Cordless']),
    cordStorage: pick(['Built-in', 'Wrap-around', 'None']),
    dishwasherSafe: pick(['All parts', 'Removable parts only', 'Hand wash only']),
    cleaning: pick(['Self-cleaning', 'Easy-clean coating', 'Manual cleaning']),
    safety: pick(['Overheat protection', 'Auto shut-off', 'Cool-touch exterior', 'Locking lid']),
    noise: pick(['Quiet (< 60dB)', 'Moderate (60-75dB)', 'Loud (> 75dB)']),
    accessories: pick(['Multiple attachments', 'Recipe book included', 'Measuring cup', 'Cleaning brush', 'None']),
    warranty: pick(['1 year', '2 years', '3 years', '5 years', 'Lifetime on motor']),
    certification: pick(['ETL', 'UL', 'CE', 'FDA approved', 'Energy Star']),
    dimensions: pick(['Compact (< 12")', 'Medium (12-15")', 'Large (> 15")']),
    weight: pick(['2 kg', '3 kg', '4 kg', '5 kg', '6 kg', '8 kg']),
    countryOfOrigin: pick(['Made in USA', 'Made in China', 'Made in Germany', 'Made in Italy']),
    color: pick(['Black', 'White', 'Stainless steel', 'Red', 'Silver']),
    condition: pick(['Brand New in box', 'Brand New', 'Like New', 'Excellent', 'Good'])
  }),

  COOKWARE: () => ({
    type: pick(['Frying pan', 'Sauce pan', 'Stock pot', 'Dutch oven', 'Wok', 'Griddle', 'Roasting pan']),
    material: pick(['Stainless steel', 'Non-stick aluminum', 'Cast iron', 'Enameled cast iron', 'Copper', 'Hard-anodized aluminum', 'Carbon steel']),
    coating: pick(['PTFE non-stick', 'Ceramic non-stick', 'Enamel', 'None (uncoated)', 'Titanium-reinforced']),
    size: pick(['8 inches', '10 inches', '12 inches', '14 inches']),
    capacity: pick(['1 quart', '2 quarts', '3 quarts', '5 quarts', '8 quarts', '12 quarts']),
    handles: pick(['Riveted stainless steel', 'Silicone grip', 'Stay-cool', 'Helper handle', 'Removable']),
    lid: pick(['Tempered glass', 'Stainless steel', 'Self-basting', 'No lid', 'Vented']),
    base: pick(['Flat', 'Disc bottom', 'Encapsulated', 'Impact-bonded', 'Tri-ply']),
    layers: pick(['Single layer', '3-ply', '5-ply', '7-ply']),
    compatibility: pick(['Gas', 'Electric', 'Induction', 'All stovetops including induction', 'Oven-safe']),
    ovenSafe: pick(['Yes (up to 350°F)', 'Yes (up to 450°F)', 'Yes (up to 500°F)', 'No']),
    broilerSafe: pick(['Yes', 'No']),
    dishwasherSafe: pick(['Yes', 'Hand wash recommended', 'Hand wash only']),
    metalUtensilSafe: pick(['Yes', 'Silicone/wood only', 'Use with care']),
    heatDistribution: pick(['Excellent (even heating)', 'Good', 'Standard']),
    weight: pick(['Lightweight', 'Medium', 'Heavy-duty']),
    thickness: pick(['2mm', '3mm', '4mm', '5mm', '6mm']),
    interiorFinish: pick(['Polished', 'Brushed', 'Non-stick', 'Matte']),
    exteriorFinish: pick(['Polished stainless', 'Brushed', 'Enamel', 'Hammered']),
    maintenance: pick(['Low maintenance', 'Seasoning required', 'Hand wash only', 'Easy care']),
    warranty: pick(['Lifetime warranty', '10 years', '5 years', '2 years', '1 year']),
    set: pick(['Single piece', 'Part of set', '3-piece set', '10-piece set']),
    color: pick(['Stainless steel', 'Black', 'Red', 'Blue', 'Copper']),
    countryOfOrigin: pick(['Made in USA', 'Made in France', 'Made in China', 'Made in Germany']),
    condition: pick(['Brand New in box', 'Brand New', 'Like New', 'Excellent', 'Good'])
  }),

  FURNITURE: () => ({
    type: pick(['Chair', 'Table', 'Desk', 'Sofa', 'Bed frame', 'Bookshelf', 'Cabinet', 'Dresser', 'Nightstand', 'Coffee table']),
    material: pick(['Solid wood', 'Engineered wood', 'Metal', 'Plastic', 'Glass', 'Rattan', 'Bamboo', 'MDF']),
    woodType: pick(['Oak', 'Pine', 'Walnut', 'Mahogany', 'Teak', 'Birch', 'Cherry', 'Not applicable']),
    finish: pick(['Natural wood', 'Stained', 'Painted', 'Lacquered', 'Distressed', 'Matte', 'Glossy']),
    style: pick(['Modern', 'Contemporary', 'Traditional', 'Rustic', 'Industrial', 'Mid-century', 'Scandinavian', 'Farmhouse']),
    assembly: pick(['No assembly required', 'Minimal assembly', 'Moderate assembly', 'Full assembly required']),
    tools: pick(['Tools included', 'No tools needed', 'Basic tools required', 'Power tools recommended']),
    dimensions: pick(['Small', 'Medium', 'Large', 'Extra large']),
    height: pick(['18 inches', '24 inches', '30 inches', '36 inches', '48 inches', '60 inches']),
    width: pick(['24 inches', '36 inches', '48 inches', '60 inches', '72 inches']),
    depth: pick(['18 inches', '24 inches', '30 inches', '36 inches']),
    weight: pick(['10 lbs', '25 lbs', '50 lbs', '75 lbs', '100 lbs', '150 lbs']),
    weightCapacity: pick(['100 lbs', '200 lbs', '300 lbs', '500 lbs', '1000 lbs']),
    seating: pick(['1 person', '2 people', '3 people', '4+ people', 'Not applicable']),
    storage: pick(['No storage', 'Drawer storage', 'Shelf storage', 'Hidden storage', 'Multiple compartments']),
    adjustable: pick(['Height adjustable', 'Tilt adjustable', 'Fully adjustable', 'Not adjustable']),
    cushioning: pick(['Firm', 'Medium', 'Plush', 'Memory foam', 'No cushioning']),
    upholstery: pick(['Fabric', 'Leather', 'Faux leather', 'Velvet', 'Microfiber', 'Not upholstered']),
    frameConstruction: pick(['Solid wood frame', 'Metal frame', 'Composite frame', 'Reinforced']),
    careInstructions: pick(['Wipe clean', 'Vacuum regularly', 'Spot clean', 'Professional cleaning']),
    indoor: pick(['Indoor only', 'Indoor/Outdoor', 'Outdoor only']),
    warranty: pick(['1 year', '2 years', '5 years', '10 years', 'Lifetime']),
    color: pick(['Natural wood', 'Black', 'White', 'Brown', 'Gray', 'Espresso', 'Oak']),
    countryOfOrigin: pick(['Made in USA', 'Made in China', 'Made in Vietnam', 'Made in Italy', 'Made in Mexico']),
    condition: pick(['Brand New in box', 'Brand New', 'Like New', 'Excellent', 'Good'])
  }),

  // ============ TOYS ============

  LEGO_SETS: () => ({
    pieces: pick(['50 pieces', '100 pieces', '250 pieces', '500 pieces', '1000 pieces', '1500 pieces', '2000 pieces', '3000+ pieces']),
    ageRange: pick(['4-7 years', '6-12 years', '8-14 years', '10-16 years', '12+ years', '16+ years', '18+ years']),
    theme: pick(['City', 'Star Wars', 'Harry Potter', 'Marvel', 'DC Comics', 'Technic', 'Friends', 'Ninjago', 'Creator', 'Architecture']),
    difficulty: pick(['Easy', 'Intermediate', 'Advanced', 'Expert']),
    buildingTime: pick(['< 1 hour', '1-2 hours', '2-4 hours', '4-6 hours', '6-10 hours', '10+ hours']),
    setType: pick(['Vehicle', 'Building', 'Character', 'Scene', 'Mixed']),
    minifigures: pick(['0 minifigures', '1 minifigure', '2-3 minifigures', '4-6 minifigures', '7+ minifigures']),
    licensed: pick(['Yes (Licensed property)', 'No (Original LEGO)']),
    series: pick(['Standalone', 'Part of series', 'Limited edition', 'Exclusive']),
    motorized: pick(['Yes (motorized)', 'Power Functions compatible', 'No']),
    lights: pick(['Yes (includes lights)', 'Light kit compatible', 'No']),
    stickers: pick(['Yes (sticker sheet included)', 'No stickers (printed bricks)', 'Some printed, some stickers']),
    baseplate: pick(['Included', 'Not included', 'Built-in']),
    instructionBooklet: pick(['Yes (printed)', 'Yes (multiple booklets)', 'Digital instructions only']),
    box: pick(['Original sealed box', 'Opened box', 'No box (bagged)']),
    retired: pick(['Yes (retired set)', 'No (current production)']),
    educational: pick(['STEM learning', 'Creative building', 'Role play', 'Not specifically educational']),
    storage: pick(['Storage box included', 'No storage', 'Buildable storage']),
    displayStand: pick(['Yes', 'No', 'Buildable stand']),
    dimensions: pick(['Small (< 6")', 'Medium (6-12")', 'Large (12-18")', 'Extra large (> 18")']),
    weight: pick(['< 1 lb', '1-2 lbs', '2-5 lbs', '5-10 lbs', '> 10 lbs']),
    safety: pick(['ASTM certified', 'CE certified', 'Choking hazard warning', 'Safe for all ages']),
    warranty: pick(['LEGO replacement guarantee', 'Standard return policy', 'No warranty']),
    releaseYear: pick(['2020', '2021', '2022', '2023', '2024', '2025']),
    color: pick(['Multi-color', 'Predominantly red', 'Predominantly blue', 'Predominantly black', 'Mixed']),
    condition: pick(['Brand New Sealed', 'Brand New Open Box', 'Like New', 'Excellent', 'Good'])
  }),

  // ============ BOOKS ============

  TEXTBOOKS: () => ({
    subject: pick(['Mathematics', 'Science', 'History', 'English', 'Computer Science', 'Engineering', 'Medicine', 'Business', 'Psychology', 'Chemistry', 'Physics', 'Biology']),
    level: pick(['High School', 'Undergraduate', 'Graduate', 'Professional', 'Reference']),
    edition: pick(['1st Edition', '2nd Edition', '3rd Edition', '4th Edition', '5th Edition', '6th Edition', '10th Edition', '15th Edition']),
    publishYear: pick(['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']),
    publisher: pick(['Pearson', 'McGraw-Hill', 'Wiley', 'Cengage', 'Oxford University Press', 'Cambridge University Press', 'Springer']),
    pages: pick(['200 pages', '300 pages', '400 pages', '500 pages', '600 pages', '800 pages', '1000+ pages']),
    binding: pick(['Hardcover', 'Paperback', 'Loose-leaf', 'Spiral-bound']),
    format: pick(['Print only', 'Print + Digital access', 'Digital only', 'Looseleaf + Digital']),
    isbn13: `978-${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10)}`,
    isbn10: `${Math.floor(Math.random() * 10000000000)}`,
    language: pick(['English', 'Spanish', 'French', 'German', 'Multilingual']),
    color: pick(['Full color', 'Black & white', 'Some color illustrations']),
    illustrations: pick(['Heavily illustrated', 'Moderately illustrated', 'Few illustrations', 'Text only']),
    supplements: pick(['Online resources', 'Student workbook', 'Solutions manual', 'Test bank', 'None']),
    access: pick(['Includes access code', 'No access code', 'Digital access expired', 'New access code']),
    codeUsed: pick(['Yes', 'No', 'Not applicable']),
    rental: pick(['Purchase', 'Rental (120 days)', 'Rental (180 days)', 'Not available for rent']),
    weight: pick(['1 lb', '2 lbs', '3 lbs', '4 lbs', '5 lbs', '6+ lbs']),
    dimensions: pick(['8.5 x 11 inches', '7 x 10 inches', '6 x 9 inches']),
    courseCode: pick(['MATH 101', 'CHEM 201', 'PHYS 102', 'ENG 301', 'BIO 110', 'CS 150', 'Not specified']),
    markings: pick(['No markings', 'Light highlighting', 'Moderate highlighting', 'Heavy highlighting/notes']),
    coverCondition: pick(['Like new', 'Very good', 'Good', 'Acceptable', 'Wear and tear']),
    pageCondition: pick(['Crisp clean pages', 'Minor wear', 'Some wear', 'Moderate wear']),
    warranty: pick(['30-day return', '60-day return', '14-day return', 'No returns']),
    condition: pick(['Brand New', 'Like New', 'Very Good', 'Good', 'Acceptable'])
  }),

  FICTION_BOOKS: () => ({
    genre: pick(['Mystery', 'Romance', 'Thriller', 'Fantasy', 'Science Fiction', 'Horror', 'Historical Fiction', 'Literary Fiction', 'Young Adult', 'Adventure']),
    subGenre: pick(['Contemporary', 'Dystopian', 'Urban Fantasy', 'Paranormal', 'Crime', 'Cozy Mystery', 'Epic Fantasy', 'Space Opera']),
    pages: pick(['150 pages', '200 pages', '300 pages', '400 pages', '500 pages', '600+ pages']),
    publishYear: pick(['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']),
    publisher: pick(['Penguin Random House', 'HarperCollins', 'Simon & Schuster', 'Hachette', 'Macmillan', 'Scholastic', 'Tor Books']),
    binding: pick(['Hardcover', 'Paperback', 'Mass Market Paperback', 'Library binding']),
    format: pick(['Print', 'Large Print', 'Illustrated Edition', 'Special Edition']),
    coverType: pick(['Dust jacket', 'No dust jacket', 'Paperback cover', 'Embossed cover']),
    series: pick(['Standalone', 'Book 1 of series', 'Book 2 of series', 'Book 3 of series', 'Part of trilogy', 'Part of series']),
    seriesComplete: pick(['Yes', 'No (ongoing)', 'Not applicable']),
    awards: pick(['Bestseller', 'Award winner', 'Award nominated', 'No awards', 'Pulitzer Prize', 'National Book Award']),
    rating: pick(['4.5+ stars', '4.0-4.5 stars', '3.5-4.0 stars', '3.0-3.5 stars']),
    targetAudience: pick(['Adult', 'Young Adult (14+)', 'Teen (13+)', 'New Adult (18-30)', 'General audience']),
    isbn13: `978-${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10)}`,
    isbn10: `${Math.floor(Math.random() * 10000000000)}`,
    language: pick(['English', 'Spanish', 'French', 'Translated from original']),
    illustrations: pick(['No illustrations', 'Some illustrations', 'Fully illustrated', 'Map included']),
    signed: pick(['Signed by author', 'Not signed', 'Signed bookplate']),
    firstEdition: pick(['Yes', 'No', 'First paperback edition']),
    bookClub: pick(['Book club edition', 'Trade edition', 'Mass market']),
    weight: pick(['8 oz', '12 oz', '1 lb', '1.5 lbs', '2 lbs']),
    dimensions: pick(['5 x 8 inches', '6 x 9 inches', '5.5 x 8.5 inches', '4 x 7 inches']),
    coverCondition: pick(['Like new', 'Very good', 'Good', 'Acceptable', 'Wear and tear']),
    pageCondition: pick(['Crisp clean', 'Minor wear', 'Some yellowing', 'Moderate wear']),
    spine: pick(['Uncracked', 'Slight crease', 'Creased', 'Worn']),
    warranty: pick(['30-day return', '14-day return', 'No returns on used']),
    condition: pick(['Brand New', 'Like New', 'Very Good', 'Good', 'Acceptable'])
  })
}

// Apply templates to similar categories
const similarCategories: Record<string, string[]> = {
  MENS_TSHIRTS: ['MENS_SWEATERS', 'MENS_HOODIES', 'MENS_TOPS'],
  MENS_JEANS: ['MENS_PANTS', 'MENS_SHORTS'],
  WOMENS_DRESSES: ['WOMENS_SKIRTS'],
  WOMENS_TOPS: ['WOMENS_SWEATERS', 'WOMENS_BLOUSES'],
  MENS_SNEAKERS: ['WOMENS_SNEAKERS', 'BASKETBALL_SHOES', 'SOCCER_CLEATS'],
  RUNNING_SHOES: ['TRAINING_SHOES', 'CROSS_TRAINING_SHOES'],
  TEXTBOOKS: ['NONFICTION_BOOKS', 'CHILDRENS_BOOKS'],
  FURNITURE: ['DESKS', 'CHAIRS', 'TABLES', 'STORAGE'],
  KITCHEN_APPLIANCES: ['COFFEE_MAKERS', 'BLENDERS', 'FOOD_PROCESSORS'],
  COOKWARE: ['BAKEWARE', 'DINNERWARE'],
  LEGO_SETS: ['ACTION_FIGURES', 'DOLLS', 'OUTDOOR_TOYS', 'EDUCATIONAL_TOYS', 'BABY_TOYS', 'BOARD_GAMES', 'VIDEO_GAMES']
}

// Expand category specs
Object.entries(similarCategories).forEach(([template, categories]) => {
  categories.forEach(cat => {
    if (!categorySpecs[cat]) {
      categorySpecs[cat] = categorySpecs[template]
    }
  })
})

async function add25SpecsToAllProducts() {
  console.log('🚀 Adding 25 comprehensive specifications to ALL products...\n')
  console.log('⚠️  This will update ALL products with detailed 25-parameter specs.\n')

  // Get all unique categories
  const categories = await prisma.product.findMany({
    where: { isAvailable: true },
    select: { category: true },
    distinct: ['category']
  })

  console.log(`Found ${categories.length} unique categories\n`)

  let totalUpdated = 0
  let totalSkipped = 0
  const batchSize = 50 // Reduced batch size for larger payload

  for (const { category } of categories) {
    const specsGenerator = categorySpecs[category]

    if (!specsGenerator) {
      console.log(`⏭️  Skipping ${category} (no 25-spec template)`)
      continue
    }

    // Get ALL products in this category (not just those without specs)
    const products = await prisma.product.findMany({
      where: {
        isAvailable: true,
        category: category
      },
      select: {
        id: true
      }
    })

    if (products.length === 0) {
      console.log(`⏭️  ${category}: No products found`)
      continue
    }

    console.log(`🔄 ${category}: Updating ALL ${products.length} products with 25 specs...`)

    // Update in batches
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)

      await Promise.all(
        batch.map(product =>
          prisma.product.update({
            where: { id: product.id },
            data: { dynamicSpecs: specsGenerator() }
          })
        )
      )

      totalUpdated += batch.length
      process.stdout.write(`\r   Progress: ${totalUpdated} products updated...`)
    }

    console.log(`\n   ✅ Updated ${products.length} products with 25 specs each`)
  }

  console.log(`\n\n🎉 Done!`)
  console.log(`   ✅ Updated: ${totalUpdated} products`)
  console.log(`   📊 Each product now has 25 comprehensive specifications`)
  console.log(`\n💡 Refresh the leaderboard to see 25 detailed specs for all products!`)

  await prisma.$disconnect()
}

add25SpecsToAllProducts().catch(console.error)
