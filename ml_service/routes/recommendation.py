from fastapi import APIRouter, Query, Path
from ml_service.services import recommendation_service
router = APIRouter()
@router.get("/personalized/{customerId}")
def get_personalized(customerId: str, limit: int = Query(5)):
    data = recommendation_service.get_personalized_recommendations(customerId, limit=limit)
    return {"success": True, "data": data}
@router.get("/similar/{productId}")
def get_similar(productId: str, limit: int = Query(5)):
    data = recommendation_service.get_similar_products(productId, limit=limit)
    return {"success": True, "data": data}
@router.get("/frequently-bought")
def get_frequently_bought(limit: int = Query(5)):
    data = recommendation_service.get_frequently_bought_together(limit=limit)
    return {"success": True, "data": data}
@router.get("/trending")
def get_trending(limit: int = Query(5)):
    data = recommendation_service.get_trending_products(limit=limit)
    return {"success": True, "data": data}