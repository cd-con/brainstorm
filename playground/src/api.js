export const createUser = async (name) => {
  const response = await fetch('http://localhost:6943/api/create/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Не удалось создать пользователя');
  return await response.json();
};

export const getToken = async (uuid) => {
  const response = await fetch('http://localhost:6943/api/get/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uuid }),
  });
  if (!response.ok) throw new Error('Не удалось получить токен');
  return await response.json();
};

export const getUser = async (token) => {
  const response = await fetch('http://localhost:6943/api/get/user', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Не удалось получить пользователя');
  return await response.json();
};

export const getPublicRooms = async (token) => {
  const response = await fetch('http://localhost:6943/api/list/room', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Не удалось загрузить комнаты');
  return await response.json();
};