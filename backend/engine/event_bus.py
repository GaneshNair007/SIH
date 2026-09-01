import asyncio
import json
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, Any, List

class RealtimeEventBus:
    """
    In-memory Async Event Bus for Server-Sent Events (SSE).
    Broadcasts real-time shift check-ins, optical scan completions,
    and Tier 3 emergency safety alerts to manager control rooms.
    """
    def __init__(self):
        self._subscribers: List[asyncio.Queue] = []

    async def subscribe(self) -> AsyncGenerator[str, None]:
        q = asyncio.Queue()
        self._subscribers.append(q)
        try:
            # Yield initial connection confirmation heartbeat
            init_msg = {
                "event": "connected",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": "Connected to Rakshak Real-Time Refinery Event Stream"
            }
            yield f"data: {json.dumps(init_msg)}\n\n"
            
            while True:
                data = await q.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if q in self._subscribers:
                self._subscribers.remove(q)

    async def publish(self, event_type: str, payload: Dict[str, Any]):
        msg = {
            "event": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload
        }
        for q in list(self._subscribers):
            try:
                q.put_nowait(msg)
            except Exception:
                pass

    def publish_sync(self, event_type: str, payload: Dict[str, Any]):
        """Synchronous wrapper to publish from standard synchronous route handlers."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.publish(event_type, payload))
            else:
                loop.run_until_complete(self.publish(event_type, payload))
        except Exception:
            pass

# Global Singleton Event Bus
event_bus = RealtimeEventBus()
