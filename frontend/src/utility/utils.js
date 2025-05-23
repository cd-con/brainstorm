import LineElement from '../pages/canvas/elements/LineElement.js';

export const handleMouseDown = (e, tool, isDrawing, lines, setLines, color, syncUpdate, scale = 1, stagePos = {x: 0, y: 0}) => {
  if (tool !== 'pen') return;
  
  const stage = e.target.getStage();
  if (!stage) return;

  const pos = stage.getPointerPosition();
  if (!pos) return;

  const x = (pos.x - stagePos.x) / scale;
  const y = (pos.y - stagePos.y) / scale;
  
  isDrawing.current = true;
  const newLine = new LineElement(Date.now(), syncUpdate, {
    points: [x, y],
    color: color,
    zIndex: 0,
  });
  
  setLines([...lines, newLine]);
  syncUpdate(newLine.id, 'line', newLine.properties, () => {
    setLines(prev => prev.filter(l => l.id !== newLine.id));
  });
};

export const handleMouseMove = (e, tool, isDrawing, lines, setLines, syncUpdate, scale = 1, stagePos = {x: 0, y: 0}) => {
  if (!isDrawing.current || tool !== 'pen') return;
  
  const stage = e.target.getStage();
  if (!stage) return;

  const pos = stage.getPointerPosition();
  if (!pos) return;

  const x = (pos.x - stagePos.x) / scale;
  const y = (pos.y - stagePos.y) / scale;
  
  const lastLine = lines[lines.length - 1];
  if (!lastLine) return;

  lastLine.properties.points = lastLine.properties.points.concat([x, y]);
  setLines([...lines.slice(0, -1), lastLine]);
  syncUpdate(lastLine.id, 'line', lastLine.properties, () => {
    setLines(prev => prev.filter(l => l.id !== lastLine.id));
  });
};

export const handleMouseUp = (isDrawing) => {
  isDrawing.current = false;
};

export const handleSelect = (id, type, selectObject) => {
  selectObject(id, type);
};

export const iAmBusy = (text) => {
  window.addNotification({
    title: 'Занято!',
    message: text,
    variant: 'warning',
    delay: 3000
  });
};