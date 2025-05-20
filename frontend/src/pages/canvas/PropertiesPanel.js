import React, { useContext, useState } from 'react';
import { Form, FormControl, InputGroup, Button } from 'react-bootstrap';
import { WebSocketContext } from '../../providers/room/WebSocketProvider.js';
import { iAmBusy } from '../../utility/utils';

const PropertiesPanel = ({ selectedId, lines, texts, images, setLines, setTexts, setImages, color, setColor }) => {
  const { syncUpdate, uploadImage } = useContext(WebSocketContext);
  const [imageUrl, setImageUrl] = useState('');

  if (!selectedId) {
    return <div className="p-3" style={{ background: '#f8f9fa' }}>Выберите объект для редактирования</div>;
  }
  
  const [type, id] = selectedId.split('-');
  const selectedObject = 
  type === 'line' ? lines.find((line) => line.id === parseInt(id)) :
  type === 'text' ? texts.find((text) => text.id === parseInt(id)) :
  type === 'image' ? images.find((img) => img.id === parseInt(id)) : 
  null;
  


   if (!selectedObject) {
    return <div className="p-3" style={{ background: '#f8f9fa' }}>Объект не выбран</div>;
  }
  const handleTextChange = async (e) => {
    if (type === 'text') {
      const newText = e.target.value;
      setTexts((prev) =>
        prev.map((t) => (t.id === parseInt(id) ? { ...t, text: newText } : t))
      );
      const response = await syncUpdate(id, 'text', { text: newText }, () => {
        setTexts((prev) =>
          prev.map((t) => (t.id === parseInt(id) ? { ...t, text: selectedObject.text } : t))
        );
      });
      if (!response.success) {
        iAmBusy(`Не удалось обновить текст: ${response.error}`);
      }
    }
  };

  const handleColorChange = async (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    if (type === 'text') {
      setTexts((prev) =>
        prev.map((t) => (t.id === parseInt(id) ? { ...t, fill: newColor } : t))
      );
      const response = await syncUpdate(id, 'text', { fill: newColor }, () => {
        setTexts((prev) =>
          prev.map((t) => (t.id === parseInt(id) ? { ...t, fill: selectedObject.fill } : t))
        );
      });
      if (!response.success) {
        iAmBusy(`Не удалось изменить цвет: ${response.error}`);
      }
    } else if (type === 'line') {
      setLines((prev) =>
        prev.map((l) => (l.id === parseInt(id) ? { ...l, color: newColor } : l))
      );
      const response = await syncUpdate(id, 'line', { color: newColor }, () => {
        setLines((prev) =>
          prev.map((l) => (l.id === parseInt(id) ? { ...l, color: selectedObject.color } : l))
        );
      });
      if (!response.success) {
        iAmBusy(`Не удалось изменить цвет: ${response.error}`);
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async () => {
      const img = new window.Image();
      img.src = reader.result;
      
      img.onload = async () => {
        const newImage = { 
          image: img, 
          width: img.width, 
          height: img.height,
          url: null
        };
        
        setImages((prev) =>
          prev.map((i) => (i.id === parseInt(id) ? { ...i, ...newImage } : i))
        );
        
        const response = await syncUpdate(id, 'image', newImage, () => {
          setImages((prev) =>
            prev.map((i) => (i.id === parseInt(id) ? { ...i, ...selectedObject } : i))
          );
        });
        
        if (response.success) {
          await uploadImage(id, reader.result);
        } else {
          iAmBusy(`Не удалось обновить изображение: ${response.error}`);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = async () => {
    if (!imageUrl) return;
    
    const img = new window.Image();
    img.src = imageUrl;
    
    img.onload = async () => {
      const newImage = { 
        url: imageUrl,
        width: img.width,
        height: img.height,
        image: null
      };
      
      setImages((prev) =>
        prev.map((i) => (i.id === parseInt(id) ? { ...i, ...newImage } : i))
      );
      
      const response = await syncUpdate(id, 'image', newImage, () => {
        setImages((prev) =>
          prev.map((i) => (i.id === parseInt(id) ? { ...i, ...selectedObject } : i))
        );
      });
      
      if (!response.success) {
        iAmBusy(`Не удалось обновить изображение: ${response.error}`);
      }
    };
    
    img.onerror = () => {
      iAmBusy('Не удалось загрузить изображение по указанной ссылке');
    };
  };

  const handleZIndexChange = async (e) => {
    const newZIndex = parseInt(e.target.value) || 0;
    
    const updateStateAndSync = async (state, setState, objType) => {
      setState((prev) =>
        prev.map((item) => (item.id === parseInt(id) ? { ...item, zIndex: newZIndex } : item))
      );
      
      const response = await syncUpdate(id, objType, { zIndex: newZIndex }, () => {
        setState((prev) =>
          prev.map((item) => (item.id === parseInt(id) ? { ...item, zIndex: selectedObject.zIndex } : item))
        );
      });
      
      if (!response.success) {
        alert(`Не удалось обновить Z-индекс: ${response.error}`);
      }
    };

    if (type === 'line') {
      await updateStateAndSync(lines, setLines, 'line');
    } else if (type === 'text') {
      await updateStateAndSync(texts, setTexts, 'text');
    } else if (type === 'image') {
      await updateStateAndSync(images, setImages, 'image');
    }
  };


  return (
    <div className="p-3" style={{ background: '#f8f9fa', zIndex: 10 }}>
      <h5>Свойства объекта</h5>
      <Form onSubmit={(e) => e.preventDefault()}>
        <InputGroup className="mb-3">
          <InputGroup.Text>Z-индекс</InputGroup.Text>
          <FormControl
            value={selectedObject.zIndex || 0}
            type="number"
            onChange={handleZIndexChange}
            placeholder="Позиция по оси Z"
          />
        </InputGroup>

        {type === 'text' && (
          <>
            <InputGroup className="mb-3">
              <InputGroup.Text>Текст</InputGroup.Text>
              <FormControl
                value={selectedObject.text}
                onChange={handleTextChange}
                placeholder="Введите текст"
              />
            </InputGroup>
            <InputGroup className="mb-3">
              <InputGroup.Text>Цвет текста</InputGroup.Text>
              <FormControl
                type="color"
                value={selectedObject.fill}
                onChange={handleColorChange}
                style={{ width: '50px' }}
              />
            </InputGroup>
          </>
        )}

        {type === 'line' && (
          <InputGroup className="mb-3">
            <InputGroup.Text>Цвет линии</InputGroup.Text>
            <FormControl
              type="color"
              value={selectedObject.color}
              onChange={handleColorChange}
              style={{ width: '50px' }}
            />
          </InputGroup>
        )}

        {type === 'image' && (
          <>
            <InputGroup className="mb-3">
              <FormControl
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                placeholder="Загрузить изображение"
              />
            </InputGroup>
            <InputGroup className="mb-3">
              <FormControl
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Ссылка на изображение"
              />
              <Button 
                variant="outline-secondary" 
                onClick={handleImageUrlChange}
              >
                Обновить
              </Button>
            </InputGroup>
          </>
        )}
      </Form>
    </div>
  );
};

export default PropertiesPanel;