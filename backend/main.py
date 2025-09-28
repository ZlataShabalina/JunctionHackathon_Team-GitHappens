from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from db import engine, Base
from routers import sites, assets, workorders, notices, public, crew  # notices optional
from routers import ingest_scada



app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sites.router)
app.include_router(assets.router)
app.include_router(workorders.router)
app.include_router(notices.router)   # remove if not used
app.include_router(public.router)
app.include_router(crew.router)
app.include_router(ingest_scada.router)

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/healthz")
async def healthz():
    return {"status": "ok", "env": settings.APP_ENV}

@app.get("/history/{asset_id}")
def history(asset_id: str):
    return get_history(asset_id)