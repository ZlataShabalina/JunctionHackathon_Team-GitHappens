from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from db import get_session
import models, schemas

router = APIRouter(prefix="/assets", tags=["assets"])

@router.post("", response_model=schemas.AssetOut)
async def create_asset(payload: schemas.AssetCreate, db: AsyncSession = Depends(get_session)):
    exists = (await db.execute(select(models.Asset).where(models.Asset.id == payload.id))).scalar_one_or_none()
    if exists:
        raise HTTPException(400, "Asset id already exists")
    asset = models.Asset(**payload.model_dump())
    db.add(asset)
    await db.commit()
    return schemas.AssetOut.model_validate(asset)

@router.get("/{asset_id}", response_model=schemas.AssetOut)
async def get_asset(asset_id: str, db: AsyncSession = Depends(get_session)):
    asset = (await db.execute(select(models.Asset).where(models.Asset.id == asset_id))).scalar_one_or_none()
    if not asset:
        raise HTTPException(404, "Asset not found")
    return schemas.AssetOut.model_validate(asset)

@router.patch("/{asset_id}", response_model=schemas.AssetOut)
async def update_asset(asset_id: str, payload: schemas.AssetUpdate, db: AsyncSession = Depends(get_session)):
    asset = (await db.execute(select(models.Asset).where(models.Asset.id == asset_id))).scalar_one_or_none()
    if not asset:
        raise HTTPException(404, "Asset not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(asset, k, v)
    await db.commit()
    return schemas.AssetOut.model_validate(asset)

@router.get("")
async def list_assets(site_id: Optional[str] = None, status: Optional[str] = None, type: Optional[str] = None,
                      db: AsyncSession = Depends(get_session)):
    q = select(models.Asset)
    if site_id:
        q = q.where(models.Asset.site_id == site_id)
    if status:
        q = q.where(models.Asset.status == status)
    if type:
        q = q.where(models.Asset.type == type)
    items = (await db.execute(q)).scalars().all()
    return {"items": [schemas.AssetOut.model_validate(a).model_dump() for a in items]}
