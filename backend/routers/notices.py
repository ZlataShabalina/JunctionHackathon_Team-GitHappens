
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from db import get_session
import models, schemas

router = APIRouter(prefix="/notices", tags=["notices"])

@router.post("", response_model=schemas.NoticeOut)
async def create_notice(payload: schemas.NoticeCreate, db: AsyncSession = Depends(get_session)):
    nt = models.Notice(**payload.model_dump())
    db.add(nt)
    await db.commit()
    return schemas.NoticeOut.model_validate(nt)

@router.get("")
async def list_notices(site_id: Optional[str] = None, asset_id: Optional[str] = None, kind: Optional[str] = None,
                       db: AsyncSession = Depends(get_session)):
    from sqlalchemy import and_
    q = select(models.Notice).order_by(desc(models.Notice.created_at))
    if site_id:
        q = q.where(models.Notice.site_id == site_id)
    if asset_id:
        q = q.where(models.Notice.asset_id == asset_id)
    if kind:
        q = q.where(models.Notice.kind == kind)
    items = (await db.execute(q)).scalars().all()
    return {"items": [schemas.NoticeOut.model_validate(n).model_dump() for n in items]}
