import * as dotenv from "dotenv";
import * as path from "path";
import mongoose from "mongoose";
import User from "../models/User";
import Vendor from "../models/Vendor";
import Product from "../models/Product";
import Transaction from "../models/Transaction";
import Inventory from "../models/Inventory";
import Customer from "../models/Customer";
import { VENDORS, PRODUCTS_DATA, TRANSACTIONS } from "../../frontend/src/lib/mock-data";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("[Seeder] Error: MONGO_URI environment variable is missing.");
  process.exit(1);
}
const defaultPassword = process.env.DEFAULT_PASSWORD || "password123";

async function clearCollections() {
  console.log("[Seeder] Clearing all database collections...");
  await User.deleteMany({});
  await Vendor.deleteMany({});
  await Product.deleteMany({});
  await Transaction.deleteMany({});
  await Inventory.deleteMany({});
  await Customer.deleteMany({});
  console.log("[Seeder] Collections cleared successfully.");
}

async function seed() {
  try {
    console.log(`[Seeder] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("[Seeder] Connected successfully.");

    // Always clear collections first
    await clearCollections();

    // 1. Seed Users (Admin + Vendor Users)
    console.log("[Seeder] Creating User accounts...");
    const adminUser = {
      name: "Admin User",
      email: "admin@shopsense.io",
      password: defaultPassword,
      role: "admin" as const,
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Admin",
    };

    const vendorUsers = VENDORS.map((v) => ({
      name: v.ownerName,
      email: v.email,
      password: defaultPassword,
      role: "vendor" as const,
      businessName: v.businessName,
      phone: v.phone,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(v.ownerName)}`,
    }));

    // Use User.create so password pre-save hashing hooks are triggered
    const createdUsers = await User.create([adminUser, ...vendorUsers]);
    console.log(`[Seeder] Seeded ${createdUsers.length} User accounts (1 Admin + ${vendorUsers.length} Vendors).`);

    // Get Admin MongoDB document to set createdBy
    const adminDoc = createdUsers.find((u) => u.role === "admin");
    if (!adminDoc) {
      throw new Error("Admin user account not created correctly");
    }

    // 2. Seed Vendors
    console.log("[Seeder] Seeding Vendor profiles...");
    const vendorsToInsert = VENDORS.map((v) => ({
      businessName: v.businessName,
      ownerName: v.ownerName,
      email: v.email,
      phone: v.phone,
      gst: v.gst,
      address: v.address,
      city: v.city,
      status: v.status,
      commission: v.commission,
      revenue: v.revenue,
      productCount: v.productCount,
      joinedAt: new Date(v.joinedAt),
      avatar: v.avatar,
    }));

    const insertedVendors = await Vendor.insertMany(vendorsToInsert);
    console.log(`[Seeder] Seeded ${insertedVendors.length} Vendor profiles.`);

    // Build in-memory map: frontendId (vnd_XXX) -> MongoDB ObjectId (_id)
    const vendorIdMap: Record<string, mongoose.Types.ObjectId> = {};
    insertedVendors.forEach((vendor, i) => {
      const originalVendor = VENDORS[i];
      vendorIdMap[originalVendor.id] = vendor._id as mongoose.Types.ObjectId;
    });
    console.log("[Seeder] Created temporary vendor ObjectId lookup map.");

    // 3. Seed Products
    console.log("[Seeder] Seeding Product listings...");
    const productsToInsert = PRODUCTS_DATA.map((p) => {
      const resolvedVendorId = vendorIdMap[p.vendorId];
      if (!resolvedVendorId) {
        throw new Error(`Integrity Error: Product ${p.name} refers to unknown vendorId: ${p.vendorId}`);
      }
      return {
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        stock: p.stock,
        reorderLevel: p.reorderLevel,
        vendorId: resolvedVendorId,
        status: p.status,
        image: p.image,
        description: p.description,
        sales: p.sales,
        createdAt: new Date(p.createdAt),
      };
    });

    const insertedProducts = await Product.insertMany(productsToInsert);
    console.log(`[Seeder] Seeded ${insertedProducts.length} Product listings.`);

    // Seed matching Inventory records
    console.log("[Seeder] Seeding matching Inventory records...");
    const inventoriesToInsert = insertedProducts.map((p) => ({
      productId: p._id,
      currentStock: p.stock || 0,
      minimumStock: p.reorderLevel || 10,
      maximumStock: p.stock > 100 ? p.stock + 50 : 100,
    }));
    const insertedInventories = await Inventory.insertMany(inventoriesToInsert);
    console.log(`[Seeder] Seeded ${insertedInventories.length} Inventory records.`);

    // Build in-memory map: frontendId (prd_XXXX) -> MongoDB ObjectId (_id)
    const productIdMap: Record<string, mongoose.Types.ObjectId> = {};
    insertedProducts.forEach((product, i) => {
      const originalProduct = PRODUCTS_DATA[i];
      productIdMap[originalProduct.id] = product._id as mongoose.Types.ObjectId;
    });
    console.log("[Seeder] Created temporary product ObjectId lookup map.");

    // 4. Seed Customers (extract from Transactions unique customer names to be realistic)
    console.log("[Seeder] Generating and seeding Customer profiles...");
    const uniqueCustomerNames = Array.from(new Set(TRANSACTIONS.map((t) => t.customer)));
    const CITIES_LIST = ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];
    
    const customersToInsert = uniqueCustomerNames.map((name, i) => {
      const email = `${name.replace(/\s+/g, "").toLowerCase()}${i}@gmail.com`;
      return {
        name,
        phone: `+91 9${900000000 - i * 1357}`,
        email,
        city: CITIES_LIST[i % CITIES_LIST.length],
        address: `${i + 15}, Main Plaza, ${CITIES_LIST[i % CITIES_LIST.length]}`,
        totalOrders: 0,
        totalSpending: 0,
        isActive: true,
        createdBy: adminDoc._id as mongoose.Types.ObjectId,
      };
    });

    const insertedCustomers = await Customer.insertMany(customersToInsert);
    console.log(`[Seeder] Seeded ${insertedCustomers.length} Customer profiles.`);

    // Map: name -> Customer ObjectId
    const customerIdMap: Record<string, mongoose.Types.ObjectId> = {};
    insertedCustomers.forEach((cust) => {
      customerIdMap[cust.name] = cust._id as mongoose.Types.ObjectId;
    });

    // 5. Seed Transactions
    console.log("[Seeder] Seeding Transaction records...");
    const transactionsToInsert = TRANSACTIONS.map((t) => {
      const resolvedVendorId = vendorIdMap[t.vendorId];
      const resolvedProductId = productIdMap[t.productId];
      const resolvedCustomerId = customerIdMap[t.customer];
      if (!resolvedVendorId) {
        throw new Error(`Integrity Error: Transaction ${t.orderNo} refers to unknown vendorId: ${t.vendorId}`);
      }
      if (!resolvedProductId) {
        throw new Error(`Integrity Error: Transaction ${t.orderNo} refers to unknown productId: ${t.productId}`);
      }
      if (!resolvedCustomerId) {
        throw new Error(`Integrity Error: Transaction ${t.orderNo} refers to unknown customer: ${t.customer}`);
      }
      return {
        orderNo: t.orderNo,
        customerId: resolvedCustomerId,
        customer: t.customer,
        vendorId: resolvedVendorId,
        productId: resolvedProductId,
        qty: t.qty,
        amount: t.amount,
        status: t.status,
        paymentMethod: t.paymentMethod,
        date: new Date(t.date),
      };
    });

    const insertedTx = await Transaction.insertMany(transactionsToInsert);
    console.log(`[Seeder] Seeded ${insertedTx.length} Transaction logs.`);

    // 6. Post-process to align database metrics with paid transactions
    console.log("[Seeder] Post-processing product sales, vendor revenues, and customer metrics...");

    // Update Product sales based on Transactions
    for (const prod of insertedProducts) {
      const txsForProd = insertedTx.filter(
        (t) => t.productId.toString() === prod._id.toString() && t.status === "paid"
      );
      const unitsSold = txsForProd.reduce((sum, t) => sum + t.qty, 0);
      
      // Update sales count in DB
      await Product.findByIdAndUpdate(prod._id, { sales: unitsSold });
    }

    // Update Vendor revenues and product counts based on database listings
    for (const vend of insertedVendors) {
      const txsForVendor = insertedTx.filter(
        (t) => t.vendorId.toString() === vend._id.toString() && t.status === "paid"
      );
      const calculatedRevenue = txsForVendor.reduce((sum, t) => sum + t.amount, 0);

      const prodCount = insertedProducts.filter(
        (p) => p.vendorId.toString() === vend._id.toString()
      ).length;

      await Vendor.findByIdAndUpdate(vend._id, {
        revenue: calculatedRevenue,
        productCount: prodCount,
      });
    }

    // Update Customer spending stats
    for (const cust of insertedCustomers) {
      const txsForCust = insertedTx.filter(
        (t) => t.customerId.toString() === cust._id.toString() && t.status === "paid"
      );
      const ordersCount = txsForCust.length;
      const totalSpendingSum = txsForCust.reduce((sum, t) => sum + t.amount, 0);
      const lastPurchaseTx = [...txsForCust].sort((a, b) => b.date.getTime() - a.date.getTime())[0];

      await Customer.findByIdAndUpdate(cust._id, {
        totalOrders: ordersCount,
        totalSpending: totalSpendingSum,
        lastPurchaseDate: lastPurchaseTx ? lastPurchaseTx.date : null,
      });
    }
    console.log("[Seeder] Metrics successfully aligned and synchronized.");

    console.log("\n==================================================");
    console.log("            SEEDING OPERATION COMPLETED            ");
    console.log("==================================================");
    console.log(`  - Users Inserted       : ${createdUsers.length}`);
    console.log(`  - Vendors Inserted     : ${insertedVendors.length}`);
    console.log(`  - Products Inserted    : ${insertedProducts.length}`);
    console.log(`  - Customers Inserted   : ${insertedCustomers.length}`);
    console.log(`  - Transactions Inserted: ${insertedTx.length}`);
    console.log("==================================================\n");

    await mongoose.disconnect();
    console.log("[Seeder] Disconnected from MongoDB gracefully.");
    process.exit(0);
  } catch (error: any) {
    console.error("\n==================================================");
    console.error("              SEEDING OPERATION FAILED            ");
    console.error("==================================================");
    console.error(`Error details: ${error.message || error}`);
    console.error("Initiating database rollback to prevent partial state...");

    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
      }
      await clearCollections();
      console.error("Rollback successful: collections completely cleared.");
    } catch (rollbackError: any) {
      console.error(`CRITICAL: Cleanup failed during rollback: ${rollbackError.message}`);
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.error("Disconnected from MongoDB.");
    console.error("==================================================\n");
    process.exit(1);
  }
}

seed();
