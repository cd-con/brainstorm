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

  const addText = async (syncUpdate) => {
    const maxZIndex = Math.max(
      ...lines.map((l) => l.zIndex || 0),
      ...texts.map((t) => t.zIndex || 0),
      ...images.map((i) => i.zIndex || 0),
      0
    );
    const newText = {
      id: Date.now(),
      text: 'New Text',
      x: 50,
      y: 50,
      fontSize: 20,
      fill: color,
      zIndex: maxZIndex,
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
      <div>
        <div
          className="d-flex flex-column position-absolute top-50 w-25 start-0 translate-middle-y rounded bg-light p-2"
          style={{ zIndex: 10, maxWidth: 256 }}
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
        <div style={{ flex: 1, position: 'absolute' }}>
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
          />
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default WorkArea;