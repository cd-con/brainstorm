import React, { useContext } from 'react';
import { Form, FormControl, InputGroup } from 'react-bootstrap';
import { WebSocketContext } from '../../providers/room/WebSocketProvider.js';
import { iAmBusy } from '../../utility/utils';

const PropertiesPanel = ({ selectedId, lines, texts, images, setLines, setTexts, setImages, color, setColor }) => {
  const { syncUpdate, _a, _b, uploadImage } = useContext(WebSocketContext);

  if (!selectedId) {
    return <div className="p-2" style={{ background: '#f8f9fa' }}>Объект не выбран</div>;
  }

  const [type, id] = selectedId.split('-');
  let selectedObject = null;

  if (type === 'line') {
    selectedObject = lines.find((line) => line.id === parseInt(id));
  } else if (type === 'text') {
    selectedObject = texts.find((text) => text.id === parseInt(id));
  } else if (type === 'image') {
    selectedObject = images.find((img) => img.id === parseInt(id));
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
        iAmBusy(`Failed to update text: ${response.error}`);
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
        iAmBusy(`Failed to change color: ${response.error}`);
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
        iAmBusy(`Failed to change color: ${response.error}`);
      }
    }
  };

  const handleImageChange = async (e) => {
    if (type !== 'image') return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = async () => {
        const newImage = { image: img, width: 100, height: 100 };
        setImages((prev) =>
          prev.map((i) => (i.id === parseInt(id) ? { ...i, ...newImage } : i))
        );
        const response = await syncUpdate(id, 'image', newImage, () => {
          setImages((prev) =>
            prev.map((i) => (i.id === parseInt(id) ? { ...i, ...selectedObject } : i))
          );
        });
        if (response.success) {
          uploadImage(id, reader.result);
        } else {
          iAmBusy(`Failed to update image: ${response.error}`);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleZIndexChange = async (e) => {
    const newZIndex = parseInt(e.target.value) || 0;
    if (type === 'line') {
      setLines((prev) =>
        prev.map((l) => (l.id === parseInt(id) ? { ...l, zIndex: newZIndex } : l))
      );
      const response = await syncUpdate(id, 'line', { zIndex: newZIndex }, () => {
        setLines((prev) =>
          prev.map((l) => (l.id === parseInt(id) ? { ...l, zIndex: selectedObject.zIndex } : l))
        );
      });
      if (!response.success) {
        alert(`Failed to update zIndex: ${response.error}`);
      }
    } else if (type === 'text') {
      setTexts((prev) =>
        prev.map((t) => (t.id === parseInt(id) ? { ...t, zIndex: newZIndex } : t))
      );
      const response = await syncUpdate(id, 'text', { zIndex: newZIndex }, () => {
        setTexts((prev) =>
          prev.map((t) => (t.id === parseInt(id) ? { ...t, zIndex: selectedObject.zIndex } : t))
        );
      });
      if (!response.success) {
        alert(`Failed to update zIndex: ${response.error}`);
      }
    } else if (type === 'image') {
      setImages((prev) =>
        prev.map((i) => (i.id === parseInt(id) ? { ...i, zIndex: newZIndex } : i))
      );
      const response = await syncUpdate(id, 'image', { zIndex: newZIndex }, () => {
        setImages((prev) =>
          prev.map((i) => (i.id === parseInt(id) ? { ...i, zIndex: selectedObject.zIndex } : i))
        );
      });
      if (!response.success) {
        alert(`Failed to update zIndex: ${response.error}`);
      }
    }
  };

  return (
    <div style={{ background: '#f8f9fa', zIndex: 10 }}>
      <h6>Свойства</h6>
      {selectedObject && (
        <Form>
          <InputGroup className="mb-2">
            <InputGroup.Text>Z-индекс</InputGroup.Text>
            <FormControl
              value={selectedObject.zIndex || 0}
              type="number"
              onChange={handleZIndexChange}
              placeholder="Позиция по оси Z"
              disabled={!selectedId}
            />
          </InputGroup>
          {type === 'text' && (
            <InputGroup className="mb-2">
              <InputGroup.Text>Text</InputGroup.Text>
              <FormControl
                value={selectedObject.text}
                onChange={handleTextChange}
                placeholder="Enter text"
                disabled={!selectedId}
              />
            </InputGroup>
          )}
          {(type === 'text' || type === 'line') && (
            <InputGroup className="mb-2">
              <InputGroup.Text>Цвет</InputGroup.Text>
              <FormControl
                type="color"
                value={type === 'text' ? selectedObject.fill : selectedObject.color}
                onChange={handleColorChange}
                style={{ width: '50px' }}
                disabled={!selectedId}
              />
            </InputGroup>
          )}
          {type === 'image' && (
            <InputGroup className="mb-2">
              <InputGroup.Text>Источник</InputGroup.Text>
              <FormControl
                size="sm"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={!selectedId}
              />
            </InputGroup>
          )}
        </Form>
      )}
    </div>
  );
};

export default PropertiesPanel;