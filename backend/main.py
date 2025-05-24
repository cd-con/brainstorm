from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Dict, List
from pydantic import BaseModel, EmailStr, validator
import json
import os
import base64
from uuid import uuid4
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import uvicorn
import socketio

# Initialize FastAPI and Socket.IO
from starlette.middleware.cors import CORSMiddleware

app = FastAPI()
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*"
)
app.mount('/socket.io', socketio.ASGIApp(sio))

# Static files setup
os.makedirs("static/images", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# JWT Configuration
SECRET_KEY = "i-hate-rgb-0-0-0-people"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Storage class
class Storage:
    def __init__(self):
        self.users: Dict[str, dict] = {}
        self.rooms: Dict[str, dict] = {}
        self.canvas: Dict[str, dict] = {}
        self.locked_objects: Dict[str, str] = {}
        self.clients: Dict[str, str] = {}  # Maps client_id to sid

storage = Storage()

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    ppic: str = ""

    @validator('password')
    def password_length(cls, v):
        if len(v) < 6:
            raise ValueError('password must be at least 6 characters long')
        return v

    @validator('username')
    def username_not_empty(cls, v):
        if not v.strip():
            raise ValueError('username cannot be empty')
        return v

class User(BaseModel):
    email: str
    username: str
    ppic: str
    rooms: List[dict]

class RoomCreate(BaseModel):
    name: str

class ImageUpload(BaseModel):
    dataUrl: str

# JWT Functions
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

# Authentication Endpoints
@app.post("/auth/register")
async def register(user: UserCreate):
    try:
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
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

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
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"success": True}

@app.get("/users/profile", response_model=User)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "email": current_user["email"],
        "username": current_user["username"],
        "ppic": current_user["ppic"],
        "rooms": [
            {"id": room_id, "name": room_data["name"], "isOwner": room_data["owner_email"] == current_user["email"]}
            for room_id, room_data in storage.rooms.items()
            if room_id in storage.users[current_user["email"]]["rooms"]
        ]
    }

