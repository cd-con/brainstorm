import React, { useState, useEffect } from 'react';
import Toolbar from './Toolbar';
import Canvas from './Canvas';

const WorkArea = () => {
 const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [texts, setTexts] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [color, setColor] = useState('#000000');

  // Обработчик клавиши Delete
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedId) {
        const [type, id] = selectedId.split('-');
        if (type === 'line') {
          setLines(lines.filter((line) => line.id !== parseInt(id)));
        } else if (type === 'text') {
          setTexts(texts.filter((text) => text.id !== parseInt(id)));
        } else if (type === 'image') {
          setImages(images.filter((img) => img.id !== parseInt(id)));
        }
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, lines, texts, images]);

  return (
    <div className="container-fluid p-0">

      <Canvas
        tool={tool}
        lines={lines}
        setLines={setLines}
        texts={texts}
        setTexts={setTexts}
        images={images}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        color={color}
      />

          <Toolbar
        tool={tool}
        setTool={setTool}
        addText={() => setTexts([...texts, { id: Date.now(), text: 'New Text', x: 50, y: 50, fontSize: 20, fill: color }])}
        setImages={setImages}
        images={images}
        color={color}
        setColor={setColor}
        selectedId={selectedId}
        setLines={setLines}
        setTexts={setTexts}
        lines={lines}
        texts={texts}
      />
          </div>
  );
};


export default WorkArea;