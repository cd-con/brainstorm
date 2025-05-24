import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router";
import './index.css';
//import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import Toaster from './utility/toaster'
import Login from './pages/login';
import UserProfile from './pages/account';
import WorkArea from './pages/canvas/WorkArea';
import Register from './pages/register';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Toaster/>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="you" element={<UserProfile />} />
      <Route path="/:canvasId" element={<WorkArea/>} />
      <Route path="/register" element={<Register />} />
    </Routes>
  </BrowserRouter>
);

//reportWebVitals();
