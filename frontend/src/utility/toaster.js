import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

let toastId = 0;

const timeSince = (timestamp) => {
  const now = Date.now();
  const secondsPast = Math.floor((now - timestamp) / 1000);

  if (secondsPast < 60) {
    return `${secondsPast}с назад`;
  }
  if (secondsPast < 3600) {
    const minutes = Math.floor(secondsPast / 60);
    return `${minutes}мин ${minutes === 1 ? '' : 'с'} назад`;
  }
  const hours = Math.floor(secondsPast / 3600);
  return `${hours}ч ${hours === 1 ? '' : 'с'} назад`;
};

export default function Toaster() {
   const [toasts, setToasts] = useState([]);


  const addToast = ({ title, message, variant = 'info', delay = 5000 }) => {
    setToasts((prev) => [
      ...prev,
      { id: toastId++, title, message, variant, delay, show: true, timestamp: Date.now() },
    ]);
    
    //toasts[toasts.length - 1].show = true; // Add intro animation
  };

  const closeToast = (id) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, show: false } : toast
      )
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 400);
  };

  // Update toast time
  useEffect(() => {
    const interval = setInterval(() => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.show ? { ...toast, timestamp: toast.timestamp } : toast
        )
      );
    }, 1000); // Обновляем каждую секунду

    // Очистка интервала при размонтировании
    return () => clearInterval(interval);
  }, []);

  // Экспортируем функцию добавления уведомления через window для глобального доступа
  useEffect(() => {
    window.addNotification = addToast;
    return () => {
      delete window.addNotification;
    };
  }, []);

  return (
    <Row>
      <Col xs={12}>
        <ToastContainer position="bottom-end" className="p-3">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              onClose={() => closeToast(toast.id)}
              show={toast.show}
              delay={toast.delay}
              autohide
              bg={toast.variant}
            >
              <Toast.Header>
                <img
                  src="holder.js/20x20?text=%20"
                  className="rounded me-2"
                  alt=""
                />
                <strong className="me-auto">{toast.title}</strong>
                <small>{timeSince(toast.timestamp)}</small>
              </Toast.Header>
              <Toast.Body>{toast.message}</Toast.Body>
            </Toast>
          ))}
        </ToastContainer>
      </Col>
    </Row>
  );
};

