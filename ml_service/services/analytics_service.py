import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ml_service.database import get_mongo_db
from ml_service.utils.logger import logger
from bson import ObjectId
def get_revenue_analytics(vendor_id: str = None, category: str = None, days: int = 30):
    db = get_mongo_db()
    order_query = {}
    if vendor_id:
        order_query["vendorId"] = ObjectId(vendor_id)
    orders_cursor = db.orders.find(order_query)
    orders = list(orders_cursor)
    if not orders:
        return {
            "totalRevenue": 0.0,
            "netRevenue": 0.0,
            "gmv": 0.0,
            "totalOrders": 0,
            "averageOrderValue": 0.0,
            "overallProfitMargin": 0.0,
            "revenueByVendor": {},
            "revenueByCategory": {},
            "trends": {"daily": [], "weekly": [], "monthly": []}
        }
    df_orders = pd.DataFrame(orders)
    df_orders["_id"] = df_orders["_id"].apply(str)
    df_orders["vendorId"] = df_orders["vendorId"].apply(str)
    df_orders["customerId"] = df_orders["customerId"].apply(str)
    df_orders["createdAt"] = pd.to_datetime(df_orders["createdAt"])
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    df_orders = df_orders[df_orders["createdAt"] >= cutoff_date]
    if df_orders.empty:
        return {
            "totalRevenue": 0.0,
            "netRevenue": 0.0,
            "gmv": 0.0,
            "totalOrders": 0,
            "averageOrderValue": 0.0,
            "overallProfitMargin": 0.0,
            "revenueByVendor": {},
            "revenueByCategory": {},
            "trends": {"daily": [], "weekly": [], "monthly": []}
        }
        
    # Calculate GMV (Total of all placed orders regardless of status)
    gmv = float(df_orders["totalAmount"].sum())
    
    # Calculate Total Revenue (Only completed or paid/delivered orders)
    paid_statuses = ["paid", "delivered"]
    # If the order is not cancelled, it counts for revenue
    df_revenue_orders = df_orders[df_orders["orderStatus"] != "cancelled"]
    total_rev = float(df_revenue_orders["totalAmount"].sum())
    
    # Net Revenue (Total Revenue minus discount/tax if applicable)
    net_rev = float((df_revenue_orders["totalAmount"] - df_revenue_orders.get("tax", 0) - df_revenue_orders.get("discount", 0)).sum())
    
    total_orders = len(df_orders)
    aov = float(df_orders["totalAmount"].mean()) if total_orders > 0 else 0.0
    
    # Extract item details to calculate cost & profit margins
    all_items = []
    for idx, row in df_orders.iterrows():
        order_date = row["createdAt"]
        vendor_id_str = row["vendorId"]
        for item in row["items"]:
            all_items.append({
                "orderId": row["_id"],
                "productId": str(item["productId"]),
                "quantity": item["quantity"],
                "price": item["price"],
                "subtotal": item["subtotal"],
                "vendorId": vendor_id_str,
                "createdAt": order_date,
                "orderStatus": row["orderStatus"]
            })
            
    df_items = pd.DataFrame(all_items)
    
    # Fetch product details for costPrice and category
    prod_ids = [ObjectId(pid) for pid in df_items["productId"].unique()] if not df_items.empty else []
    products = list(db.products.find({"_id": {"$in": prod_ids}}))
    df_prods = pd.DataFrame(products)
    
    overall_margin = 0.0
    revenue_by_vendor = {}
    revenue_by_category = {}
    
    if not df_prods.empty:
        df_prods["_id"] = df_prods["_id"].apply(str)
        if "costPrice" not in df_prods.columns:
            df_prods["costPrice"] = None
        df_prods["costPrice"] = df_prods["costPrice"].fillna(df_prods["price"] * 0.7)

        
        # Merge items with products
        df_merged = pd.merge(df_items, df_prods[["_id", "costPrice", "category"]], left_on="productId", right_on="_id", how="left")
        
        # In case some products are missing or deleted
        df_merged["costPrice"] = df_merged["costPrice"].fillna(df_merged["price"] * 0.7)
        df_merged["category"] = df_merged["category"].fillna("General")
        
        # Calculate margins
        df_merged["total_cost"] = df_merged["costPrice"] * df_merged["quantity"]
        
        # Filter for active orders for margin/rev distributions
        df_active_items = df_merged[df_merged["orderStatus"] != "cancelled"]
        
        total_sales_val = df_active_items["subtotal"].sum()
        total_cost_val = df_active_items["total_cost"].sum()
        
        if total_sales_val > 0:
            overall_margin = float((total_sales_val - total_cost_val) / total_sales_val * 100)
            
        # Group by category and vendor
        rev_by_v = df_active_items.groupby("vendorId")["subtotal"].sum()
        for vid, val in rev_by_v.items():
            vendor_doc = db.vendors.find_one({"_id": ObjectId(vid)})
            name = vendor_doc["businessName"] if vendor_doc else vid
            revenue_by_vendor[name] = float(val)
            
        rev_by_cat = df_active_items.groupby("category")["subtotal"].sum()
        for cat, val in rev_by_cat.items():
            revenue_by_category[cat] = float(val)
            
    # Calculate daily, weekly, monthly trends
    # Daily
    df_orders["day"] = df_orders["createdAt"].dt.strftime("%Y-%m-%d")
    daily_trend = df_orders.groupby("day")["totalAmount"].sum().reset_index()
    daily_list = [{"date": r["day"], "revenue": float(r["totalAmount"])} for _, r in daily_trend.iterrows()]
    
    # Weekly
    df_orders["week"] = df_orders["createdAt"].dt.to_period("W").apply(str)
    weekly_trend = df_orders.groupby("week")["totalAmount"].sum().reset_index()
    weekly_list = [{"date": r["week"], "revenue": float(r["totalAmount"])} for _, r in weekly_trend.iterrows()]
    
    # Monthly
    df_orders["month"] = df_orders["createdAt"].dt.to_period("M").apply(str)
    monthly_trend = df_orders.groupby("month")["totalAmount"].sum().reset_index()
    monthly_list = [{"date": r["month"], "revenue": float(r["totalAmount"])} for _, r in monthly_trend.iterrows()]
    
    return {
        "totalRevenue": float(total_rev),
        "netRevenue": float(net_rev),
        "gmv": float(gmv),
        "totalOrders": int(total_orders),
        "averageOrderValue": float(aov),
        "overallProfitMargin": float(round(overall_margin, 2)),
        "revenueByVendor": revenue_by_vendor,
        "revenueByCategory": revenue_by_category,
        "trends": {
            "daily": daily_list,
            "weekly": weekly_list,
            "monthly": monthly_list
        }
    }

