import React, { useRef, useEffect, useState, useContext } from 'react';
import { Stage, Layer, Line, Text, Image, Transformer } from 'react-konva';
import { handleMouseDown, handleMouseMove, handleMouseUp, handleSelect, iAmBusy } from '../../utility/utils.js';
import { WebSocketContext } from '../../providers/room/WebSocketProvider.js';

const GRID_SIZE = 50;
const GRID_COLOR = '#e0e0e0';
const MIN_SCALE = 0.1;
const MAX_SCALE = 4;

const Canvas = ({ tool, lines, setLines, texts, setTexts, images, setImages, selectedId, setSelectedId, color, scale, setScale, stagePos, setStagePos }) => {
  const { selectObject, deselectObject, syncUpdate } = useContext(WebSocketContext);
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  if (stagePos === null || stagePos === undefined){
    stagePos = {x: 0, y: 0}
  }

  const drawGrid = () => {
  const stage = stageRef.current;
  if (!stage) return [];
  
  const gridLines = [];
  const width = stage.width();
  const height = stage.height();
  
  const visibleArea = {
    left: -stage.x() / scale,
    right: (width - stage.x()) / scale,
    top: -stage.y() / scale,
    bottom: (height - stage.y()) / scale,
  };

  const startX = Math.floor(visibleArea.left / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
  const endX = Math.ceil(visibleArea.right / GRID_SIZE) * GRID_SIZE + GRID_SIZE;
  const startY = Math.floor(visibleArea.top / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
  const endY = Math.ceil(visibleArea.bottom / GRID_SIZE) * GRID_SIZE + GRID_SIZE;

  // Вертикальные линии
  for (let x = startX; x < endX; x += GRID_SIZE) {
    gridLines.push(
      <Line
        key={`vline-${x}`}
        points={[x * scale + stage.x(), -stage.y(), x * scale + stage.x(), height - stage.y()]}
        stroke={GRID_COLOR}
        strokeWidth={1}
        listening={false}
      />
    );
  }

  // Горизонтальные линии
  for (let y = startY; y < endY; y += GRID_SIZE) {
    gridLines.push(
      <Line
        key={`hline-${y}`}
        points={[-stage.x(), y * scale + stage.y(), width - stage.x(), y * scale + stage.y()]}
        stroke={GRID_COLOR}
        strokeWidth={1}
        listening={false}
      />
    );
  }

  return gridLines;
};

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
    if (!transformerRef.current || !selectedId) {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
      return;
    }

    const node = stageRef.current?.findOne(`#${selectedId}`);
    if (node) {
      transformerRef.current.nodes([node]);
      //node.moveToTop();
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  const handleWheel = (e) => {
    //fix
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const newScale = e.evt.deltaY > 0 
      ? Math.max(oldScale * 0.9, MIN_SCALE)
      : Math.min(oldScale / 0.9, MAX_SCALE);

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    setScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleStageClick = (e) => {
    if (e.target === e.currentTarget && tool === 'select' && selectedId) {
      deselectObject(selectedId.split('-')[1], selectedId.split('-')[0]);
      setSelectedId(null);
    }
  };

  const handleStageDragMove = (e) => {
    if (tool === 'select' && !selectedId) {
      setStagePos({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  const handleStageDragEnd = (e) => {
    if (tool === 'select' && !selectedId) {
      setStagePos({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  const handleDelete = async (e) => {
    if (e.key === 'Delete' && selectedId) {
      const [type, id] = selectedId.split('-');
      const idNum = parseInt(id);
      
      let prevState;
      if (type === 'line') {
        prevState = [...lines];
        setLines(prev => prev.filter(l => l.id !== idNum));
      } else if (type === 'text') {
        prevState = [...texts];
        setTexts(prev => prev.filter(t => t.id !== idNum));
      } else if (type === 'image') {
        prevState = [...images];
        setImages(prev => prev.filter(i => i.id !== idNum));
      }

      setSelectedId(null); // УДАЛИТЬ!

      const response = await syncUpdate(id, type, null, () => {
        if (type === 'line') setLines(prevState);
        else if (type === 'text') setTexts(prevState);
        else if (type === 'image') setImages(prevState);
      });



      // ИСПОЛЬЗОВАТЬ КОГДА БУДЕТ ГОТОВ БЭК
      /*
      if (response.success) {
        setSelectedId(null);
      } else {
        alert(`Failed to delete: ${response.error}`);
      }*/
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleDelete);
    return () => window.removeEventListener('keydown', handleDelete);
  }, [selectedId, lines, texts, images]);

  const handleDragEnd = async (e, obj) => {
    if (!selectedId) return;
    const newPos = { x: e.target.x(), y: e.target.y() };
    
    let prevState;
    if (obj.type === 'line') {
      prevState = [...lines];
      setLines(prev => prev.map(l => l.id === obj.id ? { ...l, ...newPos } : l));
    } else if (obj.type === 'text') {
      prevState = [...texts];
      setTexts(prev => prev.map(t => t.id === obj.id ? { ...t, ...newPos } : t));
    } else if (obj.type === 'image') {
      prevState = [...images];
      setImages(prev => prev.map(i => i.id === obj.id ? { ...i, ...newPos } : i));
    }

    const response = await syncUpdate(obj.id, obj.type, newPos, () => {
      if (obj.type === 'line') setLines(prevState);
      else if (obj.type === 'text') setTexts(prevState);
      else if (obj.type === 'image') setImages(prevState);
    });

    if (!response.success) {
      alert(`Failed to update position: ${response.error}`);
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
      onMouseDown={(e) => handleMouseDown(
  e, 
  tool, 
  isDrawing, 
  lines, 
  setLines, 
  color, 
  syncUpdate, 
  scale, 
  stagePos
)}
      onMouseMove={(e) => handleMouseMove(
  e, 
  tool, 
  isDrawing, 
  lines, 
  setLines, 
  syncUpdate, 
  scale, 
  stagePos
)}
      onMouseUp={() => handleMouseUp(isDrawing)}
      onWheel={handleWheel}
      onClick={handleStageClick}
      onDragMove={handleStageDragMove}
      onDragEnd={handleStageDragEnd}
      ref={stageRef}
      style={{ position: 'absolute', top: 0, left: 0 }}
      draggable={tool === 'select' && !selectedId}
    >
      <Layer>
        {drawGrid()}
        
        {[...lines.map(line => ({ ...line, type: 'line' })), 
         ...texts.map(text => ({ ...text, type: 'text' })), 
         ...images.map(img => ({ ...img, type: 'image' }))]
          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
          .map((obj) => {
            const isSelected = true;//selectedId === `${obj.type}-${obj.id}`;
            
            if (obj.type === 'line') {
              return (
                <Line
                  key={`line-${obj.id}`}
                  id={`line-${obj.id}`}
                  points={obj.points}
                  stroke={obj.color}
                  strokeWidth={5 / scale}
                  lineCap="round"
                  lineJoin="round"
                  draggable={tool === 'select'}
                  onClick={(e) => {
                    if (tool === 'select') {
                      handleSelect(obj.id, 'line', selectObject);
                      setSelectedId(`line-${obj.id}`);
                      e.cancelBubble = true;
                    }
                  }}
                  onDragEnd={(e) => handleDragEnd(e, obj)}
                />
              );
            } else if (obj.type === 'text') {
              return (
                <Text
                  key={`text-${obj.id}`}
                  id={`text-${obj.id}`}
                  text={obj.text}
                  x={obj.x}
                  y={obj.y}
                  fontSize={obj.fontSize / scale}
                  fill={obj.fill}
                  draggable={tool === 'select'}
                  onClick={(e) => {
                    if (tool === 'select') {
                      handleSelect(obj.id, 'text', selectObject);
                      setSelectedId(`text-${obj.id}`);
                      e.cancelBubble = true;
                    }
                  }}
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
                  key={`image-${obj.id}`}
                  id={`image-${obj.id}`}
                  image={imageObj}
                  x={obj.x}
                  y={obj.y}
                  width={obj.width / scale}
                  height={obj.height / scale}
                  draggable={tool === 'select'}
                  onClick={(e) => {
                    if (tool === 'select') {
                      handleSelect(obj.id, 'image', selectObject);
                      setSelectedId(`image-${obj.id}`);
                      e.cancelBubble = true;
                    }
                  }}
                  onDragEnd={(e) => handleDragEnd(e, obj)}
                />
              );
            }
            return null;
          })}
        
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          visible={selectObject != null}
          boundBoxFunc={(oldBox, newBox) => {
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