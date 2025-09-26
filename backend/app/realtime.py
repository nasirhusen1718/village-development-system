# backend/app/realtime.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from jose import jwt
from . import auth

ws_router = APIRouter()

class SectorConnectionManager:
    def __init__(self):
        self.sector_clients = {}  # sector -> set[WebSocket]
        self.lock = asyncio.Lock()

    async def connect(self, sector: str, websocket: WebSocket):
        async with self.lock:
            if sector not in self.sector_clients:
                self.sector_clients[sector] = set()
            self.sector_clients[sector].add(websocket)

    async def disconnect(self, sector: str, websocket: WebSocket):
        async with self.lock:
            try:
                self.sector_clients.get(sector, set()).discard(websocket)
            except Exception:
                pass

    async def broadcast(self, sector: str, message: dict):
        clients = list(self.sector_clients.get(sector, set()))
        to_remove = []
        for ws in clients:
            try:
                await ws.send_json(message)
            except Exception:
                to_remove.append(ws)
        if to_remove:
            async with self.lock:
                for ws in to_remove:
                    self.sector_clients.get(sector, set()).discard(ws)

_manager = SectorConnectionManager()

async def _broadcast(sector: str, payload: dict):
    await _manager.broadcast(sector, payload)

def notify_event(sector: str, payload: dict):
    try:
        asyncio.create_task(_broadcast(sector, payload))
    except RuntimeError:
        # No running loop
        pass

@ws_router.websocket("/ws/officer")
async def ws_officer(websocket: WebSocket):
    params = dict(websocket.query_params)
    token = params.get("token")
    sector = params.get("sector")
    if not token or not sector:
        await websocket.close(code=1008)
        return
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        role = payload.get("role")
        # For healthcare sector, only farmers can subscribe
        if sector == "healthcare":
            if role not in ("farmer", "user"):
                await websocket.close(code=1008)
                return
        else:
            if role not in ("officer", "admin"):
                await websocket.close(code=1008)
                return
    except Exception:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    await _manager.connect(sector, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await _manager.disconnect(sector, websocket)
