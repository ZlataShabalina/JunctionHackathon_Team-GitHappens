from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_session
import models, schemas
from pydantic import BaseModel
from db import get_session
from models import Crew, CrewPosition


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

# routers/public.py (or crew.py)
router = APIRouter(prefix="/crew", tags=["crew"])

class CrewUpsert(BaseModel):
  id: str
  name: str | None = None
  status: str | None = "on_duty"

@router.post("")
async def upsert_crew(body: CrewUpsert, db: AsyncSession = Depends(get_session)):
  crew = await db.get(Crew, body.id)
  if crew:
    crew.name = body.name or crew.name
    crew.status = body.status or crew.status
  else:
    crew = Crew(id=body.id, name=body.name or body.id, status=body.status or "on_duty")
    db.add(crew)
  await db.commit()
  return {"ok": True, "id": crew.id}

