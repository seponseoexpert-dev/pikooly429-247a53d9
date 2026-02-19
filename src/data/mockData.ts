import { Product, Category, BlogPost, FAQItem } from "@/types";

export const categories: Category[] = [
  { id: "1", name: "10% Off\nFlowers", slug: "flowers", icon: "🌸", image: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=300", badge: "10% OFF" },
  { id: "2", name: "Same Day", slug: "same-day", icon: "🚚", image: "https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=300", badge: "FAST" },
  { id: "3", name: "Flowers", slug: "flowers", icon: "💐", image: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=300" },
  { id: "4", name: "Cakes", slug: "cake", icon: "🎂", image: "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=300" },
  { id: "5", name: "Combos", slug: "combos", icon: "🎁", image: "https://images.pexels.com/photos/1666065/pexels-photo-1666065.jpeg?auto=compress&cs=tinysrgb&w=300" },
  { id: "6", name: "Birthday", slug: "birthday", icon: "🎈", image: "https://images.pexels.com/photos/1857785/pexels-photo-1857785.jpeg?auto=compress&cs=tinysrgb&w=300" },
  { id: "7", name: "Premium", slug: "premium", icon: "👑", image: "https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=300" },
  { id: "8", name: "Plants", slug: "plants", icon: "🪴", image: "https://images.pexels.com/photos/4046718/pexels-photo-4046718.jpeg?auto=compress&cs=tinysrgb&w=300" },
];

export const products: Product[] = [
  { id: "1", name: "Five Star Bouquet", price: 699, originalPrice: 849, image: "https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=400", category: "flowers", badge: "Best Seller", rating: 4.3, inStock: true },
  { id: "2", name: "8 Mixed Roses Arrangement", price: 649, originalPrice: 849, image: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=400", category: "flowers", rating: 4.5, inStock: true },
  { id: "3", name: "Chocolate Truffle Cake", price: 799, originalPrice: 999, image: "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400", category: "cake", badge: "New", rating: 4.6, inStock: true },
  { id: "4", name: "Rose Elegance Premium", price: 1299, originalPrice: 1599, image: "https://images.pexels.com/photos/1666065/pexels-photo-1666065.jpeg?auto=compress&cs=tinysrgb&w=400", category: "combos", rating: 4.5, inStock: true },
  { id: "5", name: "Pink Lily Arrangement", price: 1200, image: "https://images.pexels.com/photos/736230/pexels-photo-736230.jpeg?auto=compress&cs=tinysrgb&w=400", category: "flowers", rating: 4.5, inStock: true },
  { id: "6", name: "Luxury Gift Hamper", price: 4500, originalPrice: 5500, image: "https://images.pexels.com/photos/264985/pexels-photo-264985.jpeg?auto=compress&cs=tinysrgb&w=400", category: "combos", badge: "Premium", rating: 4.9, inStock: true },
  { id: "7", name: "Strawberry Bliss Cake", price: 1800, image: "https://images.pexels.com/photos/1414234/pexels-photo-1414234.jpeg?auto=compress&cs=tinysrgb&w=400", category: "cake", rating: 4.4, inStock: true },
  { id: "8", name: "White Orchid Serenity", price: 3200, image: "https://images.pexels.com/photos/4046718/pexels-photo-4046718.jpeg?auto=compress&cs=tinysrgb&w=400", category: "flowers", badge: "Premium", rating: 4.8, inStock: true },
  { id: "9", name: "Birthday Surprise Bundle", price: 3500, originalPrice: 4000, image: "https://images.pexels.com/photos/1857785/pexels-photo-1857785.jpeg?auto=compress&cs=tinysrgb&w=400", category: "birthday", badge: "Popular", rating: 4.7, inStock: true },
  { id: "10", name: "Lavender Dream Bouquet", price: 1600, image: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=400", category: "flowers", rating: 4.6, inStock: true },
  { id: "11", name: "Classic Perfume Set", price: 5500, image: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=400", category: "perfumes", rating: 4.8, inStock: true },
  { id: "12", name: "Red Velvet Cake", price: 2800, originalPrice: 3200, image: "https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400", category: "cake", badge: "Hot", rating: 4.9, inStock: true },
  { id: "13", name: "Sunflower Delight", price: 950, originalPrice: 1200, image: "https://images.pexels.com/photos/1624076/pexels-photo-1624076.jpeg?auto=compress&cs=tinysrgb&w=400", category: "flowers", badge: "New", rating: 4.5, inStock: true },
  { id: "14", name: "Mixed Fruit Cake", price: 2200, image: "https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg?auto=compress&cs=tinysrgb&w=400", category: "cake", rating: 4.6, inStock: true },
  { id: "15", name: "Royal Orchid Basket", price: 3800, originalPrice: 4500, image: "https://images.pexels.com/photos/1005715/pexels-photo-1005715.jpeg?auto=compress&cs=tinysrgb&w=400", category: "premium", badge: "Premium", rating: 4.8, inStock: true },
  { id: "16", name: "Anniversary Combo Box", price: 4200, originalPrice: 5000, image: "https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?auto=compress&cs=tinysrgb&w=400", category: "combos", badge: "Popular", rating: 4.7, inStock: true },
  { id: "17", name: "Indoor Money Plant", price: 750, image: "https://images.pexels.com/photos/3076899/pexels-photo-3076899.jpeg?auto=compress&cs=tinysrgb&w=400", category: "plants", rating: 4.4, inStock: true },
];

export const blogPosts: BlogPost[] = [
  { id: "1", title: "10 Best Flowers for Anniversary Gifts", excerpt: "Discover the most romantic flower choices that will make your anniversary unforgettable...", image: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=600", date: "2026-02-15", category: "Flower Tips", author: "Pikooly Team" },
  { id: "2", title: "How to Keep Your Bouquet Fresh for Longer", excerpt: "Expert tips to extend the life of your beautiful flower arrangements by up to 2 weeks...", image: "https://images.pexels.com/photos/736230/pexels-photo-736230.jpeg?auto=compress&cs=tinysrgb&w=600", date: "2026-02-10", category: "Care Guide", author: "Pikooly Team" },
  { id: "3", title: "Top Cake Trends in Bangladesh 2026", excerpt: "From minimalist designs to extravagant creations, explore what's trending in the cake world...", image: "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600", date: "2026-02-05", category: "Trends", author: "Pikooly Team" },
];

export const faqItems: FAQItem[] = [
  { question: "What is PikoolyFlora?", answer: "PikoolyFlora is your trusted online destination for fresh flowers, delicious cakes, and thoughtful gifts in Bangladesh. We deliver joy to your doorstep." },
  { question: "Can I order flowers online?", answer: "Yes! Simply browse our products, add items to your cart, and proceed to checkout. You can pay using bKash, Nagad, or cash on delivery." },
  { question: "Do you offer same-day delivery?", answer: "Yes! We offer same-day delivery in Dhaka for orders placed before 3 PM. Select 'Same Day Delivery' at checkout." },
  { question: "Are the flowers fresh?", answer: "Absolutely! We source our flowers from the finest local and imported suppliers. Every bouquet is handcrafted fresh on the day of delivery." },
  { question: "What occasions can I buy flowers for?", answer: "We have flowers for every occasion — birthdays, anniversaries, weddings, Valentine's Day, Mother's Day, Eid, and more. You can also send 'just because' flowers!" },
];

export const heroSlides = [
  {
    title: "Same Day\nDelivery",
    subtitle: "Order before 3 PM for same-day delivery",
    cta: "ORDER NOW",
    image: "https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=1200",
    bgColor: "hsl(145, 30%, 90%)",
  },
  {
    title: "Premium\nFlower Bouquets",
    subtitle: "Handcrafted with love for every occasion",
    cta: "SHOP NOW",
    image: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=1200",
    bgColor: "hsl(340, 30%, 92%)",
  },
  {
    title: "Delicious\nCakes & Treats",
    subtitle: "Custom cakes for every celebration",
    cta: "VIEW CAKES",
    image: "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=1200",
    bgColor: "hsl(38, 40%, 92%)",
  },
  {
    title: "Gift Combos\n& Hampers",
    subtitle: "Curated combos for special moments",
    cta: "EXPLORE",
    image: "https://images.pexels.com/photos/1666065/pexels-photo-1666065.jpeg?auto=compress&cs=tinysrgb&w=1200",
    bgColor: "hsl(200, 25%, 90%)",
  },
];
