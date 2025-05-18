import React, { useRef, useEffect, useState, useContext } from 'react';
import { Stage, Layer, Line, Text, Image, Transformer } from 'react-konva';
import { handleMouseDown, handleMouseMove, handleMouseUp, handleSelect, iAmBusy } from '../../utility/utils.js';
import { WebSocketContext } from '../../providers/room/WebSocketProvider.js';

const Canvas =  ({ tool, lines, setLines, texts, setTexts, images, setImages, selectedId, setSelectedId, color }) => {
  const { selectObject, deselectObject, syncUpdate } = useContext(WebSocketContext);
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    if (transformerRef.current && selectedId && stageRef.current) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      // console.log('Transformer: selectedId=', selectedId, 'node=', node); // Debug
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale / 0.9;
    setScale(newScale);
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStagePos(newPos);
  };

  const handleStageClick = (e) => {
    if (e.target === stageRef.current && tool === 'select' && selectedId) {
      deselectObject(selectedId.split('-')[1], selectedId.split('-')[0]);
    }
  };

  const handleDelete = async (e) => {
    if (e.key === 'Delete' && selectedId) {
      const [type, id] = selectedId.split('-');
      let prevState;
      if (type === 'line') {
        prevState = [...lines];
        setLines((prev) => prev.filter((l) => l.id !== parseInt(id)));
      } else if (type === 'text') {
        prevState = [...texts];
        setTexts((prev) => prev.filter((t) => t.id !== parseInt(id)));
      } else if (type === 'image') {
        prevState = [...images];
        setImages((prev) => prev.filter((i) => i.id !== parseInt(id))); // Line ~78
      }
      const response = await syncUpdate(id, type, null, () => {
        if (type === 'line') setLines(prevState);
        else if (type === 'text') setTexts(prevState);
        else if (type === 'image') setImages(prevState); // Line ~83
      });
      if (response.success) {
        deselectObject(id, type);
      } else {
        alert(`Failed to delete: ${response.error}`);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleDelete);
    return () => window.removeEventListener('keydown', handleDelete);
  }, [selectedId, lines, texts, images, setLines, setTexts, setImages, syncUpdate, deselectObject]);

  const allObjects = [
    ...lines.map((line) => ({ ...line, type: 'line' })),
    ...texts.map((text) => ({ ...text, type: 'text' })),
    ...images.map((img) => ({ ...img, type: 'image' })),
  ].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const handleDragEnd = async (e, obj) => {
    if (!selectedId) return;
    const newPos = { x: e.target.x(), y: e.target.y() };
    let prevState;
    if (obj.type === 'line') {
      prevState = [...lines];
      setLines((prev) =>
        prev.map((l) => (l.id === obj.id ? { ...l, ...newPos } : l))
      );
      const response = await syncUpdate(obj.id, 'line', newPos, () => {
        setLines(prevState);
      });
      if (!response.success) {
        alert(`Failed to update position: ${response.error}`);
      }
    } else if (obj.type === 'text') {
      prevState = [...texts];
      setTexts((prev) =>
        prev.map((t) => (t.id === obj.id ? { ...t, ...newPos } : t))
      );
      const response = await syncUpdate(obj.id, 'text', newPos, () => {
        setTexts(prevState);
      });
      if (!response.success) {
        alert(`Failed to update position: ${response.error}`);
      }
    } else if (obj.type === 'image') {
      prevState = [...images];
      setImages((prev) => // Line ~132
        prev.map((i) => (i.id === obj.id ? { ...i, ...newPos } : i))
      );
      const response = await syncUpdate(obj.id, 'image', newPos, () => {
        setImages(prevState); // Line ~136
      });
      if (!response.success) {
        alert(`Failed to update position: ${response.error}`);
      }
    }
  };

  const handleTextDblClick = async (text) => {
    if (!selectedId) return;
    const newText = prompt('Enter new text', text.text);
    if (newText) {
      const prevState = [...texts];
      setTexts((prev) =>
        prev.map((t) => (t.id === text.id ? { ...t, text: newText } : t))
      );
      const response = await syncUpdate(text.id, 'text', { text: newText }, () => {
        setTexts(prevState);
      });
      if (!response.success) {
        alert(`Failed to update text: ${response.error}`);
      }
    }
  };

  return (
    <Stage
      width={dimensions.width}
      height={dimensions.height}
      scaleX={scale}
      scaleY={scale}
      x={stagePos.x}
      y={stagePos.y}
      onMouseDown={(e) => handleMouseDown(e, tool, isDrawing, lines, setLines, color, syncUpdate)}
      onMouseMove={(e) => handleMouseMove(e, tool, isDrawing, lines, setLines, syncUpdate)}
      onMouseUp={() => handleMouseUp(isDrawing)}
      onWheel={handleWheel}
      onClick={handleStageClick}
      ref={stageRef}
      style={{ border: '1px solid black', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      draggable={tool === 'select' && !selectedId}
    >
      <Layer>
        {allObjects.map((obj) => {
          const isLocked = selectedId && selectedId !== `${obj.type}-${obj.id}`;
          if (obj.type === 'line') {
            return (
              <Line
                key={obj.id}
                id={`line-${obj.id}`}
                points={obj.points}
                stroke={obj.color}
                strokeWidth={5 / scale}
                lineCap="round"
                lineJoin="round"
                draggable={tool === 'select' && !isLocked}
                opacity={isLocked ? 0.5 : 1}
                onClick={() => tool === 'select' && handleSelect(obj.id, 'line', selectObject)}
                onDragEnd={(e) => handleDragEnd(e, obj)}
              />
            );
          } else if (obj.type === 'text') {
            return (
              <Text
                key={obj.id}
                id={`text-${obj.id}`}
                text={obj.text}
                x={obj.x}
                y={obj.y}
                fontSize={obj.fontSize / scale}
                fill={obj.fill}
                draggable={tool === 'select' && !isLocked}
                opacity={isLocked ? 0.5 : 1}
                onClick={() => tool === 'select' && handleSelect(obj.id, 'text', selectObject)}
                onDblClick={() => handleTextDblClick(obj)}
                onDragEnd={(e) => handleDragEnd(e, obj)}
              />
            );
          } else if (obj.type === 'image') {
            const imageObj = obj.image || (obj.url ? new window.Image() : null);
            if (obj.url && imageObj) {
              imageObj.src = obj.url;
            }
            return (
              <Image
                key={obj.id}
                id={`image-${obj.id}`}
                image={imageObj}
                x={obj.x}
                y={obj.y}
                width={obj.width / scale}
                height={obj.height / scale}
                draggable={tool === 'select' && !isLocked}
                opacity={isLocked ? 0.5 : 1}
                onClick={() => tool === 'select' && handleSelect(obj.id, 'image', selectObject)}
                onDragEnd={(e) => handleDragEnd(e, obj)}
              />
            );
          }
          return null;
        })}
        <Transformer
          ref={transformerRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={true}
          boundBoxFunc={(oldBox, newBox) => {
            // Prevent negative scaling
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
};

export default Canvas;