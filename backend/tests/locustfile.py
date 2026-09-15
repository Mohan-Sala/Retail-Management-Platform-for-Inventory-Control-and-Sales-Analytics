from locust import HttpUser, task, between
import random

class ShopSenseExpressUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Authenticate as admin to have permission for all routes (products, forecast, analytics, recommendations)
        self.email = "locust_test_admin@testsuite.com"
        self.password = "password123"
        self.headers = {}
        
        # Try logging in first
        login_payload = {
            "email": self.email,
            "password": self.password
        }
        with self.client.post("/api/auth/login", json=login_payload, name="/api/auth/login", catch_response=True) as res_login:
            if res_login.status_code == 200:
                data = res_login.json()
                token = data["data"]["token"]
                self.headers = {"Authorization": f"Bearer {token}"}
                res_login.success()
            else:
                res_login.success()  # Expect 401/404 if not registered yet
                # User doesn't exist, try registering (ignore register errors in stats)
                payload = {
                    "name": "Locust Admin",
                    "email": self.email,
                    "password": self.password,
                    "role": "admin"
                }
                with self.client.post("/api/auth/register", json=payload, name="/api/auth/register", catch_response=True) as res:
                    if res.status_code == 201:
                        data = res.json()
                        token = data["data"]["token"]
                        self.headers = {"Authorization": f"Bearer {token}"}
                        res.success()
                    else:
                        # Try logging in again in case of race condition
                        res_login2 = self.client.post("/api/auth/login", json=login_payload, name="/api/auth/login")
                        if res_login2.status_code == 200:
                            data = res_login2.json()
                            token = data["data"]["token"]
                            self.headers = {"Authorization": f"Bearer {token}"}
                            res.success()
                        else:
                            res.failure(f"Authentication failed: {res.text}")




    @task(10)
    def health_check(self):
        self.client.get("/api/health")

    @task(30)
    def product_listing(self):
        self.client.get("/api/products", headers=self.headers)

    @task(25)
    def product_search(self):
        queries = ["test", "Electronics", "Product", "invalidqueryabc"]
        q = random.choice(queries)
        self.client.get(f"/api/products?search={q}", headers=self.headers)

    @task(15)
    def analytics_check(self):
        self.client.get("/api/analytics", headers=self.headers)

    @task(10)
    def forecast_check(self):
        self.client.get("/api/forecast", headers=self.headers)

    @task(10)
    def recommendations_check(self):
        self.client.get("/api/recommendations/trending", headers=self.headers)
