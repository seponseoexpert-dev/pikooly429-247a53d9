import { Product, Category, BlogPost, FAQItem } from "@/types";

export const categories: Category[] = [
  { id: "1", name: "Same Day", slug: "same-day", icon: "⚡", image: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=200&h=200&fit=crop" },
  { id: "2", name: "Premium", slug: "premium", icon: "👑", image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=200&h=200&fit=crop" },
  { id: "3", name: "Flowers", slug: "flowers", icon: "🌸", image: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=200&h=200&fit=crop" },
  { id: "4", name: "Combos", slug: "combos", icon: "🎁", image: "https://images.unsplash.com/photo-1549488344-cbb6c34cf1ac?w=200&h=200&fit=crop" },
  { id: "5", name: "Cake", slug: "cake", icon: "🎂", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop" },
  { id: "6", name: "Birthday", slug: "birthday", icon: "🎈", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=200&h=200&fit=crop" },
  { id: "7", name: "Perfumes", slug: "perfumes", icon: "🧴", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&h=200&fit=crop" },
  { id: "8", name: "Makeup", slug: "makeup", icon: "💄", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop" },
];

export const products: Product[] = [
  { id: "1", name: "Red Rose Elegance Bouquet", price: 1500, originalPrice: 2000, image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop", category: "flowers", badge: "Best Seller", rating: 4.8, inStock: true },
  { id: "2", name: "Mixed Tulip Delight", price: 1800, image: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=400&fit=crop", category: "flowers", rating: 4.6, inStock: true },
  { id: "3", name: "Chocolate Dream Cake", price: 2200, originalPrice: 2500, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop", category: "cake", badge: "New", rating: 4.9, inStock: true },
  { id: "4", name: "Sunflower Surprise Box", price: 2500, image: "https://images.unsplash.com/photo-1551945326-df678cdd1c26?w=400&h=400&fit=crop", category: "combos", rating: 4.7, inStock: true },
  { id: "5", name: "Pink Lily Arrangement", price: 1200, image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=400&fit=crop", category: "flowers", rating: 4.5, inStock: true },
  { id: "6", name: "Luxury Gift Hamper", price: 4500, originalPrice: 5500, image: "https://images.unsplash.com/photo-1549488344-cbb6c34cf1ac?w=400&h=400&fit=crop", category: "combos", badge: "Premium", rating: 4.9, inStock: true },
  { id: "7", name: "Strawberry Bliss Cake", price: 1800, image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop", category: "cake", rating: 4.4, inStock: true },
  { id: "8", name: "White Orchid Serenity", price: 3200, image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop", category: "flowers", badge: "Premium", rating: 4.8, inStock: true },
  { id: "9", name: "Birthday Surprise Bundle", price: 3500, originalPrice: 4000, image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=400&fit=crop", category: "birthday", badge: "Popular", rating: 4.7, inStock: true },
  { id: "10", name: "Lavender Dream Bouquet", price: 1600, image: "https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=400&h=400&fit=crop", category: "flowers", rating: 4.6, inStock: true },
  { id: "11", name: "Classic Perfume Set", price: 5500, image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop", category: "perfumes", rating: 4.8, inStock: true },
  { id: "12", name: "Red Velvet Cake", price: 2800, originalPrice: 3200, image: "https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=400&h=400&fit=crop", category: "cake", badge: "Hot", rating: 4.9, inStock: true },
];

export const blogPosts: BlogPost[] = [
  { id: "1", title: "10 Best Flowers for Anniversary Gifts", excerpt: "Discover the most romantic flower choices that will make your anniversary unforgettable...", image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=400&fit=crop", date: "2026-02-15", category: "Flower Tips", author: "Pikooly Team" },
  { id: "2", title: "How to Keep Your Bouquet Fresh for Longer", excerpt: "Expert tips to extend the life of your beautiful flower arrangements by up to 2 weeks...", image: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600&h=400&fit=crop", date: "2026-02-10", category: "Care Guide", author: "Pikooly Team" },
  { id: "3", title: "Top Cake Trends in Bangladesh 2026", excerpt: "From minimalist designs to extravagant creations, explore what's trending in the cake world...", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop", date: "2026-02-05", category: "Trends", author: "Pikooly Team" },
];

export const faqItems: FAQItem[] = [
  { question: "How do I place an order on Pikooly?", answer: "Simply browse our products, add items to your cart, and proceed to checkout. You can pay using bKash, Nagad, or cash on delivery." },
  { question: "Do you offer same-day delivery?", answer: "Yes! We offer same-day delivery in Dhaka for orders placed before 3 PM. Select 'Same Day Delivery' at checkout." },
  { question: "What areas do you deliver to?", answer: "We currently deliver across Dhaka city and surrounding areas. We're expanding to Chittagong, Sylhet, and other major cities soon." },
  { question: "Are your flowers fresh?", answer: "Absolutely! We source our flowers from the finest local and imported suppliers. Every bouquet is handcrafted fresh on the day of delivery." },
  { question: "Can I customize my bouquet or cake?", answer: "Yes! You can add a personalized message, choose specific flowers, or request custom cake designs. Contact us via WhatsApp for special requests." },
  { question: "What is your return/refund policy?", answer: "If you're not satisfied with your order, please contact us within 2 hours of delivery. We'll arrange a replacement or full refund." },
  { question: "Do you offer gift wrapping?", answer: "All our products come beautifully packaged. Premium gift wrapping is available at an additional ৳150." },
  { question: "How can I track my order?", answer: "Once your order is dispatched, you'll receive a tracking link via SMS and email. You can also check status in your account." },
  { question: "What payment methods do you accept?", answer: "We accept bKash, Nagad, Rocket, credit/debit cards, and cash on delivery (COD) within Dhaka." },
  { question: "Can I schedule a delivery for a specific time?", answer: "Yes, you can choose a preferred delivery time slot during checkout. We offer morning (9AM-12PM), afternoon (12PM-4PM), and evening (4PM-8PM) slots." },
  { question: "Do you deliver on holidays?", answer: "Yes, we deliver on all holidays including Eid, Valentine's Day, and other special occasions. Extra charges may apply on peak days." },
  { question: "How fresh are your cakes?", answer: "All cakes are baked fresh on the day of delivery. We use premium ingredients and never sell day-old cakes." },
];

export const heroSlides = [
  {
    title: "Anniversary Surprises",
    subtitle: "Make every moment unforgettable with our curated collections",
    cta: "Order Now",
    image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&h=600&fit=crop",
    gradient: "from-rose/80 to-primary/60",
  },
  {
    title: "Fresh Flowers Daily",
    subtitle: "Handcrafted bouquets delivered to your doorstep in Dhaka",
    cta: "Shop Flowers",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=1200&h=600&fit=crop",
    gradient: "from-sage/70 to-gold/50",
  },
  {
    title: "Delicious Cakes",
    subtitle: "Custom cakes for every celebration — Birthdays, Weddings & More",
    cta: "View Cakes",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&h=600&fit=crop",
    gradient: "from-gold/70 to-accent/50",
  },
];