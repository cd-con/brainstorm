import { useRef, useEffect, useState, useContext } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import { handleMouseDown, handleMouseMove, handleMouseUp, iAmBusy } from '../../utility/utils.js';
import { WebSocketContext } from '../../providers/room/WebSocketProvider.js';
import LineElement from './elements/LineElement.js';
import TextElement from './elements/TextElement.js';
import ImageElement from './elements/ImageElement.js';

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

  if (stagePos === null || stagePos === undefined) {
    stagePos = { x: 0, y: 0 };
  }

  const drawGrid = () => {
    console.warn("DrawGrid feature temporary disabled due to incorrect drawing state. This is not an error.");
    return [];
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
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  const handleWheel = (e) => {
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
      
      let element;
      if (type === 'line') {
        element = lines.find(l => l.id === idNum);
      } else if (type === 'text') {
        element = texts.find(t => t.id === idNum);
      } else if (type === 'image') {
        element = images.find(i => i.id === idNum);
      }

      if (element) {
        const response = await element.delete(type === 'line' ? setLines : type === 'text' ? setTexts : setImages);
        if (response.success) {
          setSelectedId(null);
        } else {
          iAmBusy(`Failed to delete: ${response.error}`);
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleDelete);
    return () => window.removeEventListener('keydown', handleDelete);
  }, [selectedId, lines, texts, images]);

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
        {[...lines, ...texts, ...images]
          .sort((a, b) => (a.properties.zIndex || 0) - (b.properties.zIndex || 0))
          .map((element) => element.getKonvaComponent({
            tool,
            scale,
            handleSelect: (elem) => elem.handleSelect(selectObject, setSelectedId),
            handleDragEnd: (elem, e) => elem.handleDragEnd(e, 
              element.type === 'line' ? setLines : 
              element.type === 'text' ? setTexts : setImages
            )
          }))}
        
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          visible={selectedId != null}
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