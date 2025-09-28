#!/usr/bin/env python3
"""
Crew movement simulator.

- Posts positions to /crew/position with x-api-key
- Creates a few demo crews if none exist (alex, lee, sara)
- Picks target sites (critical/warning preferred) and moves toward them
- Updates every 5–9 seconds with ~150–300 m steps
- Sends crew_id, lat, lon, status, speed, heading

Env vars:
  SIM_BASE_URL     (default: http://localhost:8000)
  SIM_API_KEY      (default: dev-simulator)
"""

import math, os, random, threading, time
import requests

BASE = os.environ.get("SIM_BASE_URL", "http://localhost:8000")
API_KEY = os.environ.get("SIM_API_KEY", "dev-simulator")

TICK_RANGE_SEC = (5.0, 9.0)     # update interval (randomized)
STEP_RANGE_M   = (150.0, 300.0) # meters per tick

SESSION = requests.Session()
HEADERS  = {"x-api-key": API_KEY}

# ---------- geo helpers ----------
def bearing(lat1, lon1, lat2, lon2):
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    dλ = math.radians(lon2 - lon1)
    y = math.sin(dλ) * math.cos(φ2)
    x = math.cos(φ1) * math.sin(φ2) - math.sin(φ1) * math.cos(φ2) * math.cos(dλ)
    θ = math.atan2(y, x)
    return (math.degrees(θ) + 360.0) % 360.0

def destination(lat, lon, brg_deg, dist_m):
    R = 6371000.0
    θ = math.radians(brg_deg)
    δ = dist_m / R
    φ1 = math.radians(lat)
    λ1 = math.radians(lon)
    φ2 = math.asin(math.sin(φ1) * math.cos(δ) + math.cos(φ1) * math.sin(δ) * math.cos(θ))
    λ2 = λ1 + math.atan2(math.sin(θ) * math.sin(δ) * math.cos(φ1),
                         math.cos(δ) - math.sin(φ1) * math.sin(φ2))
    return (math.degrees(φ2), ((math.degrees(λ2) + 540.0) % 360.0) - 180.0)

# ---------- backend helpers ----------
def get_json(url, **kw):
    r = SESSION.get(url, timeout=10, **kw)
    r.raise_for_status()
    return r.json()

def post_json(url, payload, **kw):
    r = SESSION.post(url, json=payload, timeout=10, **kw)
    if r.status_code >= 400:
        try:
            print("POST error:", r.status_code, r.text)
        except Exception:
            print("POST error:", r.status_code)
    r.raise_for_status()
    return r.json() if r.headers.get("content-type","").startswith("application/json") else None

def fetch_sites():
    return get_json(f"{BASE}/sites")

def fetch_crews():
    try:
        data = get_json(f"{BASE}/crew")
        return data if isinstance(data, list) else []
    except Exception as e:
        print("fetch_crews failed:", e)
        return []

def upsert_crew(crew_id, name):
    try:
        post_json(f"{BASE}/crew", {"id": crew_id, "name": name, "status": "on_duty"})
    except Exception as e:
        print("upsert_crew failed:", e)

def post_position(crew_id, lat, lon, status="on_duty", speed_kmh=None, heading_deg=None):
    payload = {
        "crew_id": crew_id,     # IMPORTANT: backend expects crew_id
        "lat": float(lat),
        "lon": float(lon),
        "status": status
    }
    if speed_kmh is not None: payload["speed"] = float(speed_kmh)
    if heading_deg is not None: payload["heading"] = float(heading_deg)
    post_json(f"{BASE}/crew/position", payload, headers=HEADERS)

# ---------- simulation logic ----------
def choose_target(sites):
    if not sites:
        return None
    prio = [s for s in sites if (s.get("meta") or {}).get("status") in ("critical", "warning")]
    pool = prio or sites
    return random.choice(pool)

def runner(crew, default_lat=63.0960, default_lon=21.6158):
    crew_id = crew["id"]
    lat = crew.get("last_lat") or default_lat
    lon = crew.get("last_lon") or default_lon

    sites = []
    target = None

    # initial ping
    try:
        post_position(crew_id, lat, lon, status="on_duty")
    except Exception as e:
        print(f"initial post_position failed for {crew_id}:", e)

    while True:
        # refresh sites periodically (local cache)
        if not sites or random.random() < 0.1:
            try:
                sites = fetch_sites()
            except Exception as e:
                print("fetch_sites failed:", e)

        # select / reselection logic
        if (not target) and sites:
            target = choose_target(sites)

        # if target missing, drift randomly
        if not target:
            brg = random.uniform(0, 360)
        else:
            # reached if within ~80m
            dist_deg = math.hypot(lat - target["lat"], lon - target["lon"])
            if dist_deg * 111_000 < 80:
                target = choose_target(sites)
            brg = bearing(lat, lon, target["lat"], target["lon"])

        # random wobble so paths aren’t straight
        brg += random.uniform(-12, 12)

        # step + tick
        step = random.uniform(*STEP_RANGE_M)
        tick = random.uniform(*TICK_RANGE_SEC)

        # compute destination + speed
        nlat, nlon = destination(lat, lon, brg, step)
        speed_kmh = (step / 1000.0) / (tick / 3600.0)  # km/h

        # post update
        try:
            post_position(crew_id, nlat, nlon, status="on_duty", speed_kmh=speed_kmh, heading_deg=brg % 360)
        except Exception as e:
            print(f"post_position failed for {crew_id}:", e)

        lat, lon = nlat, nlon
        time.sleep(tick)

def main():
    print(f"[sim] BASE={BASE}  API_KEY={'<set>' if API_KEY else '<empty>'}")
    crews = fetch_crews()
    if not crews:
        # seed a few crews if none exist
        for c in [{"id": "alex", "name": "Alex"}, {"id": "lee", "name": "Lee"}, {"id": "sara", "name": "Sara"}]:
            upsert_crew(c["id"], c["name"])
            try:
                post_position(c["id"], 63.0960, 21.6158, status="on_duty")
            except Exception as e:
                print("seed post_position failed:", e)
        crews = fetch_crews()

    for c in crews:
        threading.Thread(target=runner, args=(c,), daemon=True).start()
        print(f"[sim] started {c.get('id')}")

    print("[sim] running… Ctrl+C to stop")
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n[sim] stopped")

if __name__ == "__main__":
    main()
