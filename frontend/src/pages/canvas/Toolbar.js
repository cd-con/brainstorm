import React, { useContext } from 'react';
import { Button, ButtonGroup, Col, Form } from 'react-bootstrap';
import { WebSocketContext } from '../../providers/room/WebSocketProvider.js';
import { iAmBusy } from '../../utility/utils';
import { useNavigate } from 'react-router';

const Toolbar = ({ tool, setTool, addText, setImages, images, color, setColor, selectedId, setLines, setTexts, lines, texts }) => {
    const navigate  = useNavigate();
  const { syncUpdate, uploadImage } = useContext(WebSocketContext);

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

  return (
    <div>
      <Button className='' onClick={()=> navigate("/you")}>Выйти</Button>
      <ButtonGroup as={Col} className="mb-3 p-2" style={{ zIndex: 11 }}>
        <Button
          variant={tool === 'pen' ? 'primary' : 'outline-primary'}
          onClick={() => setTool('pen')}
        >
          Карандаш
        </Button>
        <Button
          variant={tool === 'select' ? 'primary' : 'outline-primary'}
          onClick={() => setTool('select')}
        >
          Рука
        </Button>
      </ButtonGroup>
      <ButtonGroup as={Col} className="mb-3 p-2" style={{ zIndex: 11 }}>
        <Button onClick={() => { setTool('select'); addText(syncUpdate); }}>Добавить текст</Button>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={addImage}
          style={{ display: 'none' }}
          id="image-upload"
        />
        <Button
          onClick={() => { setTool('select'); document.getElementById('image-upload').click(); }}
        >
          Добавить картинку
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default Toolbar;