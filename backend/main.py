from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Dict, List
import json
import os
import base64
from uuid import uuid4
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import uvicorn

app = FastAPI()

# Mount static directory for images
os.makedirs("static/images", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# JWT Configuration
SECRET_KEY = "i-hate-rgb-0-0-0-people"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# In-memory storage
class Storage:
    def __init__(self):
        self.users: Dict[str, dict] = {}  # email: {password_hash, username, ppic, rooms}
        self.rooms: Dict[str, dict] = {}  # room_id: {name, owner_email}
        self.canvas: Dict[str, dict] = {}  # room_id: {lines, texts, images}
        self.locked_objects: Dict[str, str] = {}  # object_id: client_id
        self.clients: Dict[str, WebSocket] = {}  # client_id: websocket


storage = Storage()


# Models
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    ppic: str = ""


class User(BaseModel):
    email: str
    username: str
    ppic: str
    rooms: List[dict]


class RoomCreate(BaseModel):
    name: str


class CanvasElement(BaseModel):
    id: str
    properties: dict


class UpdateMessage(BaseModel):
    type: str
    id: str
    objectType: str
    data: dict


# JWT Helper Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None or email not in storage.users:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return storage.users[email]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


# Auth Endpoints
@app.post("/auth/register")
async def register(user: UserCreate):
    if user.email in storage.users:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    storage.users[user.email] = {
        "email": user.email,
        "username": user.username,
        "password_hash": hashed_password,
        "ppic": user.ppic,
        "rooms": []
    }

    token = create_access_token({"sub": user.email})
    return {"token": token}


@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = storage.users.get(form_data.username)
    if not user or not pwd_context.verify(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"sub": user["email"]})
    return {"token": token}


@app.post("/auth/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    token = create_access_token({"sub": current_user["email"]})
    return {"token": token}


@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"success": True}


@app.get("/auth/profile", response_model=User)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "email": current_user["email"],
        "username": current_user["username"],
        "ppic": current_user["ppic"],
        "rooms": [
            {"id": room_id, "name": room_data["name"], "isOwner": room_data["owner_email"] == current_user["email"]}
            for room_id, room_data in storage.rooms.items()
            if room_data["owner_email"] == current_user["email"]
        ]
    }


# Room Endpoints
@app.post("/rooms")
async def create_room(room: RoomCreate, current_user: dict = Depends(get_current_user)):
    room_id = f"room-uuid-{uuid4()}"
    storage.rooms[room_id] = {
        "name": room.name,
        "owner_email": current_user["email"]
    }
    storage.users[current_user["email"]]["rooms"].append(room_id)
    storage.canvas[room_id] = {"lines": [], "texts": [], "images": []}
    return {"id": room_id, "name": room.name, "isOwner": True}


@app.delete("/rooms/{room_id}")
async def delete_room(room_id: str, current_user: dict = Depends(get_current_user)):
    if room_id not in storage.rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    if storage.rooms[room_id]["owner_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not room owner")

    del storage.rooms[room_id]
    storage.users[current_user["email"]]["rooms"] = [
        r for r in storage.users[current_user["email"]]["rooms"] if r != room_id
    ]
    if room_id in storage.canvas:
        del storage.canvas[room_id]
    return {"success": True}


# WebSocket Endpoint
@app.websocket("/canvas/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email not in storage.users or room_id not in storage.rooms:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    client_id = str(uuid4())
    storage.clients[client_id] = websocket

    try:
        # Initialize canvas if not exists
        if room_id not in storage.canvas:
            storage.canvas[room_id] = {"lines": [], "texts": [], "images": []}

        # Send initial state
        await websocket.send_json({
            "type": "init",
            "data": storage.canvas[room_id]
        })

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "join":
                continue

            elif message["type"] == "select":
                object_key = f"{message['objectType']}-{message['id']}"
                if object_key not in storage.locked_objects:
                    storage.locked_objects[object_key] = client_id
                    await websocket.send_json({
                        "type": "select",
                        "id": message["id"],
                        "objectType": message["objectType"],
                        "canEdit": True
                    })
                else:
                    await websocket.send_json({
                        "type": "select",
                        "id": message["id"],
                        "objectType": message["objectType"],
                        "canEdit": False
                    })

            elif message["type"] == "deselect":
                object_key = f"{message['objectType']}-{message['id']}"
                if object_key in storage.locked_objects:
                    del storage.locked_objects[object_key]

            elif message["type"] == "update":
                object_type = message["objectType"]
                element_id = message["id"]
                object_key = f"{object_type}-{element_id}"

                if object_key not in storage.locked_objects or storage.locked_objects[object_key] == client_id:
                    storage_type = {
                        "line": storage.canvas[room_id]["lines"],
                        "text": storage.canvas[room_id]["texts"],
                        "image": storage.canvas[room_id]["images"]
                    }[object_type]

                    for i, element in enumerate(storage_type):
                        if element["id"] == element_id:
                            storage_type[i] = {"id": element_id, "properties": message["data"]}
                            break
                    else:
                        storage_type.append({"id": element_id, "properties": message["data"]})

                    await websocket.send_json({
                        "type": "update",
                        "id": element_id,
                        "objectType": object_type,
                        "success": True
                    })

                    for other_client_id, other_ws in storage.clients.items():
                        if other_client_id != client_id:
                            await other_ws.send_json({
                                "type": "update",
                                "id": element_id,
                                "objectType": object_type,
                                "data": message["data"]
                            })
                else:
                    await websocket.send_json({
                        "type": "update",
                        "id": element_id,
                        "objectType": object_type,
                        "success": False,
                        "error": "Object is locked by another user"
                    })

            elif message["type"] == "image":
                try:
                    img_data = base64.b64decode(message["base64"].split(",")[1])
                    img_id = message["id"]
                    img_path = f"static/images/{img_id}.png"

                    with open(img_path, "wb") as f:
                        f.write(img_data)

                    for i, img in enumerate(storage.canvas[room_id]["images"]):
                        if img["id"] == img_id:
                            storage.canvas[room_id]["images"][i] = {
                                "id": img_id,
                                "properties": {
                                    **img["properties"],
                                    "url": f"/static/images/{img_id}.png"
                                }
                            }
                            break
                    else:
                        storage.canvas[room_id]["images"].append({
                            "id": img_id,
                            "properties": {"url": f"/static/images/{img_id}.png"}
                        })

                    await websocket.send_json({
                        "type": "image",
                        "id": img_id,
                        "success": True,
                        "url": f"/static/images/{img_id}.png"
                    })

                    for other_client_id, other_ws in storage.clients.items():
                        if other_client_id != client_id:
                            await other_ws.send_json({
                                "type": "image",
                                "id": img_id,
                                "success": True,
                                "url": f"/static/images/{img_id}.png"
                            })

                except Exception as e:
                    await websocket.send_json({
                        "type": "image",
                        "id": message["id"],
                        "success": False,
                        "error": str(e)
                    })

    except WebSocketDisconnect:
        del storage.clients[client_id]
        storage.locked_objects = {
            k: v for k, v in storage.locked_objects.items()
            if v != client_id
        }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6942)