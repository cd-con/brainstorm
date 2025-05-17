import React from 'react';
import { Button, ButtonGroup, Form } from 'react-bootstrap';

const Toolbar = ({ tool, setTool, addText, setImages, images, color, setColor, selectedId, setLines, setTexts, lines, texts }) => {
  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        setImages([...images, { id: Date.now(), image: img, x: 50, y: 50, width: 100, height: 100 }]);
      };
    };
    reader.readAsDataURL(file);
  };

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
  );
};

export default Toolbar;