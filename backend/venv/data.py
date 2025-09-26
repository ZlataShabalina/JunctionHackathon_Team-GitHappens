import random
import requests


ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNkZTVjMWZiMDViMDQzZDE4MmExMDZjMGFiMWE5ZGExIiwiaCI6Im11cm11cjY0In0="

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
    if f["heatwave"]:
        score += 0.3
    if f["winterStorm"]:
        score += 0.3
    if f["floodRisk"]:
        score += 0.2
    if f["agingInfra"]:
        score += 0.4
    if f["demandSpike"]:
        score += 0.3
    return min(score, 1)

def get_zones():
    zones = []
    base_lat = 63.0951
    base_lng = 21.6152
    for i in range(3):
        stress = random_weather()
        score = calculate_risk_score(stress)
        status = "stable" if score <= 0.3 else "moderate" if score <= 0.6 else "high"
        coords = [
            [base_lat + i*0.005, base_lng - 0.005],
            [base_lat + i*0.005, base_lng + 0.005],
            [base_lat + i*0.005 + 0.005, base_lng + 0.005],
            [base_lat + i*0.005 + 0.005, base_lng - 0.005]
        ]
        zones.append({
            "id": f"Z00{i+1}",
            "name": f"Zone {i+1}",
            "coords": coords,
            "status": status,
            "riskScore": score,
            "stressFactors": stress
        })
    return zones
def decode_polyline(polyline_str):
    index, lat, lng, coordinates = 0, 0, 0, []
    length = len(polyline_str)

    while index < length:
        result, shift = 0, 0

        while True:
            b = ord(polyline_str[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break

        delta_lat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += delta_lat

        result, shift = 0, 0
        while True:
            b = ord(polyline_str[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break

        delta_lng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += delta_lng

        coordinates.append((lng * 1e-5, lat * 1e-5))

    return coordinates
def get_assets():
    return [
        {"id": "crew-1", "name": "Field Team Alpha", "lat": 63.0950, "lng": 21.6100, "status": "available"},
        {"id": "crew-2", "name": "Team Bravo", "lat": 63.1000, "lng": 21.6200, "status": "responding"},
        {"id": "crew-3", "name": "Inspection Unit C", "lat": 63.0900, "lng": 21.6050, "status": "available"}
    ]
def get_route_coordinates(start, end):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "coordinates": [start, end],
        "instructions": False
    }

    resp = requests.post(url, json=body, headers=headers)
    data = resp.json()

    if "routes" not in data or len(data["routes"]) == 0:
        print("OpenRouteService returned error or no route:", data)
        return []

    geometry = data["routes"][0]["geometry"]
    coords = decode_polyline(geometry)

    return [
        {"timestamp": i, "lat": coord[1], "lng": coord[0]}  # Note: coords are (lng, lat)
        for i, coord in enumerate(coords)
    ]




def get_history(asset_id):
    # Define start and end points for each crew (lng, lat)
    routes = {
        "crew-2": ([21.6100, 63.0950], [21.6300, 63.1050]),
        "crew-1": ([21.6000, 63.0930], [21.6200, 63.0980]),
        "crew-3": ([21.6050, 63.0900], [21.6150, 63.1100])
    }
    start, end = routes.get(asset_id, ([21.6100, 63.0950], [21.6300, 63.1050]))
    route = get_route_coordinates(start, end)
    
    if not route:
        # Fallback: simple straight-line history if route fails
        base_lat = 63.095
        base_lng = 21.615
        return [
            {"timestamp": i, "lat": base_lat + i * 0.0005, "lng": base_lng + i * 0.0005}
            for i in range(10)
        ]
    return route