def test_customer_segmentation(client):
    response = client.get("/api/customer-intelligence/segmentation")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data

def test_customer_behavior(client):
    response = client.get("/api/customer-intelligence/behavior/6a733347552ccce09f974948")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data

def test_customer_retention(client):
    response = client.get("/api/customer-intelligence/retention/6a733347552ccce09f974948")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data

def test_customer_recommendations(client):
    response = client.get("/api/customer-intelligence/recommendations/6a733347552ccce09f974948?limit=3")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data
