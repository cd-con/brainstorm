import { useRef, useEffect, useState, useContext } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import { WebSocketContext } from '../../providers/WebSocketProvider';
import LineElement from './elements/LineElement';

const Canvas = ({ tool, lines, setLines, texts, setTexts, images, setImages, selectedId, setSelectedId, color, scale, setScale, stagePos, setStagePos }) => {
  const { syncUpdate } = useContext(WebSocketContext);
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const [dim, setDim] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const resize = () => setDim({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (!trRef.current || !selectedId) {
      trRef.current?.nodes([]);
      return;
    }
    const node = stageRef.current?.findOne(`#${selectedId}`);
    if (node) trRef.current.nodes([node]);
    trRef.current?.getLayer()?.batchDraw();
  }, [selectedId]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const oldScale = scale;
    const newScale = e.evt.deltaY > 0 ? Math.max(oldScale * 0.9, 0.1) : Math.min(oldScale / 0.9, 4);
    const mousePt = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    setScale(newScale);
    setStagePos({ x: pointer.x - mousePt.x * newScale, y: pointer.y - mousePt.y * newScale });
  };

  const handleMouseDown = (e) => {
    if (tool !== 'pen') return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    isDrawing.current = true;
    const x = (pos.x - stagePos.x) / scale;
    const y = (pos.y - stagePos.y) / scale;
    const newLine = new LineElement(Date.now(), syncUpdate, { points: [x, y], color });
    setLines([...lines, newLine]);
    syncUpdate(newLine.id, 'line', newLine.properties);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool !== 'pen') return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const x = (pos.x - stagePos.x) / scale;
    const y = (pos.y - stagePos.y) / scale;
    const lastLine = lines[lines.length - 1];
    if (!lastLine) return;
    lastLine.properties.points = [...lastLine.properties.points, x, y];
    setLines([...lines.slice(0, -1), lastLine]);
    syncUpdate(lastLine.id, 'line', lastLine.properties);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleClick = (e) => {
    if (e.target === e.currentTarget && tool === 'select' && selectedId) {
      setSelectedId(null);
    }
  };

  const handleDrag = (e) => {
    if (tool === 'select' && !selectedId) setStagePos({ x: e.target.x(), y: e.target.y() });
  };

  const handleDelete = async (e) => {
    if (e.key !== 'Delete' || !selectedId) return;
    const [type, id] = selectedId.split('-');
    const setState = { line: setLines, text: setTexts, image: setImages }[type];
    setState((prev) => prev.filter((el) => el.id !== +id));
    await syncUpdate(id, type, null);
    setSelectedId(null);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleDelete);
    return () => window.removeEventListener('keydown', handleDelete);
  }, [selectedId, syncUpdate]);

  return (
    <Stage
      width={dim.width}
      height={dim.height}
      scaleX={scale}
      scaleY={scale}
      x={stagePos.x}
      y={stagePos.y}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
      onDragMove={handleDrag}
      onDragEnd={handleDrag}
      ref={stageRef}
      style={{ position: 'absolute', top: 0, left: 0 }}
      draggable={tool === 'select' && !selectedId}
    >
      <Layer>
        {[...lines, ...texts, ...images]
          .sort((a, b) => (a.properties.zIndex || 0) - (b.properties.zIndex || 0))
          .map((el) => el.getKonvaComponent({ tool, scale, setSelectedId, setState: { line: setLines, text: setTexts, image: setImages }[el.type] }))}
        <Transformer ref={trRef} rotateEnabled={true} enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5 ? oldBox : newBox)} />
      </Layer>
    </Stage>
  );
};

export default Canvas;