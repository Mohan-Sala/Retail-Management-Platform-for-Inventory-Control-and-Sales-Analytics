import numpy as np
import pandas as pd
from ml_service.database import get_mongo_db
from ml_service.utils.logger import logger
from bson import ObjectId

def get_similar_products(product_id: str, limit: int = 5):
    db = get_mongo_db()
    
    target_product = db.products.find_one({"_id": ObjectId(product_id), "deletedAt": None})
    if not target_product:
        return []
        
    category = target_product.get("category", "")
    price = target_product.get("price", 0.0)
    
    # Query other active products in the same category
    other_products = list(db.products.find({
        "_id": {"$ne": ObjectId(product_id)},
        "category": category,
        "deletedAt": None,
        "status": "active"
    }))
    
    if not other_products:
        return []
        
    # Rank by price proximity and ratings
    similar_list = []
    for p in other_products:
        price_diff = abs(p.get("price", 0.0) - price)
        # Score combines category match (perfect), price proximity, and average rating
        score = 100.0 - min(50.0, (price_diff / max(1.0, price)) * 50.0) + (p.get("averageRating", 0.0) * 4.0)
        
        vendor_doc = db.vendors.find_one({"_id": p.get("vendorId")})
        vendor_name = vendor_doc["businessName"] if vendor_doc else "Unknown Vendor"
        
        similar_list.append({
            "productId": str(p["_id"]),
            "productName": p["name"],
            "sku": p["sku"],
            "category": p["category"],
            "price": p["price"],
            "image": p.get("image", ""),
            "vendor": vendor_name,
            "score": round(score, 2)
        })
        
    # Sort and return
    similar_list.sort(key=lambda x: x["score"], reverse=True)
    return similar_list[:limit]

def get_frequently_bought_together(limit: int = 5):
    db = get_mongo_db()
    orders = list(db.orders.find({"orderStatus": {"$ne": "cancelled"}}))
    
    if not orders or len(orders) < 2:
        return []
        
    # Co-occurrence map of product IDs
    pairs = {}
    for o in orders:
        items = list(set([str(item["productId"]) for item in o.get("items", [])]))
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                p1, p2 = sorted([items[i], items[j]])
                pair_key = (p1, p2)
                pairs[pair_key] = pairs.get(pair_key, 0) + 1
                
    # Sort pairs by co-occurrence count
    sorted_pairs = sorted(pairs.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    fbt_list = []
    for (p1, p2), count in sorted_pairs:
        prod1 = db.products.find_one({"_id": ObjectId(p1), "deletedAt": None})
        prod2 = db.products.find_one({"_id": ObjectId(p2), "deletedAt": None})
        
        if prod1 and prod2:
            fbt_list.append({
                "productA": {
                    "productId": p1,
                    "productName": prod1["name"],
                    "price": prod1["price"],
                    "image": prod1.get("image", "")
                },
                "productB": {
                    "productId": p2,
                    "productName": prod2["name"],
                    "price": prod2["price"],
                    "image": prod2.get("image", "")
                },
                "associationStrength": count
            })
            
    return fbt_list

def get_trending_products(limit: int = 5):
    db = get_mongo_db()
    
    # Query products with highest sales velocity
    products = list(db.products.find({"deletedAt": None, "status": "active"}).sort("sales", -1).limit(limit))
    
    trending = []
    for p in products:
        vendor_doc = db.vendors.find_one({"_id": p.get("vendorId")})
        vendor_name = vendor_doc["businessName"] if vendor_doc else "Unknown Vendor"
        
        trending.append({
            "productId": str(p["_id"]),
            "productName": p["name"],
            "sku": p["sku"],
            "category": p["category"],
            "price": p["price"],
            "image": p.get("image", ""),
            "vendor": vendor_name,
            "salesCount": p.get("sales", 0),
            "score": 90.0 + min(10.0, p.get("sales", 0) * 0.5)
        })
        
    return trending

def get_personalized_recommendations(customer_id: str, limit: int = 5):
    db = get_mongo_db()
    
    # 1. Retrieve customer transactions
    paid_txs = list(db.transactions.find({
        "customerId": ObjectId(customer_id),
        "status": "paid"
    }))
    
    purchased_categories = set()
    purchased_vendors = set()
    
    # Resolve items bought by customer to build category/vendor affinity profile
    for tx in paid_txs:
        order_num = tx.get("orderNumber")
        order_doc = db.orders.find_one({"orderNumber": order_num})
        if order_doc:
            for item in order_doc.get("items", []):
                prod = db.products.find_one({"_id": item["productId"]})
                if prod:
                    if prod.get("category"):
                        purchased_categories.add(prod["category"])
                    if prod.get("vendorId"):
                        purchased_vendors.add(str(prod["vendorId"]))
                        
    # 2. Get customer behavior affinity
    behavior = db.customerbehaviors.find_one({"customerId": ObjectId(customer_id)})
    if behavior:
        fav_cats = [c["category"] for c in behavior.get("favoriteCategories", [])]
        purchased_categories.update(fav_cats)
        
        fav_vendors = [str(v["vendorId"]) for v in behavior.get("favoriteVendors", [])]
        purchased_vendors.update(fav_vendors)
        
    # 3. Query all active candidates
    candidates = list(db.products.find({
        "deletedAt": None,
        "status": "active"
    }))
    
    scored_candidates = []
    for c in candidates:
        score = 20.0  # Base score
        
        # Category affinity boost
        if c.get("category") in purchased_categories:
            score += 35.0
            
        # Vendor affinity boost
        if str(c.get("vendorId")) in purchased_vendors:
            score += 25.0
            
        # Popularity rating boost
        score += c.get("averageRating", 0.0) * 4.0
        
        vendor_doc = db.vendors.find_one({"_id": c.get("vendorId")})
        vendor_name = vendor_doc["businessName"] if vendor_doc else "Unknown Vendor"
        
        scored_candidates.append({
            "productId": str(c["_id"]),
            "productName": c["name"],
            "sku": c["sku"],
            "category": c["category"],
            "price": c["price"],
            "image": c.get("image", ""),
            "vendor": vendor_name,
            "recommendationScore": min(100.0, round(score, 1)),
            "recommendationReasons": [
                "Purchased similar products" if c.get("category") in purchased_categories else "Trending this week"
            ]
        })
        
    scored_candidates.sort(key=lambda x: x["recommendationScore"], reverse=True)
    return scored_candidates[:limit]
