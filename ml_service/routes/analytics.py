from fastapi import APIRouter, Query
from ml_service.services import analytics_service
from typing import Optional

router = APIRouter()

@router.get("/revenue")
def get_revenue(
    vendorId: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    days: int = Query(30)
):
    data = analytics_service.get_revenue_analytics(
        vendor_id=vendorId,
        category=category,
        days=days
    )
    return {"success": True, "data": data}

@router.get("/benchmarking")
def get_benchmarking(days: int = Query(30)):
    data = analytics_service.get_marketplace_benchmarking(days=days)
    return {"success": True, "data": data}
