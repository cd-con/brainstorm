export const handleMouseDown = async (e, tool, isDrawing, lines, setLines, color, syncUpdate) => {
  if (tool !== 'pen') return;
  isDrawing.current = true;
  const pos = e.target.getStage().getPointerPosition();
  const maxZIndex = lines.length > 0 ? Math.max(...lines.map((l) => l.zIndex || 0)) : 0;
  const newLine = {
    id: Date.now(),
    points: [pos.x, pos.y],
    color,
    zIndex: maxZIndex + 1,
  };
  setLines((prev) => [...prev, newLine]);
  const response = await syncUpdate(newLine.id, 'line', newLine, () => {
    setLines((prev) => prev.filter((l) => l.id !== newLine.id));
  });
  if (!response.success) {
    iAmBusy(`Failed to add line: ${response.error}`);
  }
};

export const handleMouseMove = async (e, tool, isDrawing, lines, setLines, syncUpdate) => {
  if (tool !== 'pen' || !isDrawing.current) return;
  const stage = e.target.getStage();
  const point = stage.getPointerPosition();
  const lastLine = lines[lines.length - 1];
  const newPoints = [...lastLine.points, point.x, point.y];
  setLines((prev) =>
    prev.map((line, index) =>
      index === prev.length - 1 ? { ...line, points: newPoints } : line
    )
  );
  const response = await syncUpdate(lastLine.id, 'line', { points: newPoints }, () => {
    setLines((prev) =>
      prev.map((line, index) =>
        index === prev.length - 1 ? { ...line, points: lastLine.points } : line
      )
    );
  });
  if (!response.success) {
    iAmBusy(`Failed to update line: ${response.error}`);
    isDrawing.current = false;
  }
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
}