from locust import HttpUser, task, between
import random

class ShopSenseFastAPIUser(HttpUser):
    wait_time = between(1, 3)

    @task(10)
    def health_check(self):
        self.client.get("/health")

    @task(30)
    def revenue_analytics(self):
        self.client.get("/api/analytics/revenue?days=30")

    @task(15)
    def benchmarking_analytics(self):
        self.client.get("/api/analytics/benchmarking?days=30")

    @task(25)
    def forecasting_predict(self):
        self.client.get("/api/forecasting/predict?days=30")

    @task(10)
    def trending_recommendations(self):
        self.client.get("/api/recommendation/trending?limit=5")

    @task(10)
    def customer_segmentation(self):
        self.client.get("/api/customer-intelligence/segmentation")
