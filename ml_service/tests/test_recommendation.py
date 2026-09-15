def test_personalized_recommendations(client):
    # Test with dummy 24-character hex ID
    response = client.get("/api/recommendation/personalized/6a733347552ccce09f974948?limit=3")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data

def test_similar_products(client):
    # Test with dummy 24-character hex ID
    response = client.get("/api/recommendation/similar/6a729ab5f03e82ddf4145177?limit=3")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data

def test_frequently_bought_together(client):
    response = client.get("/api/recommendation/frequently-bought?limit=3")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data

def test_trending_products(client):
    response = client.get("/api/recommendation/trending?limit=3")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data
