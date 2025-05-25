import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, TextField, Button, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { createUser, getToken } from './api';
import { useAuth } from './AuthContext';

const AuthForm = () => {
  const [name, setName] = useState('');
  const [agreeTOS, setAgreeTOS] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!agreeTOS) {
      setError('Ты должен согласиться с условиями использования');
      return;
    }
    try {
      const userData = await createUser(name);
      const { token } = await getToken(userData.uuid);
      login(token, userData);
      const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';
      navigate(redirectTo);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 4 }}>Введи свои данные</Typography>
      <TextField
        label="Имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        sx={{ mb: 4 }}
      />
      <FormControlLabel
        control={<Checkbox checked={agreeTOS} onChange={(e) => setAgreeTOS(e.target.checked)} />}
        label="Я прочитал и согласен с условиями использования"
      />
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      <Button onClick={handleSubmit} variant="contained" sx={{ mt: 4 }}>Отправить</Button>
    </Box>
  );
};

export default AuthForm;