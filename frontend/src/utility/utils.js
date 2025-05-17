export const handleMouseDown = (e, tool, isDrawing, lines, setLines, color) => {
  if (tool !== 'pen') return;
  isDrawing.current = true;
  const pos = e.target.getStage().getPointerPosition();
  setLines([...lines, { points: [pos.x, pos.y], color, id: Date.now() }]);
};

export const handleMouseMove = (e, tool, isDrawing, lines, setLines) => {
  if (!isDrawing.current || tool !== 'pen') return;
  const stage = e.target.getStage();
  const point = stage.getPointerPosition();
  let lastLine = lines[lines.length - 1];
  lastLine.points = lastLine.points.concat([point.x, point.y]);
  setLines([...lines.slice(0, -1), lastLine]);
};

export const handleMouseUp = (isDrawing) => {
  isDrawing.current = false;
};

export const handleSelect = (id, type, setSelectedId) => {
  setSelectedId(`${type}-${id}`);
};