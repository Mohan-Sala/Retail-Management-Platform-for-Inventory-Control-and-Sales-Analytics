from fastapi import APIRouter, Query
from ml_service.services import forecasting_service

router = APIRouter()

@router.get("/predict")
def get_predictions(days: int = Query(30)):
    data = forecasting_service.get_forecasts(days=days)
    return {"success": True, "data": data}
