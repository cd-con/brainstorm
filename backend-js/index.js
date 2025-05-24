const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors({ origin: '*' }));
app.use(express.json());

const SECRET_KEY = 'i-hate-rgb-0-0-0-people';
const users = {};
const rooms = {};
const canvas = {};

const createToken = (email) => jwt.sign({ sub: email }, SECRET_KEY, { expiresIn: '30m' });

app.post('/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) return res.status(400).json({ error: 'Missing fields' });
    if (users[email]) return res.status(400).json({ error: 'Email already registered' });

    users[email] = {
      email,
      username,
      password: await bcrypt.hash(password, 10),
      rooms: []
    };
    res.json({ token: createToken(email) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users[email];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ token: createToken(email) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/users/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { sub: email } = jwt.verify(token, SECRET_KEY);
    const user = users[email];
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    res.json({
      email,
      username: user.username,
      rooms: user.rooms.map(id => ({
        id,
        name: rooms[id]?.name,
        isOwner: rooms[id]?.owner === email
      }))
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/rooms', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { sub: email } = jwt.verify(token, SECRET_KEY);
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Room name required' });

    const roomId = `room-${uuidv4()}`;
    rooms[roomId] = { name, owner: email, members: [email] };
    users[email].rooms.push(roomId);
    canvas[roomId] = { lines: [], texts: [], images: [] };
    res.json({ id: roomId, name, isOwner: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.delete('/rooms/:roomId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { sub: email } = jwt.verify(token, SECRET_KEY);
    const { roomId } = req.params;

    if (!rooms[roomId]) return res.status(404).json({ error: 'Room not found' });
    if (rooms[roomId].owner !== email) return res.status(403).json({ error: 'Not room owner' });

    delete rooms[roomId];
    delete canvas[roomId];
    for (const userEmail in users) {
      users[userEmail].rooms = users[userEmail].rooms.filter(id => id !== roomId);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

io.on('connection', (socket) => {
  const token = socket.handshake.query.token;
  let email;

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    email = payload.sub;
    if (!users[email]) throw new Error('User not found');
  } catch (error) {
    socket.disconnect();
    return;
  }

  socket.on('join', ({ room_id }) => {
    if (!rooms[room_id] || !rooms[room_id].members.includes(email)) {
      socket.emit('error', { error: 'Invalid room or not a member' });
      return;
    }

    socket.join(room_id);
    socket.emit('sync', { room_id, data: canvas[room_id] });
  });

  socket.on('message', ({ room_id, type, id, properties }) => {
    if (!rooms[room_id] || !rooms[room_id].members.includes(email)) return;

    const storageType = canvas[room_id][{ line: 'lines', text: 'texts', image: 'images' }[type]];
    if (properties === null) {
      storageType.splice(0, storageType.length, ...storageType.filter(e => e.id !== id));
    } else {
      const index = storageType.findIndex(e => e.id === id);
      if (index !== -1) {
        storageType[index] = { id, properties };
      } else {
        storageType.push({ id, properties });
      }
    }

    socket.emit('message', { type, id, properties, success: true });
    socket.to(room_id).emit('message', { type, id, room_id, properties });
  });
});

server.listen(6943, () => console.log('Server running on http://localhost:6943'));