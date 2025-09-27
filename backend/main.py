from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data import get_assets, get_zones, get_history
from routes import webhooks, stream, public  

app = FastAPI(title="Device Backend", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks.router)
app.include_router(stream.router)
app.include_router(public.router) 

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/assets")
def assets():
    return get_assets()

@app.get("/healthz")
def healthz():
    return {"status": "ok"}
