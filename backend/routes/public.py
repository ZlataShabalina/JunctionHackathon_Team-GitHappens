from fastapi import APIRouter
from data import get_assets, get_zones, get_history

router = APIRouter(tags=["public"])

@router.get("/assets")
def assets():
    return get_assets()

@router.get("/zones")
def zones():
    return get_zones()

@router.get("/history/{asset_id}")
def history(asset_id: str):
    return get_history(asset_id)
