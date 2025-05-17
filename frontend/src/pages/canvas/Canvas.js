import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Text, Image, Transformer } from 'react-konva';
import { handleMouseDown, handleMouseMove, handleMouseUp, handleSelect } from '../../utility/utils.js';

const Canvas = ({ tool, lines, setLines, texts, setTexts, images, selectedId, setSelectedId, color }) => {
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Обновление размеров холста при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Обновление трансформера при выборе элемента
  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  return (
    <Stage
      width={dimensions.width}
      height={dimensions.height}
      onMouseDown={(e) => handleMouseDown(e, tool, isDrawing, lines, setLines, color)}
      onMouseMove={(e) => handleMouseMove(e, tool, isDrawing, lines, setLines)}
      onMouseUp={() => handleMouseUp(isDrawing)}
      ref={stageRef}
      style={{ border: '1px solid black', position: 'absolute', top: 0, left: 0 }}
    >
      <Layer>
        {lines.map((line) => (
          <Line
            key={line.id}
            id={`line-${line.id}`}
            points={line.points}
            stroke={line.color}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            onClick={() => tool === 'select' && handleSelect(line.id, 'line', setSelectedId)}
            draggable={tool === 'select'}
          />
        ))}
        {texts.map((text) => (
          <Text
            key={text.id}
            id={`text-${text.id}`}
            text={text.text}
            x={text.x}
            y={text.y}
            fontSize={text.fontSize}
            fill={text.fill}
            draggable={tool === 'select'}
            onClick={() => tool === 'select' && handleSelect(text.id, 'text', setSelectedId)}
            onDblClick={() => {
              const newText = prompt('Enter new text', text.text);
              if (newText) {
                setTexts(
                  texts.map((t) =>
                    t.id === text.id ? { ...t, text: newText } : t
                  )
                );
              }
            }}
          />
        ))}
        {images.map((img) => (
          <Image
            key={img.id}
            id={`image-${img.id}`}
            image={img.image}
            x={img.x}
            y={img.y}
            width={img.width}
            height={img.height}
            draggable={tool === 'select'}
            onClick={() => tool === 'select' && handleSelect(img.id, 'image', setSelectedId)}
          />
        ))}
        <Transformer ref={transformerRef} />
      </Layer>
    </Stage>
  );
};

export default Canvas;