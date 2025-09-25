from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend is running "}

@app.get("/assets")
def get_assets():
    return [
        {"id": "crew-1", "name": "Field Team Alpha", "lat": 40.7100, "lng": -74.0050, "status": "available"},
        {"id": "crew-2", "name": "Team Bravo", "lat": 40.7200, "lng": -74.0030, "status": "responding to Zone 1"},
        {"id": "crew-3", "name": "Inspection Unit C", "lat": 40.7000, "lng": -74.0100, "status": "available"},
    ]

@app.get("/zones")
def get_zones():
    def randomWeather():
        return {
            "heatwave": random.random() < 0.4,
            "winterStorm": random.random() < 0.2,
            "floodRisk": random.random() < 0.1,
            "agingInfra": random.random() < 0.5,
            "demandSpike": random.random() < 0.3,
        }

    def calculateRiskScore(stress):
        score = 0
        if stress["heatwave"]: score += 0.3
        if stress["winterStorm"]: score += 0.3
        if stress["floodRisk"]: score += 0.2
        if stress["agingInfra"]: score += 0.4
        if stress["demandSpike"]: score += 0.3
        return min(score, 1.0)

    zones = []
    for i in range(3):
        stress = randomWeather()
        score = calculateRiskScore(stress)
        if score > 0.6:
            status = "red"
        elif score > 0.3:
            status = "yellow"
        else:
            status = "green"
        zones.append({
            "id": f"Z00{i+1}",
            "riskScore": score,
            "status": status,
            "stressFactors": stress
        })
    return zones
