import asyncio
from typing import Set, Dict, Any, Optional
import json
import logging
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

class ActiveListener:
    def __init__(self, user_id: Optional[int], username: str, avatar_url: Optional[str], is_guest: bool = False):
        self.id = str(uuid.uuid4())
        self.user_id = user_id
        self.username = username
        self.avatar_url = avatar_url
        self.is_guest = is_guest
        self.last_seen = datetime.now()
        self.is_playing = False

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "avatar_url": self.avatar_url,
            "is_guest": self.is_guest,
            "is_playing": self.is_playing
        }

class EventBroadcaster:
    def __init__(self):
        self.connections: Set[asyncio.Queue] = set()
        self.active_listeners: Dict[str, ActiveListener] = {}
        self.user_id_to_listener_id: Dict[int, str] = {}
    
    async def connect(self) -> asyncio.Queue:
        queue = asyncio.Queue()
        self.connections.add(queue)
        logger.info(f"New SSE connection. Total connections: {len(self.connections)}")
        return queue
    
    def disconnect(self, queue: asyncio.Queue):
        self.connections.discard(queue)
        logger.info(f"SSE connection closed. Total connections: {len(self.connections)}")
    
    def register_listener(self, user_id: Optional[int], username: str, avatar_url: Optional[str], is_guest: bool = False) -> str:
        if not is_guest and user_id is not None:
            if user_id in self.user_id_to_listener_id:
                existing_listener_id = self.user_id_to_listener_id[user_id]
                if existing_listener_id in self.active_listeners:
                    existing_listener = self.active_listeners[existing_listener_id]
                    existing_listener.last_seen = datetime.now()
                    existing_listener.username = username
                    existing_listener.avatar_url = avatar_url
                    return existing_listener_id
        
        listener = ActiveListener(user_id, username, avatar_url, is_guest)
        self.active_listeners[listener.id] = listener
        
        if not is_guest and user_id is not None:
            self.user_id_to_listener_id[user_id] = listener.id
        
        self._cleanup_inactive()
        return listener.id
    
    def unregister_listener(self, listener_id: str):
        if listener_id in self.active_listeners:
            listener = self.active_listeners[listener_id]
            if not listener.is_guest and listener.user_id is not None:
                self.user_id_to_listener_id.pop(listener.user_id, None)
            del self.active_listeners[listener_id]
    
    def update_listener_activity(self, listener_id: str):
        if listener_id in self.active_listeners:
            self.active_listeners[listener_id].last_seen = datetime.now()
            self._cleanup_inactive()
    
    def update_listener_playing_state(self, listener_id: str, is_playing: bool):
        if listener_id in self.active_listeners:
            self.active_listeners[listener_id].is_playing = is_playing
            self.active_listeners[listener_id].last_seen = datetime.now()
    
    def _cleanup_inactive(self):
        now = datetime.now()
        inactive_threshold = timedelta(minutes=5)
        inactive_ids = [
            lid for lid, listener in self.active_listeners.items()
            if now - listener.last_seen > inactive_threshold
        ]
        for lid in inactive_ids:
            listener = self.active_listeners.get(lid)
            if listener and not listener.is_guest and listener.user_id is not None:
                self.user_id_to_listener_id.pop(listener.user_id, None)
            del self.active_listeners[lid]
    
    def get_active_listeners(self) -> list:
        self._cleanup_inactive()
        return [listener.to_dict() for listener in self.active_listeners.values()]
    
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




