import React, { useState } from 'react';
import Toolbar from './Toolbar';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import WebSocketProvider from '../../providers/room/WebSocketProvider.js';
import { iAmBusy } from '../../utility/utils';

const WorkArea = () => {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [texts, setTexts] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [color, setColor] = useState('#000000');
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const addText = async (syncUpdate) => {
    const newText = {
      id: Date.now(),
      text: 'New Text',
      x: 50,
      y: 50,
      fontSize: 20,
      fill: color,
      zIndex: 1
    };
    setTexts((prev) => [...prev, newText]);
    const response = await syncUpdate(newText.id, 'text', newText, () => {
      setTexts((prev) => prev.filter((t) => t.id !== newText.id));
    });
    if (!response.success) {
      iAmBusy(`Failed to add text: ${response.error}`);
    }
  };

  return (
    <WebSocketProvider setLines={setLines} setTexts={setTexts} setImages={setImages} setSelectedId={setSelectedId}>
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <div
          className="d-flex flex-column position-absolute top-50 start-0 translate-middle-y rounded bg-light p-2 ms-2"
          style={{ zIndex: 10, width: '250px' }}
        >
          <Toolbar
            tool={tool}
            setTool={setTool}
            addText={addText}
            setImages={setImages}
            images={images}
            color={color}
            setColor={setColor}
            selectedId={selectedId}
            setLines={setLines}
            setTexts={setTexts}
            scale={scale}
            setScale={setScale}
            setStagePos={setStagePos}
          />
          <PropertiesPanel
            selectedId={selectedId}
            lines={lines}
            texts={texts}
            images={images}
            setLines={setLines}
            setTexts={setTexts}
            setImages={setImages}
            color={color}
            setColor={setColor}
          />
        </div>
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
      </div>
    </WebSocketProvider>
  );
};

export default WorkArea;