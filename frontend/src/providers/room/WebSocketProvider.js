import React, { createContext, useEffect, useRef, useState } from 'react';
import { iAmBusy } from '../../utility/utils';
import LineElement from '../../pages/canvas/elements/LineElement';
import TextElement from '../../pages/canvas/elements/TextElement';
import ImageElement from '../../pages/canvas/elements/ImageElement';
import LoginProvider from '../auth/JWT'; // Adjust path as needed

export const WebSocketContext = createContext();

const WebSocketProvider = ({ children, setLines, setTexts, setImages, setSelectedId, roomId }) => {
  const wsRef = useRef(null);
  const [pendingSelect, setPendingSelect] = useState(null);
  const provider = new LoginProvider();

  useEffect(() => {
    // Ensure we have a token and roomId before connecting
    const token = provider.getToken();
    if (!token || !roomId) {
      console.error('Missing token or roomId');
      return;
    }

    wsRef.current = new WebSocket(`ws://localhost:6942/canvas/${roomId}?token=${token}`);

    wsRef.current.addEventListener("error", (e) => {
      window.addNotification({
        title: 'Ошибка синхронизации',
        message: "Произошла ошибка при попытке синхронизации данных!\n\nПожалуйста, обновите страницу и повторите попытку!",
        variant: 'warning',
        delay: 10000
      });
      console.log(e);
    });

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      wsRef.current.send(JSON.stringify({ type: 'join' }));
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'init':
          setLines((message.data.lines || []).map(data => 
            data instanceof LineElement ? data : new LineElement(data.id, wsRef.current.send.bind(wsRef.current), data)
          ));
          setTexts((message.data.texts || []).map(data => 
            data instanceof TextElement ? data : new TextElement(data.id, wsRef.current.send.bind(wsRef.current), data)
          ));
          setImages((message.data.images || []).map(data => 
            data instanceof ImageElement ? data : new ImageElement(data.id, wsRef.current.send.bind(wsRef.current), data)
          ));
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
          }
          break;
        case 'image':
          if (message.success) {
            setImages((prev) =>
              prev.map((img) =>
                img.id === message.id 
                  ? new ImageElement(img.id, wsRef.current.send.bind(wsRef.current), { ...img.properties, image: null, url: message.url })
                  : img
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
  }, [setLines, setTexts, setImages, setSelectedId, roomId]);

  const selectObject = (id, objectType, callback) => {
    setPendingSelect(`${objectType}-${id}`);
    wsRef.current.send(JSON.stringify({ type: 'select', id, objectType }));
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
  };

  return (
    <WebSocketContext.Provider value={{ selectObject, deselectObject, syncUpdate, uploadImage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;