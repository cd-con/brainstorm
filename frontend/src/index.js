import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router";
import './index.css';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import Toaster from './utility/toaster'
import Login from './pages/login';
import UserProfile from './pages/account';
import Canvas from './pages/drawing';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Toaster/>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="you" element={<UserProfile />} />
      <Route path="/canvas/:canvasId" element={<Canvas/>} />
    </Routes>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
