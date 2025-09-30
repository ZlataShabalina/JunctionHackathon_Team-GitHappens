# backend/routers/ingest_scada.py
from __future__ import annotations
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from db import get_session
from models import Notice  # we only rely on Notice

router = APIRouter(prefix="/ingest", tags=["ingest"])

# ---------- Pydantic payloads ----------

class ScadaPoint(BaseModel):
    source: Optional[str] = "scada"
    tag: str
    value: Optional[float] = None
    unit: Optional[str] = None
    ts: Optional[datetime] = None
    # Optional context
    site_id: Optional[str] = None
    asset_id: Optional[str] = None
    # Simple alarm logic helpers
    alarm: Optional[bool] = None
    threshold: Optional[float] = None
    meta: Optional[Dict[str, Any]] = None

class ScadaBatch(BaseModel):
    items: List[ScadaPoint]

Payload = Union[ScadaPoint, ScadaBatch]

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

# ---------- Route ----------

@router.post("/scada")
async def ingest_scada(payload: Payload, db: AsyncSession = Depends(get_session)):
    """
    Ingest SCADA/telemetry messages.

    - If 'alarm' is True OR value >= threshold, creates a Notice row.
    - Always preserves the raw message in Notice.meta (under 'raw').
    - No dependency on a non-existent Event model.
    """
    items = payload.items if isinstance(payload, ScadaBatch) else [payload]
    accepted = 0
    created_notices = 0

    for p in items:
        # compute simple breach condition
        breach = bool(p.alarm) or (
            p.value is not None and p.threshold is not None and p.value >= p.threshold
        )

        if breach:
            title = f"SCADA alarm: {p.tag}"
            units = f" {p.unit}" if p.unit else ""
            body = f"value={p.value}{units}".strip()

            n = Notice(
                # crew_id left None so it shows in general notices;
                # your mobile/web client can filter by site/asset via meta
                title=title,
                body=body,
                meta={
                    "source": p.source or "scada",
                    "tag": p.tag,
                    "value": p.value,
                    "unit": p.unit,
                    "threshold": p.threshold,
                    "alarm": True,
                    "site_id": p.site_id,
                    "asset_id": p.asset_id,
                    "raw": p.dict(),
                },
                created_at=p.ts or utcnow(),
            )
            db.add(n)
            created_notices += 1

        accepted += 1

    await db.commit()
    return {"accepted": accepted, "notices_created": created_notices}
