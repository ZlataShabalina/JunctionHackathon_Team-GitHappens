
#!/usr/bin/env python3
"""
Simulate maintenance crew GPS updates for the PowerPulse backend (non-realtime).
- Creates crew if missing.
- Moves them between real site coordinates.
- Posts /crew/position every 5–10 seconds (configurable).

Usage:
  python simulate_crew.py \
    --base http://localhost:8000 \
    --key dev-mobile-key \
    --crews alex:Alex,sara:Sara,lee:Lee \
    --follow-workorders

Press Ctrl+C to stop.
"""

import argparse, time, random, math, sys
import requests
from typing import Dict, Tuple, List, Optional

# ----------------- helpers -----------------

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1 = math.radians(lat1); phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1); dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def lerp(a, b, t):  # linear interpolation
    return a + (b - a) * t

def bearing_deg(lat1, lon1, lat2, lon2):
    phi1 = math.radians(lat1); phi2 = math.radians(lat2)
    dlambda = math.radians(lon2 - lon1)
    y = math.sin(dlambda) * math.cos(phi2)
    x = math.cos(phi1)*math.sin(phi2) - math.sin(phi1)*math.cos(phi2)*math.cos(dlambda)
    brng = (math.degrees(math.atan2(y, x)) + 360) % 360
    return brng

# ----------------- API -----------------

class API:
    def __init__(self, base: str, key: str):
        self.base = base.rstrip("/")
        self.key = key
        self.session = requests.Session()

    def get(self, path: str, **kwargs):
        return self.session.get(self.base + path, timeout=15, **kwargs)

    def post(self, path: str, json=None, **kwargs):
        headers = kwargs.pop("headers", {})
        return self.session.post(self.base + path, json=json, timeout=15, headers=headers, **kwargs)

    def patch(self, path: str, json=None, **kwargs):
        return self.session.patch(self.base + path, json=json, timeout=15, **kwargs)

# ----------------- simulator -----------------

