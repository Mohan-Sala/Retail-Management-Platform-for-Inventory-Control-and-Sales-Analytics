const mongoose = require("mongoose");
const assert = require("assert");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const BASE_URL = "http://localhost:5000";
const MONGO_URI = process.env.MONGO_URI;
const testResults = [];
let testCustomerToken = "";
let testVendorToken = "";
let testAdminToken = "";
let testCustomerId = "";
let testVendorUserId = "";
let testAdminId = "";
let testVendorId = ""; // Vendor collection ID (created on registering vendor user)
let testProductId = "";
const uniqueSuffix = Date.now();
const testCustomerEmail = `customer_${uniqueSuffix}@testsuite.com`;
const testVendorEmail = `vendor_${uniqueSuffix}@testsuite.com`;
const testAdminEmail = `admin_${uniqueSuffix}@testsuite.com`;
const testProductSku = `SKU-TEST-${uniqueSuffix}`;
function logTest(name, status, error = null) {
  testResults.push({ name, status, error: error ? error.message : null });
  if (status === "PASS") {
    console.log(`\x1b[32m[PASS]\x1b[0m ${name}`);
  } else {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${name}`);
    if (error) {
      console.error(error);
    }
  }
}
async function run() {
  console.log("==================================================");
  console.log("        SHOPSENSE INTEGRATION TEST SUITE          ");
  console.log("==================================================\n");
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for test coordination.");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
  const User = require("../models/User");
  const Vendor = require("../models/Vendor");
  const Product = require("../models/Product");
  const Order = require("../models/Order");
  const Transaction = require("../models/Transaction");
  const Cart = require("../models/Cart");
  const Notification = require("../models/Notification");
  const Customer = require("../models/Customer");
  async function cleanup() {
    console.log("\nCleaning up test suite records...");
    await User.deleteMany({ email: { $regex: /@testsuite\.com$/ } });
    await Vendor.deleteMany({ email: { $regex: /@testsuite\.com$/ } });
    await Customer.deleteMany({ email: { $regex: /@testsuite\.com$/ } });
    await Product.deleteMany({ sku: { $regex: /^SKU-TEST-/ } });
    await Order.deleteMany({ idempotencyKey: { $regex: /^test_suite_/ } });
    await Transaction.deleteMany({ paymentMethod: "upi", status: "paid", qty: 99 }); // Specific to our test transaction
    // Also cleanup using customer ID if found
    if (testCustomerId) {
      await Cart.deleteMany({ customerId: testCustomerId });
      await Order.deleteMany({ customerId: testCustomerId });
      await Transaction.deleteMany({ customerId: testCustomerId });
      await Notification.deleteMany({ recipient: testCustomerId });
    }
    console.log("Cleanup completed.");
  }
  await cleanup();
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    logTest("Health Check Endpoint", "PASS");
  } catch (err) {
    logTest("Health Check Endpoint", "FAIL", err);
  }

  // Test 2: Authentication - Registration
  try {
    // Register Vendor User
    const resVendor = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Vendor",
        email: testVendorEmail,
        password: "password123",
        role: "vendor",
        businessName: "Test Suite Vendor Corp",
        phone: "+91 " + uniqueSuffix.toString().slice(-10),
      }),
    });
    assert.strictEqual(resVendor.status, 201);
    const vendorData = await resVendor.json();
    testVendorToken = vendorData.data.token;
    testVendorUserId = vendorData.data.user.id;

    // Register Customer User
    const resCustomer = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer",
        email: testCustomerEmail,
        password: "password123",
        role: "customer",
        phone: "+91 " + (uniqueSuffix - 1).toString().slice(-10),
      }),
    });

    assert.strictEqual(resCustomer.status, 201);
    const customerData = await resCustomer.json();
    testCustomerToken = customerData.data.token;
    testCustomerId = customerData.data.user.id;

    // Register Admin User
    const resAdmin = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Admin",
        email: testAdminEmail,
        password: "password123",
        role: "admin",
      }),
    });
    assert.strictEqual(resAdmin.status, 201);
    const adminData = await resAdmin.json();
    testAdminToken = adminData.data.token;
    testAdminId = adminData.data.user.id;

    logTest("User Registration (Customer, Vendor, Admin)", "PASS");
  } catch (err) {
    logTest("User Registration (Customer, Vendor, Admin)", "FAIL", err);
  }

  // Test 3: Authentication - Login & Token Verification
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: "password123",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.token);
    logTest("User Login", "PASS");
  } catch (err) {
    logTest("User Login", "FAIL", err);
  }

  // Test 4: Protected Endpoint Access Validation
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`); // No token
    assert.strictEqual(res.status, 401);
    logTest("Protected Endpoint Access (No Token block)", "PASS");
  } catch (err) {
    logTest("Protected Endpoint Access (No Token block)", "FAIL", err);
  }

  // Test 5: RBAC Authorization Verification
  try {
    // Attempt to access admin routing via customer token
    const res = await fetch(`${BASE_URL}/api/system/jobs`, {
      headers: { Authorization: `Bearer ${testCustomerToken}` },
    });
    // Should be unauthorized (403 or 401 depending on middleware)
    assert.ok(res.status === 403 || res.status === 401);
    logTest("RBAC Role Separation (Customer blocked from Admin routes)", "PASS");
  } catch (err) {
    logTest("RBAC Role Separation (Customer blocked from Admin routes)", "FAIL", err);
  }

  // Retrieve Vendor Model instance ID
  try {
    const vendorRecord = await Vendor.findOne({ email: testVendorEmail });
    assert.ok(vendorRecord);
    testVendorId = vendorRecord._id.toString();
    logTest("Vendor DB Autocreation Verification", "PASS");
  } catch (err) {
    logTest("Vendor DB Autocreation Verification", "FAIL", err);
  }

  // Test 6: Vendor CRUD (Admin updating vendor profile)
  try {
    const res = await fetch(`${BASE_URL}/api/vendors/${testVendorId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testAdminToken}`,
      },
      body: JSON.stringify({
        businessName: "Test Suite Vendor Corp Updated",
        ownerName: "Test Vendor Updated",
        email: testVendorEmail,
        phone: "+91 9999999999",
        gst: "GST-TEST-SUITE-123",
        address: "456 Test Suite Lane",
        city: "Pune",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    logTest("Vendor Editing & Updating (Admin/Owner)", "PASS");
  } catch (err) {
    logTest("Vendor Editing & Updating (Admin/Owner)", "FAIL", err);
  }

  // Test 7: Product Management (Creation & Retrieve)
  try {
    const resCreate = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testVendorToken}`,
      },
      body: JSON.stringify({
        name: "Test Product _test_suite_",
        sku: testProductSku,
        category: "Electronics",
        price: 1500,
        stock: 50,
        vendorId: testVendorId,
        description: "Integration test product",
      }),
    });
    assert.strictEqual(resCreate.status, 201);
    const createData = await resCreate.json();
    testProductId = createData.data.id;


    // Fetch product details
    const resGet = await fetch(`${BASE_URL}/api/products/${testProductId}`, {
      headers: { Authorization: `Bearer ${testCustomerToken}` },
    });
    assert.strictEqual(resGet.status, 200);
    const getData = await resGet.json();
    assert.strictEqual(getData.data.name, "Test Product _test_suite_");

    logTest("Product Onboarding & Details Retrieve", "PASS");
  } catch (err) {
    logTest("Product Onboarding & Details Retrieve", "FAIL", err);
  }

  // Test 8: Cart Management Flow
  try {
    // Add item to cart
    const resAdd = await fetch(`${BASE_URL}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testCustomerToken}`,
      },
      body: JSON.stringify({
        productId: testProductId,
        quantity: 2,
      }),
    });
    assert.strictEqual(resAdd.status, 200);

    // Retrieve cart
    const resGet = await fetch(`${BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${testCustomerToken}` },
    });
    assert.strictEqual(resGet.status, 200);
    const cartData = await resGet.json();
    const actualProdId = typeof cartData.data.items[0].productId === 'object' 
      ? (cartData.data.items[0].productId._id || cartData.data.items[0].productId.id) 
      : cartData.data.items[0].productId;
    assert.strictEqual(actualProdId, testProductId);
    assert.strictEqual(cartData.data.items[0].quantity, 2);


    logTest("Cart Append & Get Operations", "PASS");
  } catch (err) {
    logTest("Cart Append & Get Operations", "FAIL", err);
  }

  // Test 9: End-to-End Order Checkout & Payment status (UPI checkout -> completed)
  let upiOrderId = "";
  try {
    const resCheckout = await fetch(`${BASE_URL}/api/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testCustomerToken}`,
      },
      body: JSON.stringify({
        idempotencyKey: `test_suite_upi_${uniqueSuffix}`,
        shippingAddress: {
          fullName: "Test Recipient UPI",
          phone: "+91 9988776655",
          addressLine1: "123 Test St",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
        },
        paymentMethod: "UPI",
      }),
    });
    assert.strictEqual(resCheckout.status, 200);
    const checkoutData = await resCheckout.json();
    const orderObj = checkoutData.data.orders[0];
    upiOrderId = orderObj._id || orderObj.id;
    assert.strictEqual(orderObj.orderStatus, "completed");


    logTest("Checkout (UPI Payment -> completed)", "PASS");
  } catch (err) {
    logTest("Checkout (UPI Payment -> completed)", "FAIL", err);
  }

  // Test 10: End-to-End Order Checkout (COD checkout -> pending)
  try {
    // Add product to cart again
    await fetch(`${BASE_URL}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testCustomerToken}`,
      },
      body: JSON.stringify({
        productId: testProductId,
        quantity: 1,
      }),
    });

    const resCheckout = await fetch(`${BASE_URL}/api/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testCustomerToken}`,
      },
      body: JSON.stringify({
        idempotencyKey: `test_suite_cod_${uniqueSuffix}`,
        shippingAddress: {
          fullName: "Test Recipient COD",
          phone: "+91 9988776655",
          addressLine1: "123 Test St",
          city: "Delhi",
          state: "Delhi",
          postalCode: "110001",
          country: "India",
        },
        paymentMethod: "COD",
      }),
    });
    assert.strictEqual(resCheckout.status, 200);
    const checkoutData = await resCheckout.json();
    const orderObj = checkoutData.data.orders[0];
    assert.strictEqual(orderObj.orderStatus, "pending");


    logTest("Checkout (COD Payment -> pending)", "PASS");
  } catch (err) {
    logTest("Checkout (COD Payment -> pending)", "FAIL", err);
  }

  // Test 11: Stock Decrement & Transaction Autocreation Validation
  try {
    // Verify product stock is decremented. Initial was 50, purchased 2 (UPI) which decrements stock.
    // COD order is pending (unpaid) and does not decrement stock immediately.
    const product = await Product.findById(testProductId);
    assert.strictEqual(product.stock, 48);


    // Verify transaction was generated for UPI order
    const tx = await Transaction.findOne({ productId: testProductId });
    assert.ok(tx);
    assert.strictEqual(tx.amount, 3000); // 1500 * 2


    logTest("Stock Decrement & Transaction Generation", "PASS");
  } catch (err) {
    logTest("Stock Decrement & Transaction Generation", "FAIL", err);
  }

  // Test 12: Business Analytics & Segmentations routes
  try {
    // Analytics
    const resAnalytics = await fetch(`${BASE_URL}/api/analytics`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resAnalytics.status, 200);

    // Dashboard analytics
    const resDash = await fetch(`${BASE_URL}/api/dashboard-analytics`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resDash.status, 200);

    // Segmentation
    const resSeg = await fetch(`${BASE_URL}/api/customer-segmentation`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resSeg.status, 200);

    logTest("Analytics, Segmentation & Dashboard API Routes", "PASS");
  } catch (err) {
    logTest("Analytics, Segmentation & Dashboard API Routes", "FAIL", err);
  }

  // Test 13: Forecasting & Recommendations Route Integrations
  try {
    const resForecast = await fetch(`${BASE_URL}/api/forecast`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resForecast.status, 200);

    const resRec = await fetch(`${BASE_URL}/api/recommendations/trending`, {
      headers: { Authorization: `Bearer ${testAdminToken}` },
    });
    assert.strictEqual(resRec.status, 200);

    logTest("ML Forecasting & Recommendation Engine Integrations", "PASS");
  } catch (err) {
    logTest("ML Forecasting & Recommendation Engine Integrations", "FAIL", err);
  }

  // Test 14: Notification Operations & Cooldown Checks
  try {
    // Retrieve unread count
    const resUnread = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${testCustomerToken}` },
    });
    assert.strictEqual(resUnread.status, 200);

    // Get notifications
    const resList = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${testCustomerToken}` },
    });
    assert.strictEqual(resList.status, 200);

    logTest("Notification Service Integration", "PASS");
  } catch (err) {
    logTest("Notification Service Integration", "FAIL", err);
  }

  // Test 15: Negative Testing (Invalid credentials registration rejection, insufficient stock checkout rejection)
  try {
    // 1. Invalid Login
    const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: "wrongpassword",
      }),
    });
    assert.strictEqual(resLogin.status, 401);

    // 2. Register Duplicate User
    const resDuplicate = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer Duplicate",
        email: testCustomerEmail,
        password: "password123",
        role: "customer",
      }),
    });
    assert.strictEqual(resDuplicate.status, 400);

    logTest("Negative Testing (Invalid login & Duplicate registration)", "PASS");
  } catch (err) {
    logTest("Negative Testing (Invalid login & Duplicate registration)", "FAIL", err);
  }

  // Clean up
  await cleanup();

  // Close MongoDB
  await mongoose.disconnect();

  console.log("\n==================================================");
  console.log("            TEST MATRICES & RUN SUMMARY           ");
  console.log("==================================================");
  let passedCount = 0;
  let failedCount = 0;
  testResults.forEach((t) => {
    if (t.status === "PASS") passedCount++;
    else failedCount++;
  });
  console.log(`Total executed tests: ${testResults.length}`);
  console.log(`Passed: \x1b[32m${passedCount}\x1b[0m`);
  console.log(`Failed: \x1b[31m${failedCount}\x1b[0m`);
  console.log("==================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
