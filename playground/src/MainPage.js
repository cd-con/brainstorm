import React from 'react';
import { useAuth } from './AuthContext';
import RoomList from './RoomList';
import AuthForm from './AuthForm';

const MainPage = () => {
  const { token } = useAuth();
  return token ? <RoomList /> : <AuthForm />;
};

export default MainPage;