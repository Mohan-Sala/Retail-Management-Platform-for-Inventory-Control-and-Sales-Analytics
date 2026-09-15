import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ml_service.database import get_mongo_db
from ml_service.utils.logger import logger
from bson import ObjectId

def get_customer_segments_distribution():
    db = get_mongo_db()
    customers = list(db.customers.find({}))
    
    if not customers:
        return {"gold": 0, "silver": 0, "bronze": 0, "total": 0}
        
    gold_count = 0
    silver_count = 0
    bronze_count = 0
    
    for c in customers:
        classification = db.customerclassifications.find_one({"customerId": c["_id"]})
        if classification:
            seg = classification.get("segment", "Bronze")
            if seg == "Gold":
                gold_count += 1
            elif seg == "Silver":
                silver_count += 1
            else:
                bronze_count += 1
        else:
            # Fallback by purchase count if classification doesn't exist
            bronze_count += 1
            
    total = gold_count + silver_count + bronze_count
    return {
        "gold": gold_count,
        "silver": silver_count,
        "bronze": bronze_count,
        "total": total,
        "percentages": {
            "gold": round((gold_count / total * 100) if total > 0 else 0, 1),
            "silver": round((silver_count / total * 100) if total > 0 else 0, 1),
            "bronze": round((bronze_count / total * 100) if total > 0 else 0, 1)
        }
    }

def get_customer_behavior_analytics(customer_id: str):
    db = get_mongo_db()
    behavior = db.customerbehaviors.find_one({"customerId": ObjectId(customer_id)})
    
    if not behavior:
        return {
            "recentlyViewedCount": 0,
            "recentlyPurchasedCount": 0,
            "favoriteCategories": [],
            "searchFrequency": 0,
            "recommendationClickThroughRate": 0.0
        }
        
    clicks = behavior.get("totalRecommendationClicks", 0)
    conversions = behavior.get("recommendationConversions", 0)
    ctr = (conversions / clicks * 100) if clicks > 0 else 0.0
    
    return {
        "recentlyViewedCount": len(behavior.get("recentlyViewedProducts", [])),
        "recentlyPurchasedCount": len(behavior.get("recentlyPurchasedProducts", [])),
        "favoriteCategories": behavior.get("favoriteCategories", []),
        "searchFrequency": behavior.get("searchFrequency", 0),
        "recommendationClickThroughRate": float(round(ctr, 2))
    }

def get_customer_retention_metrics(customer_id: str):
    db = get_mongo_db()
    classification = db.customerclassifications.find_one({"customerId": ObjectId(customer_id)})
    
    # Calculate simple recency metrics from transactions
    txs = list(db.transactions.find({"customerId": ObjectId(customer_id), "status": "paid"}))
    
    if not classification:
        # Fallback calculations
        total_spent = sum([tx.get("amount", 0.0) for tx in txs])
        purchase_freq = len(txs)
        
        last_purchase_days = 30
        if txs:
            last_tx_date = max([tx.get("createdAt") for tx in txs])
            last_purchase_days = (datetime.utcnow() - last_tx_date).days
            
        churn_risk = 80 if last_purchase_days > 45 else 20
        
        return {
            "customerLifetimeValue": float(total_spent),
            "averageOrderValue": float(total_spent / purchase_freq) if purchase_freq > 0 else 0.0,
            "purchaseFrequency": purchase_freq,
            "lastPurchaseDaysAgo": last_purchase_days,
            "churnRiskScore": churn_risk,
            "status": "Inactive" if last_purchase_days > 60 else "Active"
        }
        
    return {
        "customerLifetimeValue": float(classification.get("customerLifetimeValue", 0.0)),
        "averageOrderValue": float(classification.get("averageOrderValue", 0.0)),
        "purchaseFrequency": int(classification.get("purchaseFrequency", 0)),
        "lastPurchaseDaysAgo": int(classification.get("lastPurchaseDaysAgo", 30)),
        "churnRiskScore": float(classification.get("churnRiskScore", 15.0)),
        "status": "Inactive" if classification.get("lastPurchaseDaysAgo", 0) > 60 else "Active"
    }
