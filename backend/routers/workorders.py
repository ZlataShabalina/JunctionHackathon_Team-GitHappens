from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from db import get_session
import models, schemas

router = APIRouter(prefix="/workorders", tags=["workorders"])

@router.post("", response_model=schemas.WorkOrderOut)
async def create_work_order(payload: schemas.WorkOrderCreate, db: AsyncSession = Depends(get_session)):
    site = (await db.execute(select(models.Site).where(models.Site.id == payload.site_id))).scalar_one_or_none()
    if not site:
        raise HTTPException(400, "Unknown site_id")
    if payload.asset_id:
        asset = (await db.execute(select(models.Asset).where(models.Asset.id == payload.asset_id))).scalar_one_or_none()
        if not asset:
            raise HTTPException(400, "Unknown asset_id")
    wo = models.WorkOrder(**payload.model_dump())
    db.add(wo)
    await db.commit()
    return schemas.WorkOrderOut.model_validate(wo)

@router.get("/{wo_id}", response_model=schemas.WorkOrderOut)
async def get_work_order(wo_id: int, db: AsyncSession = Depends(get_session)):
    wo = (await db.execute(select(models.WorkOrder).where(models.WorkOrder.id == wo_id))).scalar_one_or_none()
    if not wo:
        raise HTTPException(404, "Work order not found")
    return schemas.WorkOrderOut.model_validate(wo)

@router.patch("/{wo_id}", response_model=schemas.WorkOrderOut)
async def update_work_order(wo_id: int, payload: schemas.WorkOrderUpdate, db: AsyncSession = Depends(get_session)):
    wo = (await db.execute(select(models.WorkOrder).where(models.WorkOrder.id == wo_id))).scalar_one_or_none()
    if not wo:
        raise HTTPException(404, "Work order not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(wo, k, v)
    await db.commit()
    return schemas.WorkOrderOut.model_validate(wo)

@router.get("")
async def list_work_orders(site_id: Optional[str] = None, status: Optional[str] = None, assigned_to: Optional[str] = None,
                           db: AsyncSession = Depends(get_session)):
    q = select(models.WorkOrder).order_by(desc(models.WorkOrder.created_at))
    if site_id:
        q = q.where(models.WorkOrder.site_id == site_id)
    if status:
        q = q.where(models.WorkOrder.status == status)
    if assigned_to:
        q = q.where(models.WorkOrder.assigned_to == assigned_to)
    items = (await db.execute(q)).scalars().all()
    return {"items": [schemas.WorkOrderOut.model_validate(w).model_dump() for w in items]}
