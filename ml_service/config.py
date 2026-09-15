import os
# Change current working directory to project root to prevent relative path permission errors
os.chdir("d:/shopsense")
from dotenv import load_dotenv

# Load main MERN env config to get MONGO_URI
load_dotenv(dotenv_path="d:/shopsense/backend/.env")


class Settings:
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/test")
    # Default to "shop" or let the URI handle the database name
    MONGO_DB_NAME: str = "test"  # In MongoDB Atlas, URI connection maps to the primary cluster db
    
    FASTAPI_PORT: int = 8000
    MLFLOW_TRACKING_URI: str = "sqlite:///d:/shopsense/backend/mlruns.db"
    MODEL_STAGE: str = "Production"
    FORECAST_MODEL_NAME: str = "InventoryForecastModel"
    RECOMMENDATION_MODEL_NAME: str = "RecommendationModel"

settings = Settings()
