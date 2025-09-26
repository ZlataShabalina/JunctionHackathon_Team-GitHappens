import os, time, random, httpx, json
from datetime import datetime, timezone

WEBHOOK_URL = os.getenv("WEBHOOK_URL", "http://127.0.0.1:8000/webhooks/device")
TOKEN = os.getenv("WEBHOOK_TOKEN", "devtoken")

ASSETS = ["A-100", "A-200"]
METRICS = ["stress", "usage"]

def reading(asset_id: str, metric: str):
    return {
        "device_id": f"sim-{asset_id}",
        "asset_id": asset_id,
        "metric": metric,
        "value": round(random.uniform(30, 100), 2),
        "ts": datetime.now(timezone.utc).isoformat(),
        "extras": {"sim": True},
    }

with httpx.Client(timeout=5) as client:
    while True:
        a = random.choice(ASSETS)
        m = random.choice(METRICS)
        payload = reading(a, m)
        r = client.post(WEBHOOK_URL, content=json.dumps(payload),
                        headers={"x-webhook-token": TOKEN, "content-type": "application/json"})
        print(r.status_code, payload)
        time.sleep(1.0)