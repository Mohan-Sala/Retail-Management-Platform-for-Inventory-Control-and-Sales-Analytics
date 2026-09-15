def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert "status" in json_data
    assert "service" in json_data
    assert "database" in json_data
    assert "mlflow" in json_data
    assert json_data["service"] == "ShopSense ML Service"
