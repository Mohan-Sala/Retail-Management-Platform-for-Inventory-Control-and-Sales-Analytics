import os
from pathlib import Path
from dotenv import load_dotenv

# Resolve project root dynamically (parent of ml_service)
BASE_DIR = Path(__file__).resolve().parent.parent

# Set working directory to project root safely if possible
try:
    os.chdir(str(BASE_DIR))
except Exception:
    pass

# Load main MERN env config if present
env_path = BASE_DIR / "backend" / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()


class Settings:
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/test")
    # Default to "shop" or let the URI handle the database name
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "test")
    
    FASTAPI_PORT: int = int(os.getenv("PORT", os.getenv("FASTAPI_PORT", 8000)))
    
    _default_mlflow = f"sqlite:///{(BASE_DIR / 'backend' / 'mlruns.db').as_posix()}"
    MLFLOW_TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", _default_mlflow)
    MODEL_STAGE: str = os.getenv("MODEL_STAGE", "Production")
    FORECAST_MODEL_NAME: str = "InventoryForecastModel"
    RECOMMENDATION_MODEL_NAME: str = "RecommendationModel"

settings = Settings()