class CrewSim:
    def __init__(self, api: API, crew_id: str, name: str, speed_kmh=(25, 55), pause=(5,10), jitter=0.0008, follow_workorders=False):
        self.api = api
        self.id = crew_id
        self.name = name
        self.speed_min, self.speed_max = speed_kmh
        self.pause_min, self.pause_max = pause
        self.jitter = jitter
        self.follow_workorders = follow_workorders

        self.lat = None
        self.lon = None
        self.dest: Optional[Tuple[float,float]] = None
        self.status = "on_duty"

    def ensure_created(self):
        r = self.api.post("/crew", json={"id": self.id, "name": self.name, "role": "technician", "status": "on_duty"})
        if r.status_code not in (200, 201, 400):
            print(f"[{self.id}] create crew failed {r.status_code}: {r.text}")
        else:
            print(f"[{self.id}] ready")

    def choose_destination(self, sites: Dict[str, Tuple[float,float]], site_ids: List[str]):
        # If following workorders, try to route to assigned site's coords
        if self.follow_workorders:
            try:
                r = self.api.get(f"/workorders", params={"assigned_to": self.id})
                if r.ok:
                    items = r.json().get("items", [])
                    # pick the most recent that has a site_id
                    for it in items:
                        sid = it.get("site_id")
                        if sid and sid in sites:
                            self.dest = sites[sid]
                            return
            except Exception as e:
                print(f"[{self.id}] workorders fetch error: {e}")
        # otherwise pick a random site
        sid = random.choice(site_ids)
        self.dest = sites[sid]

    def tick(self, sites: Dict[str, Tuple[float,float]], site_ids: List[str]):
        # initialize at random site
        if self.lat is None or self.lon is None:
            sid = random.choice(site_ids)
            base_lat, base_lon = sites[sid]
            self.lat = base_lat + random.uniform(-self.jitter, self.jitter)
            self.lon = base_lon + random.uniform(-self.jitter, self.jitter)
            self.choose_destination(sites, site_ids)

        # arrived?
        if self.dest is None:
            self.choose_destination(sites, site_ids)

        d_km = haversine_km(self.lat, self.lon, self.dest[0], self.dest[1])
        if d_km < 0.05:  # within 50m -> dwell then choose next
            self.status = "in_progress"
            self.post_position(speed=0.0, heading=None)
            # short dwell
            dwell = random.uniform(10, 25)
            print(f"[{self.id}] arrived; dwell {dwell:.0f}s")
            time.sleep(dwell)
            self.status = "on_duty"
            self.choose_destination(sites, site_ids)
            return

        # move towards destination
        dt = random.uniform(self.pause_min, self.pause_max)  # seconds
        speed = random.uniform(self.speed_min, self.speed_max)  # km/h
        step_km = speed * (dt / 3600.0)

        frac = min(1.0, step_km / d_km) if d_km > 0 else 1.0
        new_lat = lerp(self.lat, self.dest[0], frac)
        new_lon = lerp(self.lon, self.dest[1], frac)
        head = bearing_deg(self.lat, self.lon, self.dest[0], self.dest[1])

        self.lat, self.lon = new_lat, new_lon
        self.post_position(speed=speed, heading=head)

        # sleep until next tick
        time.sleep(dt)

    def post_position(self, speed: float, heading: Optional[float]):
        try:
            r = self.api.post(
                "/crew/position",
                json={
                    "crew_id": self.id,
                    "lat": round(self.lat, 6),
                    "lon": round(self.lon, 6),
                    "speed": round(speed, 1) if speed is not None else None,
                    "heading": round(heading, 0) if heading is not None else None,
                    "status": self.status
                },
                headers={"x-api-key": self.api.key, "Content-Type": "application/json"}
            )
            if not r.ok:
                print(f"[{self.id}] position failed {r.status_code}: {r.text}")
            else:
                print(f"[{self.id}] at ({self.lat:.5f}, {self.lon:.5f}) {self.status}")
        except Exception as e:
            print(f"[{self.id}] error posting position: {e}")

# ----------------- main -----------------

def load_sites(api: API) -> Dict[str, Tuple[float,float]]:
    r = api.get("/sites")
    r.raise_for_status()
    data = r.json()
    sites = {s["id"]: (s["lat"], s["lon"]) for s in data}
    if not sites:
        raise RuntimeError("No sites found. Create sites first.")
    return sites

def parse_crews(s: str) -> List[Tuple[str,str]]:
    items = []
    for part in s.split(","):
        part = part.strip()
        if not part:
            continue
        if ":" in part:
            cid, name = part.split(":", 1)
        else:
            cid, name = part, part.title()
        items.append((cid.strip(), name.strip()))
    return items

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8000", help="API base URL")
    ap.add_argument("--key", default="dev-mobile-key", help="x-api-key for /crew/position")
    ap.add_argument("--crews", default="alex:Alex,sara:Sara,lee:Lee", help="CSV of id:Name")
    ap.add_argument("--follow-workorders", action="store_true", help="Route to assigned work orders' sites when possible")
    args = ap.parse_args()

    api = API(args.base, args.key)
    try:
        requests.get(args.base + "/healthz", timeout=5)
    except Exception as e:
        print("Backend not reachable:", e)
        sys.exit(1)

    sites = load_sites(api)
    site_ids = list(sites.keys())
    print(f"Loaded {len(site_ids)} sites")

    crew_defs = parse_crews(args.crews)
    sims = []
    for cid, name in crew_defs:
        sim = CrewSim(api, cid, name, follow_workorders=args.follow_workorders)
        sim.ensure_created()
        sims.append(sim)

    print("Starting simulation. Ctrl+C to stop.")
    try:
        while True:
            for sim in sims:
                sim.tick(sites, site_ids)
    except KeyboardInterrupt:
        print("\nStopped.")

if __name__ == "__main__":
    main()
