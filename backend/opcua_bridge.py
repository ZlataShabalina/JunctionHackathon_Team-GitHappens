# opcua_bridge.py
import asyncio, requests
from asyncua import Client, ua
BASE = "http://localhost:8000"

async def run():
    async with Client("opc.tcp://scada-host:4840") as c:
        node = c.get_node("ns=2;i=1080")  # replace with your node id
        sub = await c.create_subscription(500, None)
        handle = await sub.subscribe_data_change(node)
        try:
            while True:
                data = await sub.__anext__()  # wait for next change
                val = data.monitored_item.Value.Value
                requests.post(f"{BASE}/ingest/scada", json={
                    "tag": "breaker_1080", "value": float(val),
                    "unit": "state", "site_id": "site-trondheim",
                    "alarm": bool(val == 1)
                })
        finally:
            await sub.unsubscribe(handle)
            await sub.delete()

asyncio.run(run())