# Room Management
@app.post("/rooms")
async def create_room(room: RoomCreate, current_user: dict = Depends(get_current_user)):
    room_id = f"room-{uuid4()}"
    storage.rooms[room_id] = {
        "name": room.name,
        "owner_email": current_user["email"],
        "members": [current_user["email"]]
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
    for user_email in storage.users:
        storage.users[user_email]["rooms"] = [
            r for r in storage.users[user_email]["rooms"] if r != room_id
        ]
    if room_id in storage.canvas:
        del storage.canvas[room_id]
    return {"success": True}

# Image Upload
@app.post("/images/{image_id}")
async def upload_image(image_id: str, image: ImageUpload, current_user: dict = Depends(get_current_user)):
    try:
        img_data = base64.b64decode(image.dataUrl.split(",")[1])
        img_path = f"static/images/{image_id}.png"
        with open(img_path, "wb") as f:
            f.write(img_data)
        return {"success": True, "url": f"/static/images/{image_id}.png"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to upload image: {str(e)}")

# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ):
    token = environ.get('HTTP_TOKEN') or environ.get('QUERY_STRING', '').split('token=')[1] if 'token=' in environ.get('QUERY_STRING', '') else None
    if not token:
        await sio.disconnect(sid)
        return False

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email not in storage.users:
            await sio.disconnect(sid)
            return False
        # Store token in session for later use
        await sio.save_session(sid, {'token': token})
    except JWTError:
        await sio.disconnect(sid)
        return False

    client_id = str(uuid4())
    storage.clients[client_id] = sid
    print(f"Client {client_id} connected with SID {sid}")
    return True

@sio.event
async def join(sid, data):
    room_id = data.get('room_id')
    if not room_id:
        await sio.emit('error', {'error': 'No room_id provided'}, to=sid)
        return

    # Find user email from token
    token = (await sio.get_session(sid)).get('token')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        await sio.disconnect(sid)
        return

    if room_id not in storage.rooms or email not in storage.rooms[room_id]["members"]:
        await sio.emit('error', {'error': 'Invalid room or not a member'}, to=sid)
        return

    sio.enter_room(sid, room_id)
    if room_id in storage.canvas:
        await sio.emit('init', {
            "type": "init",
            "room_id": room_id,
            "data": storage.canvas[room_id]
        }, to=sid)
    print(f"Client {sid} joined room {room_id}")

@sio.event
async def message(sid, message):
    room_id = message.get("room_id")
    client_id = next((cid for cid, s in storage.clients.items() if s == sid), None)
    if not client_id:
        await sio.emit('error', {'error': 'Client not found'}, to=sid)
        return

    # Validate user and room
    token = (await sio.get_session(sid)).get('token')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        await sio.disconnect(sid)
        return

    if room_id not in storage.rooms or email not in storage.rooms[room_id]["members"]:
        await sio.emit('error', {'error': 'Invalid room or not a member'}, to=sid)
        return

    print(f"MESSAGE -> {message['type']}")
    if message["type"] in ["line", "text", "image"]:
        object_type = message["type"]
        element_id = message["id"]
        properties = message.get("properties")
        object_key = f"{object_type}-{element_id}"

        if properties is None:
            storage_type = {
                "line": storage.canvas[room_id]["lines"],
                "text": storage.canvas[room_id]["texts"],
                "image": storage.canvas[room_id]["images"]
            }[object_type]
            storage_type[:] = [e for e in storage_type if e["id"] != element_id]
            if object_key in storage.locked_objects:
                del storage.locked_objects[object_key]

            await sio.emit('message', {
                "type": object_type,
                "id": element_id,
                "properties": None,
                "success": True
            }, to=sid)

            await sio.emit('message', {
                "type": object_type,
                "id": element_id,
                "room_id": room_id,
                "properties": None
            }, room=room_id, skip_sid=sid)

        else:
            if object_key not in storage.locked_objects or storage.locked_objects[object_key] == client_id:
                storage_type = {
                    "line": storage.canvas[room_id]["lines"],
                    "text": storage.canvas[room_id]["texts"],
                    "image": storage.canvas[room_id]["images"]
                }[object_type]

                for i, element in enumerate(storage_type):
                    if element["id"] == element_id:
                        storage_type[i] = {"id": element_id, "properties": properties}
                        break
                else:
                    storage_type.append({"id": element_id, "properties": properties})

                await sio.emit('message', {
                    "type": object_type,
                    "id": element_id,
                    "properties": properties,
                    "success": True
                }, to=sid)

                await sio.emit('message', {
                    "type": object_type,
                    "id": element_id,
                    "room_id": room_id,
                    "properties": properties
                }, room=room_id, skip_sid=sid)
            else:
                await sio.emit('message', {
                    "type": object_type,
                    "id": element_id,
                    "success": False,
                    "error": "Object is locked by another user"
                }, to=sid)

    elif message["type"] == "select":
        object_key = f"{message['type']}-{message['id']}"
        if object_key not in storage.locked_objects:
            storage.locked_objects[object_key] = client_id
            await sio.emit('message', {
                "type": "select",
                "id": message["id"],
                "objectType": message["type"],
                "canEdit": True
            }, to=sid)
        else:
            await sio.emit('message', {
                "type": "select",
                "id": message["id"],
                "objectType": message["type"],
                "canEdit": False
            }, to=sid)

    elif message["type"] == "deselect":
        object_key = f"{message['type']}-{message['id']}"
        if object_key in storage.locked_objects:
            del storage.locked_objects[object_key]

@sio.event
async def disconnect(sid):
    client_id = next((cid for cid, s in storage.clients.items() if s == sid), None)
    if client_id:
        del storage.clients[client_id]
        storage.locked_objects = {
            k: v for k, v in storage.locked_objects.items()
            if v != client_id
        }
    print(f"Client {sid} disconnected")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=6943)