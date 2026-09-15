from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
import mlflow
from ml_service.config import settings
from ml_service.database import db_conn
from ml_service.utils.logger import logger
from ml_service.utils.scheduler import start_scheduler, shutdown_scheduler
from ml_service.routes import health, analytics, forecasting, recommendation, customer_intelligence
app = FastAPI(
    title="ShopSense ML Service",
    description="Python FastAPI service for advanced revenue analysis, marketplace benchmarking, demand forecasting, and recommendation modeling.",
    version="1.0.0"
)
mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
logger.info(f"MLflow Tracking URI set to: {settings.MLFLOW_TRACKING_URI}")
@app.on_event("startup")
def startup_event():
    logger.info("Starting ShopSense ML Service...")
    db_conn.connect()
    start_scheduler()
    try:
        from ml_service.ml.train import initialize_ml_pipelines
        initialize_ml_pipelines()
    except Exception as e:
        logger.error(f"Failed to auto-run initial pipeline: {e}")
@app.on_event("shutdown")
def shutdown_event():
    logger.info("Stopping ShopSense ML Service...")
    shutdown_scheduler()
app.include_router(health.router)
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(forecasting.router, prefix="/api/forecasting", tags=["Forecasting"])
app.include_router(recommendation.router, prefix="/api/recommendation", tags=["Recommendations"])
app.include_router(customer_intelligence.router, prefix="/api/customer-intelligence", tags=["Customer Intelligence"])
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhanded exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": f"ML Service Internal Error: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=settings.FASTAPI_PORT, reload=True)
