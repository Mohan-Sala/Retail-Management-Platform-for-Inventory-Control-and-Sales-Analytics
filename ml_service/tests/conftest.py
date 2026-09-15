import pytest
import requests

class LiveFastAPIClient:
    def get(self, url, **kwargs):
        # Translate client params to requests params if needed
        # TestClient uses 'params' or direct queries. requests.get does too.
        return requests.get(f"http://127.0.0.1:8000{url}", **kwargs)

    def post(self, url, **kwargs):
        return requests.post(f"http://127.0.0.1:8000{url}", **kwargs)

@pytest.fixture(scope="module")
def client():
    return LiveFastAPIClient()
