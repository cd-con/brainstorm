import { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router';
import LineElement from '../pages/canvas/elements/LineElement';
import TextElement from '../pages/canvas/elements/TextElement';
import ImageElement from '../pages/canvas/elements/ImageElement';
import ProviderHTTP from './ProviderHTTP';

export const WebSocketContext = createContext(null);

const WebSocketProvider = ({ children, setLines, setTexts, setImages }) => {
  const [socket, setSocket] = useState(null);
  const [provider] = useState(new ProviderHTTP())
  const { canvasId: room_id } = useParams();

  useEffect(() => {
    const token = provider.getToken()
    if (!token) return;

    const newSocket = io('http://localhost:6943', {
      query: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join', { room_id });
    });

    newSocket.on('sync', ({ room_id: rid, data }) => {
      if (rid !== room_id) return;

      // Helper to update state with server data
      const updateState = (state, serverData, ElementClass) => {
        return state
          .map(item => {
            const serverItem = serverData.find(s => s.id === item.id);
            if (serverItem) {
              item.properties = { ...item.properties, ...serverItem.properties };
              return item;
            }
            return null;
          })
          .filter(item => item !== null)
          .concat(
            serverData
              .filter(s => !state.some(item => item.id === s.id))
              .map(s => new ElementClass(s.id, syncUpdate, s.properties))
          );
      };

      setLines(prev => updateState(prev, data.lines, LineElement));
      setTexts(prev => updateState(prev, data.texts, TextElement));
      setImages(prev => updateState(prev, data.images, ImageElement));
    });

    newSocket.on('message', ({ type, id, properties }) => {
      const setFn = { line: setLines, text: setTexts, image: setImages }[type];
      const ElementClass = { line: LineElement, text: TextElement, image: ImageElement }[type];

      setFn(prev => {
        if (properties === null) {
          return prev.filter(item => item.id !== id);
        }

        const existing = prev.find(item => item.id === id);
        if (existing) {
          existing.properties = { ...existing.properties, ...properties };
          return [...prev];
        }
        return [...prev, new ElementClass(id, syncUpdate, properties)];
      });
    });

    newSocket.on('error', ({ error }) => console.error('Socket error:', error));

    return () => newSocket.disconnect();
  }, [setLines, setTexts, setImages]);

  const syncUpdate = (id, type, props) => {
    if (!socket?.connected) return Promise.resolve({ success: false, error: 'Not connected' });
    return new Promise(resolve => {
      socket.emit('message', { id, room_id, type, properties: props });
      resolve({ success: true });
    });
  };

  return (
    <WebSocketContext.Provider value={{ syncUpdate }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;