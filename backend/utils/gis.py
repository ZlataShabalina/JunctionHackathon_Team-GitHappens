from typing import Optional, Tuple

def parse_bbox(bbox: Optional[str]) -> Optional[Tuple[float, float, float, float]]:
    if not bbox:
        return None
    parts = [p.strip() for p in bbox.split(",")]
    if len(parts) != 4:
        return None
    try:
        # minLon,minLat,maxLon,maxLat
        min_lon, min_lat, max_lon, max_lat = map(float, parts)
        return (min_lat, min_lon, max_lat, max_lon)
    except Exception:
        return None

def within_bbox(lat: float, lon: float, bbox_tuple) -> bool:
    min_lat, min_lon, max_lat, max_lon = bbox_tuple
    return (min_lat <= lat <= max_lat) and (min_lon <= lon <= max_lon)
