import random

def random_weather():
    return {
        "heatwave": random.random() < 0.4,
        "winterStorm": random.random() < 0.2,
        "floodRisk": random.random() < 0.1,
        "agingInfra": random.random() < 0.5,
        "demandSpike": random.random() < 0.3
    }

def calculate_risk_score(f):
    score = 0
    if f["heatwave"]: score += 0.3
    if f["winterStorm"]: score += 0.3
    if f["floodRisk"]: score += 0.2
    if f["agingInfra"]: score += 0.4
    if f["demandSpike"]: score += 0.3
    return min(score, 1)

def get_zones():
    zones = []
    for i in range(3):
        stress = random_weather()
        score = calculate_risk_score(stress)
        status = "stable" if score <= 0.3 else "moderate" if score <= 0.6 else "high"
        zones.append({
            "id": f"Z00{i+1}",
            "name": f"Zone {i+1}",
            "coords": [[-74.00 + i*0.01, 40.71], [-74.00 + i*0.01, 40.72], [-73.99 + i*0.01, 40.72], [-73.99 + i*0.01, 40.71]],
            "status": status,
            "riskScore": score,
            "stressFactors": stress
        })
    return zones

def get_assets():
    return [
        {"id": "crew-1", "name": "Field Team Alpha", "lat": 40.7100, "lng": -74.0050, "status": "available"},
        {"id": "crew-2", "name": "Team Bravo", "lat": 40.7200, "lng": -74.0030, "status": "responding"},
        {"id": "crew-3", "name": "Inspection Unit C", "lat": 40.7000, "lng": -74.0100, "status": "available"}
    ]

def get_history(asset_id):
    return [
        {"timestamp": i, "lat": 40.71 + i*0.001, "lng": -74.005 + i*0.001}
        for i in range(10)
    ]
