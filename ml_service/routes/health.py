from fastapi import APIRouter
from ml_service.database import get_mongo_db, db_conn
from ml_service.utils.logger import logger
import mlflow
from datetime import datetime

router = APIRouter()

@router.get("/health")
def health_check():
    health = {
        "status": "healthy",
        "service": "ShopSense ML Service",
        "database": "disconnected",
        "mlflow": "disconnected",
        "model_registry": "disconnected",
        "last_training_time": None
    }
    
    # 1. MongoDB check
    try:
        db = get_mongo_db()
        # Ping database
        db.command("ping")
        health["database"] = "connected"
    except Exception as e:
        logger.error(f"Health check MongoDB failure: {e}")
        health["status"] = "unhealthy"
        
    # 2. MLflow check
    try:
        # Check if we can interact with MLflow
        mlflow.get_tracking_uri()
        health["mlflow"] = "connected"
        
        # Test listing registered models (registry check)
        from mlflow.client import MlflowClient
        client = MlflowClient()
        client.search_registered_models(max_results=1)
        health["model_registry"] = "connected"
        
        # Get last training time from MLflow runs if available
        experiments = client.search_experiments()
        if experiments:
            runs = client.search_runs(
                experiment_ids=[e.experiment_id for e in experiments],
                max_results=1,
                order_by=["attribute.start_time DESC"]
            )
            if runs:
                start_time_ms = runs[0].info.start_time
                health["last_training_time"] = datetime.fromtimestamp(start_time_ms / 1000.0).isoformat()
    except Exception as e:
        logger.error(f"Health check MLflow failure: {e}")
        # Note: We do not fail the overall API health strictly on MLflow being offline,
        # but mark its status accordingly
        
    if health["database"] != "connected":
        health["status"] = "unhealthy"

    return health
