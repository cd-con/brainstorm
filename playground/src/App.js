import logo from './logo.svg';
import './App.css';

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import MainPage from './MainPage';
import AuthForm from './AuthForm';
import RoomPage from './RoomPage';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
