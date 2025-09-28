#!/usr/bin/env python3
import math, random, time, requests, threading

BASE = "http://localhost:8000"
TICK = (5, 9)  # seconds between updates (randomized)
STEP_M = (150, 300)  # meters per tick
SESSION = requests.Session()

def bearing(lat1, lon1, lat2, lon2):
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    Δλ = math.radians(lon2 - lon1)
    y = math.sin(Δλ) * math.cos(φ2)
    x = math.cos(φ1) * math.sin(φ2) - math.sin(φ1) * math.cos(φ2) * math.cos(Δλ)
    θ = math.atan2(y, x)
    return (math.degrees(θ) + 360) % 360

def destination(lat, lon, brg_deg, dist_m):
    R = 6371000.0
    θ = math.radians(brg_deg)
    δ = dist_m / R
    φ1 = math.radians(lat)
    λ1 = math.radians(lon)
    φ2 = math.asin(math.sin(φ1)*math.cos(δ) + math.cos(φ1)*math.sin(δ)*math.cos(θ))
    λ2 = λ1 + math.atan2(math.sin(θ)*math.sin(δ)*math.cos(φ1),
                         math.cos(δ)-math.sin(φ1)*math.sin(φ2))
    return (math.degrees(φ2), ((math.degrees(λ2)+540)%360)-180)

def choose_target(sites):
    prio = [s for s in sites if (s.get("meta") or {}).get("status") in ("critical","warning")]
    pool = prio or sites
    return random.choice(pool)

def fetch_sites():
    return SESSION.get(f"{BASE}/sites").json()

def fetch_crews():
    return SESSION.get(f"{BASE}/crew").json()

def upsert_crew(crew_id, name):
    SESSION.post(f"{BASE}/crew", json={"id": crew_id, "name": name, "status":"on_duty"})

def post_position(crew_id, lat, lon, status="on_duty"):
    SESSION.post(f"{BASE}/crew/position", json={"id": crew_id, "lat": lat, "lon": lon, "status": status})

def runner(crew):
    crew_id = crew["id"]
    lat = crew.get("last_lat") or 63.096  # default Vaasa-ish
    lon = crew.get("last_lon") or 21.616
    target = None

    sites = fetch_sites()
    if sites:
        target = choose_target(sites)

    while True:
        # pick a target if missing or reached (~50 m)
        if not target or math.hypot(lat - target["lat"], lon - target["lon"]) * 111_000 < 50:
            target = choose_target(sites)
        brg = bearing(lat, lon, target["lat"], target["lon"])

        step = random.uniform(*STEP_M)
        # small random wobble
        brg += random.uniform(-10, 10)
        lat, lon = destination(lat, lon, brg, step)

        post_position(crew_id, lat, lon, status="on_duty")
        time.sleep(random.uniform(*TICK))

def main():
    crews = fetch_crews()
    if not isinstance(crews, list): crews = []

    # Create a few if none exist
    seed = [{"id":"alex","name":"Alex"},{"id":"lee","name":"Lee"},{"id":"sara","name":"Sara"}]
    existing_ids = {c["id"] for c in crews}
    for c in seed:
        if c["id"] not in existing_ids:
            upsert_crew(c["id"], c["name"])
            post_position(c["id"], 63.096, 21.616)

    crews = fetch_crews()
    for c in crews:
        threading.Thread(target=runner, args=(c,), daemon=True).start()

    print("Simulator running…")
    while True:
        time.sleep(60)

if __name__ == "__main__":
    main()