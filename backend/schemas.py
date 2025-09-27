from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

# ----- Sites -----
class SiteCreate(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    address: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    address: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None

class SiteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    lat: float
    lon: float
    address: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None

# ----- Assets -----
class AssetCreate(BaseModel):
    id: str
    site_id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = "unknown"
    meta: Optional[Dict[str, Any]] = None

class AssetUpdate(BaseModel):
    site_id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None

class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    site_id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    status: str
    last_seen_at: Optional[datetime] = None
    meta: Optional[Dict[str, Any]] = None

# ----- Notices -----
class NoticeCreate(BaseModel):
    site_id: Optional[str] = None
    asset_id: Optional[str] = None
    kind: str
    title: str
    description: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None

class NoticeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    site_id: Optional[str]
    asset_id: Optional[str]
    kind: str
    title: str
    description: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    created_at: datetime

# ----- Work Orders -----
class WorkOrderCreate(BaseModel):
    site_id: str
    asset_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: str = "normal"
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    assigned_to: Optional[str] = None

class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None

class WorkOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    site_id: str
    asset_id: Optional[str]
    title: str
    description: Optional[str]
    priority: str
    scheduled_start: Optional[datetime]
    scheduled_end: Optional[datetime]
    status: str
    assigned_to: Optional[str]
    created_at: datetime
    updated_at: datetime

# ----- Customer Input -----
class FeedbackIn(BaseModel):
    site_id: Optional[str] = None
    asset_id: Optional[str] = None
    message: str
    contact: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)

class ServiceRequestIn(BaseModel):
    site_id: Optional[str] = None
    asset_id: Optional[str] = None
    category: str
    message: str
    contact: Optional[str] = None
