from apscheduler.schedulers.background import BackgroundScheduler
from ml_service.utils.logger import logger

scheduler = BackgroundScheduler()

def daily_forecast_refresh():
    logger.info("[Scheduler] Starting daily forecast refresh...")
    try:
        from ml_service.services.forecasting_service import get_forecasts
        get_forecasts(days=30)
        logger.info("[Scheduler] Daily forecast refresh completed.")
    except Exception as e:
        logger.error(f"[Scheduler] Daily forecast refresh failed: {e}")

def weekly_model_retraining():
    logger.info("[Scheduler] Starting weekly model retraining...")
    try:
        from ml_service.ml.train import run_forecasting_pipeline, run_recommendation_pipeline
        run_forecasting_pipeline()
        run_recommendation_pipeline()
        logger.info("[Scheduler] Weekly model retraining completed.")
    except Exception as e:
        logger.error(f"[Scheduler] Weekly model retraining failed: {e}")

def monthly_vendor_benchmarking():
    logger.info("[Scheduler] Starting monthly vendor benchmarking calculations...")
    try:
        from ml_service.services.analytics_service import get_marketplace_benchmarking
        get_marketplace_benchmarking(days=30)
        logger.info("[Scheduler] Monthly vendor benchmarking completed.")
    except Exception as e:
        logger.error(f"[Scheduler] Monthly vendor benchmarking failed: {e}")

def start_scheduler():
    if not scheduler.running:
        # Schedule jobs
        scheduler.add_job(daily_forecast_refresh, "cron", hour=0, minute=0, id="daily_forecast_refresh")
        scheduler.add_job(weekly_model_retraining, "cron", day_of_week="sun", hour=2, minute=0, id="weekly_model_retraining")
        scheduler.add_job(monthly_vendor_benchmarking, "cron", day=1, hour=3, minute=0, id="monthly_vendor_benchmarking")
        
        scheduler.start()
        logger.info("APScheduler background worker started successfully and registered 3 jobs.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler background worker stopped.")
