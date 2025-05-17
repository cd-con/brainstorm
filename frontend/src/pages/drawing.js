import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Text, Image, Transformer } from 'react-konva';
import { Button, ButtonGroup, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Canvas = () => {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [texts, setTexts] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [color, setColor] = useState('#000000');
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);

  // Обработка рисования линий
  const handleMouseDown = (e) => {
    if (tool !== 'pen') return;
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y], color, id: Date.now() }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool !== 'pen') return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    setLines([...lines.slice(0, -1), lastLine]);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // Добавление текста
  const addText = () => {
    const newText = {
      id: Date.now(),
      text: 'New Text',
      x: 50,
      y: 50,
      fontSize: 20,
      fill: color,
    };
    setTexts([...texts, newText]);
    setSelectedId(newText.id);
  };

  // Добавление изображения
  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        const newImage = {
          id: Date.now(),
          image: img,
          x: 50,
          y: 50,
          width: 100,
          height: 100,
        };
        setImages([...images, newImage]);
        setSelectedId(newImage.id);
      };
    };
    reader.readAsDataURL(file);
  };

  // Обработка выбора элемента
  const handleSelect = (id, type) => {
    setSelectedId(`${type}-${id}`);
  };

  // Обновление трансформера
  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  // Изменение цвета выбранного элемента
  const changeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    if (selectedId) {
      const [type, id] = selectedId.split('-');
      if (type === 'text') {
        setTexts(
          texts.map((t) =>
            t.id === parseInt(id) ? { ...t, fill: newColor } : t
          )
        );
      } else if (type === 'line') {
        setLines(
          lines.map((l) =>
            l.id === parseInt(id) ? { ...l, color: newColor } : l
          )
        );
      }
    }
  };

  return (
    <div className="container my-3">
      <ButtonGroup className="mb-3">
        <Button
          variant={tool === 'pen' ? 'primary' : 'outline-primary'}
          onClick={() => setTool('pen')}
        >
          Pen
        </Button>
        <Button
          variant={tool === 'select' ? 'primary' : 'outline-primary'}
          onClick={() => setTool('select')}
        >
          Select
        </Button>
        <Button onClick={addText}>Add Text</Button>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={addImage}
          style={{ display: 'none' }}
          id="image-upload"
        />
        <Button
          onClick={() => document.getElementById('image-upload').click()}
        >
          Add Image
        </Button>
        <Form.Control
          type="color"
          value={color}
          onChange={changeColor}
          style={{ width: '50px' }}
        />
      </ButtonGroup>

      <Stage
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
        style={{ border: '1px solid black' }}
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
              onClick={() => tool === 'select' && handleSelect(line.id, 'line')}
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
              onClick={() => tool === 'select' && handleSelect(text.id, 'text')}
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
              onClick={() => tool === 'select' && handleSelect(img.id, 'image')}
            />
          ))}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;