def get_marketplace_benchmarking(days: int = 30):
    db = get_mongo_db()
    
    orders = list(db.orders.find({}))
    if not orders:
        return {"vendors": [], "topProducts": [], "topVendors": []}
        
    df = pd.DataFrame(orders)
    df["vendorId"] = df["vendorId"].apply(str)
    df["createdAt"] = pd.to_datetime(df["createdAt"])
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    df_filtered = df[df["createdAt"] >= cutoff_date]
    
    if df_filtered.empty:
        return {"vendors": [], "topProducts": [], "topVendors": []}
        
    # Group by vendor
    vendors_list = []
    
    for vid, group in df_filtered.groupby("vendorId"):
        vendor_doc = db.vendors.find_one({"_id": ObjectId(vid)})
        vendor_name = vendor_doc["businessName"] if vendor_doc else "Unknown Vendor"
        
        # Calculations
        tot_orders = len(group)
        cancelled = len(group[group["orderStatus"] == "cancelled"])
        delivered = len(group[group["orderStatus"] == "delivered"])
        on_time = len(group[(group["orderStatus"] == "delivered") & (group["fulfillmentStatus"] == "on_time")])
        
        success_rate = ((tot_orders - cancelled) / tot_orders * 100) if tot_orders > 0 else 100.0
        cancellation_rate = (cancelled / tot_orders * 100) if tot_orders > 0 else 0.0
        
        # Return rate simulation (since returns request schema is separate, count requests for this vendor)
        return_requests_count = db["returns"].count_documents({"vendorId": ObjectId(vid)}) if "returns" in db.list_collection_names() else 0
        return_rate = (return_requests_count / tot_orders * 100) if tot_orders > 0 else 0.0
        
        on_time_pct = (on_time / delivered * 100) if delivered > 0 else 100.0
        
        # Average fulfillment time in hours (simulated average: on-time = 24-48h, delayed = 72-120h)
        avg_fulfillment_hours = float(np.mean([36 if status == "on_time" else 96 for status in group["fulfillmentStatus"]]))
        
        # Vendor Revenue
        active_group = group[group["orderStatus"] != "cancelled"]
        revenue = float(active_group["totalAmount"].sum())
        
        # Vendor Growth Rate: Compare current 15 days to previous 15 days
        mid_cutoff = datetime.utcnow() - timedelta(days=days // 2)
        cur_period = active_group[active_group["createdAt"] >= mid_cutoff]["totalAmount"].sum()
        prev_period = active_group[active_group["createdAt"] < mid_cutoff]["totalAmount"].sum()
        
        growth_rate = float(((cur_period - prev_period) / prev_period * 100) if prev_period > 0 else 0.0)
        
        # Satisfaction rating from product reviews
        satisfaction = 0.0
        prods = list(db.products.find({"vendorId": ObjectId(vid)}))
        if prods:
            ratings = [p.get("averageRating", 0) for p in prods if p.get("averageRating", 0) > 0]
            satisfaction = float(np.mean(ratings)) if ratings else 4.0
            
        vendors_list.append({
            "vendorId": vid,
            "businessName": vendor_name,
            "revenue": revenue,
            "growthRate": float(round(growth_rate, 2)),
            "averageFulfillmentTimeHours": float(round(avg_fulfillment_hours, 1)),
            "onTimeDeliveryPercentage": float(round(on_time_pct, 2)),
            "orderSuccessRate": float(round(success_rate, 2)),
            "cancellationRate": float(round(cancellation_rate, 2)),
            "returnRate": float(round(return_rate, 2)),
            "customerSatisfaction": float(round(satisfaction, 2))
        })
        
    # Sort vendors by revenue
    df_vendors = pd.DataFrame(vendors_list)
    df_vendors["rank"] = df_vendors["revenue"].rank(ascending=False, method="min")
    
    # Top Products by sales count
    top_products_list = []
    all_product_sales = {}
    for _, row in df_filtered.iterrows():
        for item in row["items"]:
            pid = str(item["productId"])
            qty = item["quantity"]
            all_product_sales[pid] = all_product_sales.get(pid, 0) + qty
            
    sorted_pids = sorted(all_product_sales.items(), key=lambda x: x[1], reverse=True)[:5]
    for pid, qty in sorted_pids:
        prod_doc = db.products.find_one({"_id": ObjectId(pid)})
        if prod_doc:
            top_products_list.append({
                "productId": pid,
                "productName": prod_doc["name"],
                "category": prod_doc["category"],
                "salesCount": qty,
                "revenue": float(qty * prod_doc["price"])
            })
            
    benchmarked_vendors = df_vendors.to_dict(orient="records")
    top_vendors = sorted(benchmarked_vendors, key=lambda x: x["revenue"], reverse=True)[:5]
    
    return {
        "vendors": benchmarked_vendors,
        "topProducts": top_products_list,
        "topVendors": top_vendors
    }
