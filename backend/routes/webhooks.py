import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.encoders import jsonable_encoder
from models import SensorReading
from utils.auth import verify_token
from utils.store import store
from utils.state import broker
from data import get_thresholds
from utils.risk import check_risk

router = APIRouter(tags=["webhooks"])

@router.post("/webhooks/device", status_code=202)
async def device_webhook(request: Request):
    # Auth
    verify_token(request)

    # Raw body → model (so signature/HMAC would work if you add it later)
    raw = await request.body()
    try:
        reading = SensorReading.model_validate_json(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

    from fastapi.encoders import jsonable_encoder  # optional but handy

    # Store
    store.add_reading(reading)

    # Broadcast raw reading (JSON-safe)
    await broker.publish("reading", reading.model_dump(mode="json"))
    # or: await broker.publish("reading", jsonable_encoder(reading))

    # Risk check + broadcast if any (JSON-safe)
    risk = check_risk(reading, get_thresholds())
    if risk:
        await broker.publish("risk", risk.model_dump(mode="json"))
        # or: await broker.publish("risk", jsonable_encoder(risk))

    return {"ok": True}

