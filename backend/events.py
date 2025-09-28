import asyncio
from typing import AsyncIterator, Dict, Any, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect


router = APIRouter(prefix="/ws", tags=["ws"])

_connections: dict[str, set[WebSocket]] = {}

@router.websocket("/crew/{crew_id}")
async def ws_crew(websocket: WebSocket, crew_id: str):
    await websocket.accept()
    _connections.setdefault(crew_id, set()).add(websocket)
    try:
        while True:
            await websocket.receive_text()  # keepalive (ignore)
    except WebSocketDisconnect:
        _connections[crew_id].discard(websocket)

async def ws_push_to_crew(crew_id: str, payload: dict):
    for ws in list(_connections.get(crew_id, ())):
        try:
            await ws.send_json(payload)
        except Exception:
            _connections[crew_id].discard(ws)


class EventBroker:
    def __init__(self) -> None:
        self._subscribers: List[asyncio.Queue] = []
        self._lock = asyncio.Lock()

    async def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        async with self._lock:
            self._subscribers.append(q)
        return q

    async def unsubscribe(self, q: asyncio.Queue) -> None:
        async with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)

    async def publish(self, event: Dict[str, Any]) -> None:
        # fan-out non-blocking
        async with self._lock:
            subs = list(self._subscribers)
        for q in subs:
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                # drop if slow consumer
                pass

broker = EventBroker()

