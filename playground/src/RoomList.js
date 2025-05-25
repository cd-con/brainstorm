import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Checkbox } from '@mui/material';
import { getPublicRooms } from './api';
import { useAuth } from './AuthContext';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const { token, user } = useAuth();

  useEffect(() => {
    if (rooms.length === 0) {
      getPublicRooms(token)
        .then((data) => setRooms(Array.isArray(data) ? data : [data]))
        .catch((err) => setError(err.message));
    }
  }, [token, rooms]);

  const handleCreateRoom = async () => {
    try {
      const response = await fetch('http://localhost:6943/api/create/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          owner: user.uuid,
          name: roomName,
          isPublic,
          password: password || null,
        }),
      });
      if (!response.ok) throw new Error('Не удалось создать комнату');
      setOpenCreateDialog(false);
      setRoomName('');
      setIsPublic(true);
      setPassword('');
      getPublicRooms(token)
        .then((data) => setRooms(Array.isArray(data) ? data : [data]))
        .catch((err) => setError(err.message));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Публичные комнаты</Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenCreateDialog(true)}
        sx={{ mb: 3, px: 4, py: 1.5, fontSize: '1.1rem' }}
      >
        Создать комнату
      </Button>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {rooms.map((room) => (
          <Button
            key={room.uuid}
            component={Link}
            to={`/room/${room.uuid}`}
            variant="outlined"
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              fontSize: '1rem',
              py: 1.5,
              px: 3,
              borderRadius: '8px',
              borderColor: 'grey.300',
              '&:hover': {
                bgcolor: 'primary.light',
                borderColor: 'primary.main',
                color: 'primary.contrastText',
              },
            }}
          >
            <Typography>
              {room.password ? '🔐 ' : '🌎 '} {room.name}
            </Typography>
          </Button>
        ))}
      </Box>
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Создать новую комнату</DialogTitle>
        <DialogContent>
          <TextField
            label="Название комнаты"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            fullWidth
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControlLabel
            control={<Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
            label="Публичная комната"
          />
          <TextField
            label="Пароль (опционально)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} variant="outlined">Отмена</Button>
          <Button onClick={handleCreateRoom} variant="contained" disabled={!roomName}>Создать</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoomList;