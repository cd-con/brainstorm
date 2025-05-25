const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');

const path = require('path');
require('dotenv').config( { path: path.join(__dirname, '.env') });

const cors = require('cors');
const { Component, User, Room } = require('./storage.js')

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors({ origin: '*' }));
app.use(express.json());


const users = [];
const rooms = [];

app.get('/', (req, res) => 
{
    // react app endpoint
});

app.get('/api/list/room', (req, res) =>
{
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token && jwt.verify(token, process.env.SECRET_KEY)) 
    {
        const publicRooms = rooms.filter((r) => r.isPublic === true) || [];
        return res.json(publicRooms);
    }
    
    return res.status(401);
});

app.get('/api/get/user', (req, res) =>
{
    const token = req.headers.authorization?.split(' ')[1];
    const userID = jwt.verify(token, process.env.SECRET_KEY).sub;
    
    if (token && userID) 
    {
        const user = users.find(u => u.uuid === userID);
        
        if (!user)
        {
            return res.status(422).json({});
        }

        return res.json(user);
    }

    return res.status(401).json({});
});

app.post('/api/create/room', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const owner = jwt.verify(token, process.env.SECRET_KEY);
    
    if (token && owner) 
        {
        const { name, isPublic, password} = req.body;
        const ownerInstance = users.find(u => u.uuid === owner.sub);

        if (!ownerInstance || !name)
        {
            return res.status(422).json({});
        }

        const newRoom = new Room(owner, name, isPublic, password);
        newRoom.AddUser(ownerInstance);
        rooms.push(newRoom)
        return res.status(200).json(newRoom);
    }

    return res.status(401).json({});
});

app.post('/api/create/user', (req, res) => {
    const { name } = req.body;
    const user = users.find(u => u.name === name);

    if (user)
    {
        return res.status(422);
    }
    const newUser = new User(name, [])
    users.push(newUser);
    return res.status(200).json(newUser)
});


app.post('/api/get/token', (req,res) => {
    const { uuid } = req.body;
    let user = users.find(u => u.uuid === uuid);

    if (!user) {
        return res.status(401);
    }

    res.json({ token: user.GetToken() });
});

app.post('/api/add/user', (req,res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token && jwt.verify(token, process.env.SECRET_KEY)) 
        {
        const { incoming, issued, room } = req.body;
        
        const issuedBy = users.find(u => u.uuid === issued);
        const newUser = users.find(u => u.uuid === incoming);

        if (!issuedBy)
        {
            return res.status(401);
        }

        const targetRoom = issuedBy.ownedRooms.find((r) => r.uuid === room);

        if (targetRoom){
            targetRoom.AddUser(newUser);
            return res.status(200);
        }
    }

    return res.status(401);
});


io.on('connection', (socket) => {
    const payload = jwt.verify(socket.handshake.query.token, process.env.SECRET_KEY);
    const userInstance = users.find((user) => user.uuid === payload.sub)

    if (!userInstance)
    {
        console.warn(`User ${payload.sub} was declined. Cause: user expired`);
        socket.disconnect();
        return;
    }

    socket.on('join', ({ room_id }) => {
        const roomInstance = rooms.find((room) => room.uuid === room_id);

        if (!roomInstance || (!roomInstance.isPublic && !roomInstance.HasUser(userInstance.uuid))) 
        {
            console.warn(`User ${userInstance.name} was declined in handshake. Cause: roomInstance = ${roomInstance == null} or user is not allowed`);
            socket.disconnect();
            return;
        }

        if (roomInstance.password){
            socket.emit('login_required', { room_id });
            return;
        }

        socket.join(room_id);
        socket.emit('sync', { room_id, data: roomInstance.components });
    });

    socket.on('password', ({room_id, password}) => {
         const roomInstance = rooms.find((room) => room.uuid === room_id);

        if (!roomInstance || (!roomInstance.isPublic && !roomInstance.HasUser(userInstance.uuid))) 
        {
            console.warn(`User ${userInstance.name} was declined in joining. Cause: roomInstance = ${roomInstance == null} or user is not allowed`);
            socket.disconnect();
            return;
        }

        if (roomInstance.password !== password){
            socket.emit('login_required', { room_id });
            return;
        }

        socket.join(room_id);
        socket.emit('sync', { room_id, data: roomInstance.components });
    });

    socket.on('add', ({ room_id, author, type, properties }) => {
        const roomInstance = rooms.find((room) => room.uuid === room_id);

        if (!roomInstance || !roomInstance.HasUser(userInstance.uuid)) 
        {
            console.warn(`User ${userInstance.name} was declined in process. Cause: roomInstance = ${roomInstance == null} or user is not allowed`);
            socket.disconnect();
            return;
        }

        const newComponent = new Component(room, author, type, properties);

        roomInstance.components.push(newComponent);
        socket.to(room_id).emit('add', { newComponent });
    });

    socket.on('delete', ({ room_id, author, componentId }) => {
        const roomInstance = rooms.find((room) => room.uuid === room_id);

        if (!roomInstance || !roomInstance.HasUser(userInstance.uuid)) 
        {
            console.warn(`User ${userInstance.name} was declined in process. Cause: roomInstance = ${roomInstance == null} or user is not allowed`);
            socket.disconnect();
            return;
        }

        if (roomInstance.RemoveComponent(componentId))
            socket.to(room_id).emit('remove', { componentId });
    });

    socket.on('update', ({ room_id, author, componentId, properties }) => {
        const roomInstance = rooms.find((room) => room.uuid === room_id);

        if (!roomInstance || !roomInstance.HasUser(userInstance.uuid)) 
        {
            console.warn(`User ${userInstance.name} was declined in process. Cause: roomInstance = ${roomInstance == null} or user is not allowed`);
            socket.disconnect();
            return;
        }

        const componentInstance = roomInstance.HasComponent(componentId)

        if (componentInstance)
        {
            componentInstance.properties = properties;
            roomInstance.components[componentInstance] = componentInstance;
            socket.to(room_id).emit('update', { componentInstance });
        }
    });
});

server.listen(6943, () => console.log('Server running on http://localhost:6943'));