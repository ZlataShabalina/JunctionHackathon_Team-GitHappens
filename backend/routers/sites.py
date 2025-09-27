from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from db import get_session
import models, schemas
from utils.gis import parse_bbox, within_bbox

router = APIRouter(prefix="/sites", tags=["sites"])

@router.post("", response_model=schemas.SiteOut)
async def create_site(payload: schemas.SiteCreate, db: AsyncSession = Depends(get_session)):
    exists = (await db.execute(select(models.Site).where(models.Site.id == payload.id))).scalar_one_or_none()
    if exists:
        raise HTTPException(400, "Site id already exists")
    site = models.Site(**payload.model_dump())
    db.add(site)
    await db.commit()
    return schemas.SiteOut.model_validate(site)

@router.get("", response_model=List[schemas.SiteOut])
async def list_sites(bbox: Optional[str] = Query(default=None, description="minLon,minLat,maxLon,maxLat"),
                     db: AsyncSession = Depends(get_session)):
    sites = (await db.execute(select(models.Site))).scalars().all()
    if bbox:
        bb = parse_bbox(bbox)
        sites = [s for s in sites if within_bbox(s.lat, s.lon, bb)]
    return [schemas.SiteOut.model_validate(s) for s in sites]

@router.get("/{site_id}", response_model=schemas.SiteOut)
async def get_site(site_id: str, db: AsyncSession = Depends(get_session)):
    site = (await db.execute(select(models.Site).where(models.Site.id == site_id))).scalar_one_or_none()
    if not site:
        raise HTTPException(404, "Site not found")
    return schemas.SiteOut.model_validate(site)

@router.patch("/{site_id}", response_model=schemas.SiteOut)
async def update_site(site_id: str, payload: schemas.SiteUpdate, db: AsyncSession = Depends(get_session)):
    site = (await db.execute(select(models.Site).where(models.Site.id == site_id))).scalar_one_or_none()
    if not site:
        raise HTTPException(404, "Site not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(site, k, v)
    await db.commit()
    return schemas.SiteOut.model_validate(site)

@router.get("/{site_id}/assets")
async def site_assets(site_id: str, db: AsyncSession = Depends(get_session)):
    assets = (await db.execute(select(models.Asset).where(models.Asset.site_id == site_id))).scalars().all()
    return {"items": [schemas.AssetOut.model_validate(a).model_dump() for a in assets]}
