def test_revenue_analytics(client):
    response = client.get("/api/analytics/revenue")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data

def test_revenue_analytics_params(client):
    response = client.get("/api/analytics/revenue?days=90&category=Electronics")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True

def test_marketplace_benchmarking(client):
    response = client.get("/api/analytics/benchmarking?days=30")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data
