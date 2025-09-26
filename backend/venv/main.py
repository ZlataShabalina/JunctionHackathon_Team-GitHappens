from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data import get_assets, get_zones, get_history

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/assets")
def assets():
    return get_assets()

@app.get("/zones")
def zones():
    return get_zones()

@app.get("/history/{asset_id}")
def history(asset_id: str):
    return get_history(asset_id)