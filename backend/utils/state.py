import asyncio
from typing import Any, Dict, Set

class SSEBroker:
    def __init__(self) -> None:
        self._clients: Set[asyncio.Queue] = set()

    def connect(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._clients.add(q)
        return q

    def disconnect(self, q: asyncio.Queue) -> None:
        self._clients.discard(q)

    async def publish(self, event: str, data: Dict[str, Any]) -> None:
        for q in list(self._clients):
            await q.put({"event": event, "data": data})

broker = SSEBroker()