import math, random, time
from typing import Optional, Tuple, Dict, List

def destination_point(lat, lon, bearing_deg, dist_km):
    """Return lat/lon reached by moving dist_km along bearing from start."""
    R = 6371.0
    θ = math.radians(bearing_deg)
    δ = dist_km / R
    φ1 = math.radians(lat)
    λ1 = math.radians(lon)

    sinφ2 = math.sin(φ1) * math.cos(δ) + math.cos(φ1) * math.sin(δ) * math.cos(θ)
    φ2 = math.asin(sinφ2)
    y = math.sin(θ) * math.sin(δ) * math.cos(φ1)
    x = math.cos(δ) - math.sin(φ1) * sinφ2
    λ2 = λ1 + math.atan2(y, x)

    lat2 = math.degrees(φ2)
    lon2 = (math.degrees(λ2) + 540) % 360 - 180
    return lat2, lon2

class CrewSim:
    def __init__(self, api, crew_id, name,
                 speed_kmh=(35, 70),     # faster -> visible movement
                 pause=(5, 10),
                 jitter=0.0003,          # ~30m jitter max
                 follow_workorders=False):
        self.api = api
        self.id = crew_id
        self.name = name
        self.speed_min, self.speed_max = speed_kmh
        self.pause_min, self.pause_max = pause
        self.jitter = jitter
        self.follow_workorders = follow_workorders

        self.lat = None
        self.lon = None
        self.dest: Optional[Tuple[float, float]] = None
        self.status = "on_duty"

    # … keep ensure_created and choose_destination as you had …

    def tick(self, sites: Dict[str, Tuple[float, float]], site_ids: List[str]):
        # initialize near a random site
        if self.lat is None or self.lon is None:
            sid = random.choice(site_ids)
            base_lat, base_lon = sites[sid]
            self.lat = base_lat + random.uniform(-self.jitter, self.jitter)
            self.lon = base_lon + random.uniform(-self.jitter, self.jitter)
            self.choose_destination(sites, site_ids)

        if self.dest is None:
            self.choose_destination(sites, site_ids)

        # distance to destination
        d_km = haversine_km(self.lat, self.lon, self.dest[0], self.dest[1])
        if d_km < 0.05:  # within 50m -> dwell, then choose next
            self.status = "in_progress"
            self.post_position(speed=0.0, heading=None)
            time.sleep(random.uniform(10, 25))
            self.status = "on_duty"
            self.choose_destination(sites, site_ids)
            return

        # move a small geodesic step toward the destination
        dt = random.uniform(self.pause_min, self.pause_max)  # seconds
        speed = random.uniform(self.speed_min, self.speed_max)  # km/h
        step_km = speed * (dt / 3600.0)
        head = bearing_deg(self.lat, self.lon, self.dest[0], self.dest[1])

        new_lat, new_lon = destination_point(self.lat, self.lon, head, step_km)
        # tiny jitter so rounding never collapses steps
        new_lat += random.uniform(-self.jitter, self.jitter) * 0.2
        new_lon += random.uniform(-self.jitter, self.jitter) * 0.2

        self.lat, self.lon = new_lat, new_lon
        self.post_position(speed=speed, heading=head)

        time.sleep(dt)

    def post_position(self, speed: float, heading: Optional[float]):
        try:
            r = self.api.post(
                "/crew/position",
                json={
                    "crew_id": self.id,
                    "lat": round(self.lat, 5),   # ~1.1 m precision, enough to see changes
                    "lon": round(self.lon, 5),
                    "speed": round(speed, 1) if speed is not None else None,
                    "heading": round(heading, 0) if heading is not None else None,
                    "status": self.status,
                },
                headers={"x-api-key": self.api.key, "Content-Type": "application/json"},
            )
            if not r.ok:
                print(f"[{self.id}] position failed {r.status_code}: {r.text}")
            else:
                print(f"[{self.id}] at ({self.lat:.5f}, {self.lon:.5f}) {self.status}")
        except Exception as e:
            print(f"[{self.id}] error posting position: {e}")
