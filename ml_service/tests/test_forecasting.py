def test_forecasting_predict(client):
    response = client.get("/api/forecasting/predict?days=7")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data
