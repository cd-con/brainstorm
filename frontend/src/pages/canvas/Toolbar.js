import React, { useContext } from 'react';
import { Button, ButtonGroup, Form, InputGroup } from 'react-bootstrap';
import { WebSocketContext } from '../../providers/room/WebSocketProvider.js';
import { iAmBusy } from '../../utility/utils';
import { useNavigate } from 'react-router';

const Toolbar = ({ 
  tool, 
  setTool, 
  addText, 
  setImages, 
  images, 
  color, 
  setColor, 
  selectedId, 
  setLines, 
  setTexts,
  scale,
  setScale,
  setStagePos
}) => {
  const navigate = useNavigate();
  const { syncUpdate, uploadImage } = useContext(WebSocketContext);

  // Добавляем недостающую функцию
  const addImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = async () => {
        const newImage = {
          id: Date.now(),
          image: img,
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          zIndex: 1,
        };
        setImages((prev) => [...prev, newImage]);
        const response = await syncUpdate(newImage.id, 'image', newImage, () => {
          setImages((prev) => prev.filter((i) => i.id !== newImage.id));
        });
        if (response.success) {
          uploadImage(newImage.id, reader.result);
        } else {
          iAmBusy(`Failed to add image: ${response.error}`);
          setImages((prev) => prev.filter((i) => i.id !== newImage.id));
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.1));
  const handleZoomReset = () => {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-3 p-2 bg-light border-bottom">
      <Button variant="outline-secondary" onClick={() => navigate("/you")}>🚪</Button>

      <ButtonGroup>
        <Button
          variant={tool === 'select' ? 'primary' : 'outline-primary'}
          onClick={() => setTool('select')}
          title="Выделение"
        >
          ✥
        </Button>
        <Button
          variant={tool === 'pen' ? 'primary' : 'outline-primary'}
          onClick={() => setTool('pen')}
          title="Карандаш"
        >
          ✏️
        </Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button 
          variant="outline-success"
          onClick={() => { setTool('select'); addText(syncUpdate); }}
          title="Добавить текст"
        >
          🔤
        </Button>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={addImage}
          style={{ display: 'none' }}
          id="image-upload"
        />
        <Button
          variant="outline-success"
          onClick={() => { setTool('select'); document.getElementById('image-upload').click(); }}
          title="Добавить изображение"
        >
          🖼️
        </Button>
      </ButtonGroup>

      <InputGroup style={{ width: 'auto' }}>
        <Button variant="outline-secondary" onClick={handleZoomOut} title="Уменьшить">➖</Button>
        <Button variant="outline-secondary" onClick={handleZoomReset} title="Сбросить масштаб">
          {Math.round(scale * 100)}%
        </Button>
        <Button variant="outline-secondary" onClick={handleZoomIn} title="Увеличить">➕</Button>
      </InputGroup>

      <Form.Control
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        style={{ width: '40px' }}
        title="Выберите цвет"
      />
    </div>
  );
};

export default Toolbar;