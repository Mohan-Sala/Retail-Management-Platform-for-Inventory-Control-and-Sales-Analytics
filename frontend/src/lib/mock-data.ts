// Mock marketplace data for ShopSense

export type Vendor = {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  gst: string;
  address: string;
  city: string;
  status: "active" | "pending" | "suspended";
  commission: number;
  revenue: number;
  productCount: number;
  joinedAt: string;
  avatar: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  reorderLevel: number;
  vendorId: string;
  vendorName: string;
  status: "active" | "draft" | "out_of_stock";
  image: string;
  description: string;
  createdAt: string;
  sales: number;
};

export type Transaction = {
  id: string;
  orderNo: string;
  customer: string;
  vendorId: string;
  vendorName: string;
  productId: string;
  productName: string;
  qty: number;
  amount: number;
  status: "paid" | "pending" | "refunded" | "failed";
  paymentMethod: "card" | "upi" | "wallet" | "bank";
  date: string;
};

export type InventoryItem = {
  id: string;
  productId: string;
  productName: string;
  vendorName: string;
  warehouse: string;
  stock: number;
  reorderLevel: number;
  lastUpdated: string;
};

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books", "Toys", "Grocery"];
const CITIES = ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];
const WAREHOUSES = ["WH-Mumbai-01", "WH-Bengaluru-02", "WH-Delhi-03", "WH-Chennai-04"];
const FIRST = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Diya", "Aanya", "Anika", "Priya", "Riya"];
const LAST = ["Sharma", "Verma", "Patel", "Reddy", "Iyer", "Nair", "Menon", "Gupta", "Singh", "Khan"];
const BRANDS = ["Nova", "Pixel", "Terra", "Lumen", "Ember", "Vertex", "Kairo", "Halo", "Orbit", "Zenith", "Meridian", "Cobalt", "Prism", "Atlas", "Fable", "Solstice", "Rune", "Cascade", "Aster", "Boreal"];
const PRODUCTS = ["Wireless Earbuds", "Smart Watch", "Yoga Mat", "Coffee Grinder", "Desk Lamp", "Running Shoes", "Backpack", "Bluetooth Speaker", "Sunglasses", "Water Bottle", "Notebook Set", "Kitchen Knife", "Face Serum", "Hair Dryer", "Gaming Mouse", "Mechanical Keyboard", "Ceramic Mug", "Cotton T-Shirt", "Denim Jeans", "Leather Wallet"];

// Deterministic PRNG so mock data is stable across renders
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const rng = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const VENDORS: Vendor[] = Array.from({ length: 25 }, (_, i) => {
  const owner = `${pick(FIRST)} ${pick(LAST)}`;
  const brand = pick(BRANDS);
  const city = pick(CITIES);
  return {
    id: `vnd_${String(i + 1).padStart(3, "0")}`,
    businessName: `${brand} ${pick(["Traders", "Retail", "Commerce", "& Co.", "Mart", "Enterprises"])}`,
    ownerName: owner,
    email: `${brand.toLowerCase()}${i + 1}@shopsense.io`,
    phone: `+91 9${rng(100000000, 999999999)}`,
    gst: `27${String.fromCharCode(65 + rng(0, 25))}${String.fromCharCode(65 + rng(0, 25))}${String.fromCharCode(65 + rng(0, 25))}${String.fromCharCode(65 + rng(0, 25))}${rng(1000, 9999)}${String.fromCharCode(65 + rng(0, 25))}1Z${rng(1, 9)}`,
    address: `${rng(1, 200)}, ${pick(["MG Road", "Ring Road", "Park Street", "Linking Road"])}`,
    city,
    status: (["active", "active", "active", "pending", "suspended"] as const)[rng(0, 4)],
    commission: rng(5, 25),
    revenue: rng(50000, 2500000),
    productCount: rng(3, 40),
    joinedAt: daysAgo(rng(30, 720)),
    avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${brand}`,
  };
});

export const PRODUCTS_DATA: Product[] = Array.from({ length: 100 }, (_, i) => {
  const vendor = VENDORS[rng(0, VENDORS.length - 1)];
  const name = `${pick(BRANDS)} ${pick(PRODUCTS)}`;
  const stock = rng(0, 250);
  return {
    id: `prd_${String(i + 1).padStart(4, "0")}`,
    name,
    sku: `SKU-${rng(10000, 99999)}`,
    category: pick(CATEGORIES),
    price: rng(299, 24999),
    stock,
    reorderLevel: rng(10, 30),
    vendorId: vendor.id,
    vendorName: vendor.businessName,
    status: stock === 0 ? "out_of_stock" : (["active", "active", "active", "draft"] as const)[rng(0, 3)],
    image: `https://picsum.photos/seed/${i}/400/400`,
    description: "Premium quality product crafted with attention to detail. Backed by vendor warranty and hassle-free returns.",
    createdAt: daysAgo(rng(1, 365)),
    sales: rng(0, 800),
  };
});

export const TRANSACTIONS: Transaction[] = Array.from({ length: 150 }, (_, i) => {
  const p = PRODUCTS_DATA[rng(0, PRODUCTS_DATA.length - 1)];
  const qty = rng(1, 5);
  return {
    id: `txn_${String(i + 1).padStart(5, "0")}`,
    orderNo: `ORD-${rng(100000, 999999)}`,
    customer: `${pick(FIRST)} ${pick(LAST)}`,
    vendorId: p.vendorId,
    vendorName: p.vendorName,
    productId: p.id,
    productName: p.name,
    qty,
    amount: p.price * qty,
    status: (["paid", "paid", "paid", "pending", "refunded", "failed"] as const)[rng(0, 5)],
    paymentMethod: (["card", "upi", "wallet", "bank"] as const)[rng(0, 3)],
    date: daysAgo(rng(0, 120)),
  };
});

export const INVENTORY: InventoryItem[] = PRODUCTS_DATA.map((p, i) => ({
  id: `inv_${String(i + 1).padStart(4, "0")}`,
  productId: p.id,
  productName: p.name,
  vendorName: p.vendorName,
  warehouse: WAREHOUSES[i % WAREHOUSES.length],
  stock: p.stock,
  reorderLevel: p.reorderLevel,
  lastUpdated: daysAgo(rng(0, 30)),
}));

// Aggregations
export const revenueByMonth = (() => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      month: months[d.getMonth()],
      revenue: rng(120000, 950000),
      orders: rng(200, 900),
    };
  });
})();

export const categoryDistribution = CATEGORIES.map((c) => ({
  name: c,
  value: PRODUCTS_DATA.filter((p) => p.category === c).length,
}));

export const topVendorsBySales = [...VENDORS]
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 6)
  .map((v) => ({ name: v.businessName.split(" ")[0], revenue: v.revenue }));

export const activityFeed = Array.from({ length: 8 }, (_, i) => ({
  id: `act_${i}`,
  type: (["order", "vendor", "product", "stock"] as const)[rng(0, 3)],
  message: [
    "New order placed by Aarav S.",
    "Vendor Nova & Co. approved",
    "Product low stock: Pixel Earbuds",
    "Refund issued for ORD-482910",
    "New vendor application received",
    "Bulk stock update completed",
    "Report generated: Q4 revenue",
    "Payment settled to Terra Traders",
  ][i],
  time: `${rng(1, 59)}m ago`,
}));
