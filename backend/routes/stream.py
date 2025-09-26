# routes/stream.py
import asyncio, json
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from utils.state import broker

router = APIRouter(tags=["stream"])

@router.get("/events")
async def events(request: Request):
    q = broker.connect()
    async def gen():
        try:
            yield {"event": "ping", "data": "ready"}
            while True:
                if await request.is_disconnected():
                    break
                try:
                    item = await asyncio.wait_for(q.get(), timeout=15.0)
                    payload = item["data"]
                    if not isinstance(payload, str):
                        payload = json.dumps(payload)  # safe now (no datetimes)
                    yield {"event": item["event"], "data": payload}
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": "keepalive"}
        finally:
            broker.disconnect(q)

    return EventSourceResponse(
        gen(),
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
