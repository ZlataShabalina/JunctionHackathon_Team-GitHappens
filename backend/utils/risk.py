from typing import Optional, Dict, Any
from models import SensorReading, RiskEvent

def check_risk(reading: SensorReading,
               thresholds: Dict[str, Dict[str, Dict[str, float]]]
               ) -> Optional[RiskEvent]:
    aset = thresholds.get(reading.asset_id, {})
    metric_thr = aset.get(reading.metric)
    if not metric_thr:
        return None

    warn, crit = metric_thr["warn"], metric_thr["crit"]
    if reading.value >= crit:
        return RiskEvent(level="critical", reason=f"{reading.metric} >= {crit}", reading=reading)
    if reading.value >= warn:
        return RiskEvent(level="warning", reason=f"{reading.metric} >= {warn}", reading=reading)
    return None
