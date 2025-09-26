from datetime import datetime
from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class SensorReading(BaseModel):
    device_id: str
    asset_id: str
    metric: str               # e.g., "stress", "usage"
    value: float
    ts: datetime = Field(default_factory=datetime.utcnow)
    extras: Optional[Dict[str, Any]] = None

class RiskEvent(BaseModel):
    level: Literal["info", "warning", "critical"]
    reason: str
    reading: SensorReading