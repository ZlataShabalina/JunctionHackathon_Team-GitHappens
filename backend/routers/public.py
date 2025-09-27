from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_session
import models, schemas

router = APIRouter(tags=["public"])

@router.post("/feedback")
async def submit_feedback(payload: schemas.FeedbackIn, db: AsyncSession = Depends(get_session)):
    fb = models.Feedback(**payload.model_dump())
    db.add(fb)
    await db.commit()
    return {"ok": True, "id": fb.id}

@router.post("/service_requests")
async def submit_service_request(payload: schemas.ServiceRequestIn, db: AsyncSession = Depends(get_session)):
    sr = models.ServiceRequest(**payload.model_dump())
    db.add(sr)
    await db.commit()
    return {"ok": True, "id": sr.id}
