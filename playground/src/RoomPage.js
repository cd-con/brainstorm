import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const RoomPage = () => {
  const { roomId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate(`/auth?redirect=/room/${roomId}`);
      return;
    }

    const newSocket = io('http://localhost:6943', { query: { token } });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join', { room_id: roomId, password });
      newSocket.on('login_required', () => {
        setPasswordRequired(true);
      });

      newSocket.on('sync', ({ data }) => {
        setRoomData(data);
      });

      newSocket.on('error', (msg) => {
        setError(msg);
      });

      newSocket.on('disconnect', () => {
        if (!roomData) setError('Не удалось присоединиться к комнате');
      });
    });

    return () => newSocket.disconnect();
  }, [token, roomId, navigate]);

  const handleJoin = () => {
    if (socket) {
      socket.emit('password', { room_id: roomId, password });
      setError('Пароль некорректен');
    }
  };

  if (!token) return null;

  if (roomData) {
    return <Typography sx={{ p: 4 }}>Содержимое комнаты: {JSON.stringify(roomData)}</Typography>;
  }

  return (
     <Box sx={{ p: 4, width: 800, mx: 'auto' }}>
      {passwordRequired && (
        <Dialog open={passwordRequired} disableEscapeKeyDown>
          <DialogTitle>Введи пароль комнаты</DialogTitle>
          <DialogContent>
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            <TextField
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => navigate('/')} variant="outlined">Отмена</Button>
            <Button onClick={handleJoin} variant="contained">Отправить</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default RoomPage;