import React, { createContext, useEffect, useRef, useState } from 'react';
import { iAmBusy } from '../../utility/utils';

export const WebSocketContext = createContext();

const WebSocketProvider = ({ children, setLines, setTexts, setImages, setSelectedId }) => {
  const wsRef = useRef(null);
  const [pendingSelect, setPendingSelect] = useState(null); // Track pending selection

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:6942/canvas'); // Replace with your WebSocket URL
    wsRef.current.addEventListener("error",  (e) => { window.addNotification({
        title: 'Ошибка синхронизации',
        message: "Произошла ошибка при попытке синхронизации данных!\n\nПожалуйста, обновите страницу и повторите попытку!",
        variant: 'warning',
        delay: 10000
    }); console.log(e)});

    wsRef.current.onopen = () => {
        wsRef.onError = (e) =>  window.addNotification({
          title: 'Подключено!',
          message: e,
          variant: 'info',
          delay: 5000
      });
      wsRef.current.send(JSON.stringify({ type: 'join' }));
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'init':
          setLines(message.data.lines || []);
          setTexts(message.data.texts || []);
          setImages(message.data.images || []);
          break;
        case 'select':
          if (message.canEdit) {
            setSelectedId(`${message.objectType}-${message.id}`);
            setPendingSelect(null);
          } else {
            iAmBusy(`Object ${message.objectType}-${message.id} is locked by another user`);
            setPendingSelect(null);
          }
          break;
        case 'update':
          if (!message.success) {
            iAmBusy(`Update failed: ${message.error}`);
            // Revert handled in individual handlers
          }
          break;
        case 'image':
          if (message.success) {
            setImages((prev) =>
              prev.map((img) =>
                img.id === message.id ? { ...img, image: null, url: message.url } : img
              )
            );
          } else {
            iAmBusy(`Image upload failed: ${message.error}`);
            setImages((prev) => prev.filter((img) => img.id !== message.id));
          }
          break;
        default:
          console.log('Unknown message:', message);
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [setLines, setTexts, setImages, setSelectedId]);

  const selectObject = (id, objectType, callback) => {
    setPendingSelect(`${objectType}-${id}`);
    wsRef.current.send(JSON.stringify({ type: 'select', id, objectType }));
    // Callback to proceed with selection if needed
    if (callback) callback();
  };

  const deselectObject = (id, objectType) => {
    wsRef.current.send(JSON.stringify({ type: 'deselect', id, objectType }));
    setSelectedId(null);
    setPendingSelect(null);
  };

  const syncUpdate = async (id, objectType, data, revertCallback) => {
    const response = await new Promise((resolve) => {
      wsRef.current.send(JSON.stringify({ type: 'update', id, objectType, data }));
      // Wait for server response (handled in onmessage)
      const handler = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'update' && message.id === id && message.objectType === objectType) {
          resolve(message);
          wsRef.current.removeEventListener('message', handler);
        }
      };
      wsRef.current.addEventListener('message', handler);
    });
    if (!response.success) {
      revertCallback();
    }
    return response;
  };

  const uploadImage = async (id, base64) => {
    wsRef.current.send(JSON.stringify({ type: 'image', id, base64 }));
    // Response handled in onmessage
  };

  return (
    <WebSocketContext.Provider value={{ selectObject, deselectObject, syncUpdate, uploadImage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;