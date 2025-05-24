import { createContext, useMemo } from 'react';
import WebSocketProvider from '../WebSocketProvider';
import ProviderHTTP from '../ProviderHTTP';

export const ServerProviderContext = createContext(null);

const ServerProviderWrapper = ({ children, setLines, setTexts, setImages, setSelectedId }) => {
  const provider = useMemo(() => new ProviderHTTP(), []);
  return (
    <ServerProviderContext.Provider value={provider}>
      <WebSocketProvider setLines={setLines} setTexts={setTexts} setImages={setImages} setSelectedId={setSelectedId}>
        {children}
      </WebSocketProvider>
    </ServerProviderContext.Provider>
  );
};

export default ServerProviderWrapper;