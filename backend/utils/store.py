from collections import defaultdict, deque
from typing import Deque, DefaultDict, List
from models import SensorReading

class Store:
    def __init__(self, maxlen: int = 5000):
        self._hist: DefaultDict[str, Deque[SensorReading]] = defaultdict(lambda: deque(maxlen=maxlen))

    def add_reading(self, r: SensorReading) -> None:
        self._hist[r.asset_id].append(r)

    def get_history(self, asset_id: str) -> List[SensorReading]:
        return list(self._hist[asset_id])

store = Store()