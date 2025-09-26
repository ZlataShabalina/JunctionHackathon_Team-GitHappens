# Static demo data & thresholds. Replace with DB when ready.
from typing import Dict, Any, List
from utils.store import store

ASSETS: List[Dict[str, Any]] = [
    {"id": "A-100", "name": "Compressor-1", "zone_id": "Z-1"},
    {"id": "A-200", "name": "Fan-12",       "zone_id": "Z-2"},
]

ZONES: List[Dict[str, Any]] = [
    {"id": "Z-1", "name": "Assembly"},
    {"id": "Z-2", "name": "Packaging"},
]

# thresholds[asset_id][metric] = {"warn": ..., "crit": ...}
THRESHOLDS: Dict[str, Dict[str, Dict[str, float]]] = {
    "A-100": {"stress": {"warn": 60.0, "crit": 80.0}, "usage": {"warn": 70.0, "crit": 90.0}},
    "A-200": {"stress": {"warn": 55.0, "crit": 75.0}, "usage": {"warn": 65.0, "crit": 85.0}},
}

def get_assets():
    return ASSETS

def get_zones():
    return ZONES

def get_thresholds():
    return THRESHOLDS

def get_history(asset_id: str):
    return [r.model_dump(mode="json") for r in store.get_history(asset_id)]

