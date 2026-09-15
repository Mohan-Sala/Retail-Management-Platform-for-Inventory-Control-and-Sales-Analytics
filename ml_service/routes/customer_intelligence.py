from fastapi import APIRouter, Query, Path
from ml_service.services import customer_service, recommendation_service
router = APIRouter()
@router.get("/segmentation")
def get_segmentation():
    data = customer_service.get_customer_segments_distribution()
    return {"success": True, "data": data}
@router.get("/behavior/{customerId}")
def get_behavior(customerId: str):
    data = customer_service.get_customer_behavior_analytics(customerId)
    return {"success": True, "data": data}
@router.get("/retention/{customerId}")
def get_retention(customerId: str):
    data = customer_service.get_customer_retention_metrics(customerId)
    return {"success": True, "data": data}
@router.get("/recommendations/{customerId}")
def get_recommendations(customerId: str, limit: int = Query(5)):
    data = recommendation_service.get_personalized_recommendations(customerId, limit=limit)
    return {"success": True, "data": data}