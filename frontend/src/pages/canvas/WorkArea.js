import { useState } from 'react';
import WebSocketProvider from '../../providers/ctx/ServerProviderContext';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';

const CollaborativeCanvas = () => {
  const [lines, setLines] = useState([]);
  const [texts, setTexts] = useState([]);
  const [images, setImages] = useState([]);
  const [tool, setTool] = useState('select');
  const [color, setColor] = useState('#000000');
  const [selectedId, setSelectedId] = useState(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <WebSocketProvider setLines={setLines} setTexts={setTexts} setImages={setImages}>
        <Canvas
          tool={tool}
          lines={lines}
          setLines={setLines}
          texts={texts}
          setTexts={setTexts}
          images={images}
          setImages={setImages}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          color={color}
          scale={scale}
          setScale={setScale}
          stagePos={stagePos}
          setStagePos={setStagePos}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 20 }}>
          <Toolbar tool={tool} setTool={setTool} color={color} setColor={setColor} setTexts={setTexts} setImages={setImages} scale={scale} setScale={setScale} setStagePos={setStagePos} />
        </div>
        <div style={{ position: 'absolute', right: 0, top: 0, width: '250px', background: '#f8f9fa', padding: '16px', zIndex: 20 }}>
          <PropertiesPanel selectedId={selectedId} lines={lines} texts={texts} images={images} setLines={setLines} setTexts={setTexts} setImages={setImages} color={color} setColor={setColor} />
        </div>
      </WebSocketProvider>
    </div>
  );
};

export default CollaborativeCanvas;