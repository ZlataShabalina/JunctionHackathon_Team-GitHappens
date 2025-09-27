from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional, List
from db import get_session
from config import settings
import models, schemas
from utils.gis import parse_bbox, within_bbox
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/crew", tags=["crew"])

@router.post("", response_model=schemas.CrewOut)
async def create_crew(payload: schemas.CrewCreate, db: AsyncSession = Depends(get_session)):
    exists = (await db.execute(select(models.Crew).where(models.Crew.id == payload.id))).scalar_one_or_none()
    if exists:
        raise HTTPException(400, "Crew id already exists")
    crew = models.Crew(**payload.model_dump())
    db.add(crew)
    await db.commit()
    return schemas.CrewOut.model_validate(crew)

@router.get("", response_model=List[schemas.CrewOut])
async def list_crew(
    bbox: Optional[str] = Query(default=None, description="minLon,minLat,maxLon,maxLat"),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_session)
):
    items = (await db.execute(select(models.Crew))).scalars().all()
    if status:
        items = [c for c in items if c.status == status]
    if bbox:
        bb = parse_bbox(bbox)
        items = [c for c in items if c.last_lat is not None and within_bbox(c.last_lat, c.last_lon, bb)]
    return [schemas.CrewOut.model_validate(c) for c in items]

@router.get("/{crew_id}", response_model=schemas.CrewOut)
async def get_crew(crew_id: str, db: AsyncSession = Depends(get_session)):
    c = (await db.execute(select(models.Crew).where(models.Crew.id == crew_id))).scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Crew not found")
    return schemas.CrewOut.model_validate(c)

# Mobile app / GPS update (simple API key)
@router.post("/position")
async def post_position(
    payload: schemas.CrewPositionIn,
    db: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(default=None)
):
    if x_api_key != settings.MOBILE_API_KEY:
        raise HTTPException(401, "Invalid API key")

    c = (await db.execute(select(models.Crew).where(models.Crew.id == payload.crew_id))).scalar_one_or_none()
    if not c:
        # create on first contact? choose one — here we require pre-create
        raise HTTPException(400, "Unknown crew_id")

    # insert track point
    pt = models.CrewPosition(
        crew_id=payload.crew_id,
        lat=payload.lat, lon=payload.lon,
        speed=payload.speed, heading=payload.heading
    )
    db.add(pt)

    # update crew last_* and optional status
    c.last_lat, c.last_lon = payload.lat, payload.lon
    c.last_seen_at = datetime.now(timezone.utc)
    if payload.status:
        c.status = payload.status

    await db.commit()
    return {"ok": True}

@router.get("/{crew_id}/track", response_model=schemas.CrewTrackOut)
async def get_track(
    crew_id: str,
    minutes: int = 60,
    limit: int = 500,
    db: AsyncSession = Depends(get_session)
):
    c = (await db.execute(select(models.Crew).where(models.Crew.id == crew_id))).scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Crew not found")

    since = datetime.now(timezone.utc) - timedelta(minutes=max(1, minutes))
    q = (
        select(models.CrewPosition)
        .where(models.CrewPosition.crew_id == crew_id, models.CrewPosition.ts >= since)
        .order_by(desc(models.CrewPosition.ts))
        .limit(limit)
    )
    pts = (await db.execute(q)).scalars().all()
    # reverse to chronological order for polylines
    pts = list(reversed(pts))

    return schemas.CrewTrackOut(
        crew=schemas.CrewOut.model_validate(c),
        points=[schemas.CrewTrackPoint(ts=p.ts, lat=p.lat, lon=p.lon, speed=p.speed, heading=p.heading) for p in pts]
    )
