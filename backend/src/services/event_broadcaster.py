import asyncio
from typing import Set, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class EventBroadcaster:
    def __init__(self):
        self.connections: Set[asyncio.Queue] = set()
    
    async def connect(self) -> asyncio.Queue:
        queue = asyncio.Queue()
        self.connections.add(queue)
        logger.info(f"New SSE connection. Total connections: {len(self.connections)}")
        return queue
    
    def disconnect(self, queue: asyncio.Queue):
        self.connections.discard(queue)
        logger.info(f"SSE connection closed. Total connections: {len(self.connections)}")
    
    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        if not self.connections:
            return
        
        message = {
            "type": event_type,
            "data": data
        }
        message_json = json.dumps(message)
        
        disconnected = set()
        for queue in self.connections:
            try:
                await queue.put(f"data: {message_json}\n\n")
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected.add(queue)
        
        for queue in disconnected:
            self.connections.discard(queue)

event_broadcaster = EventBroadcaster()




