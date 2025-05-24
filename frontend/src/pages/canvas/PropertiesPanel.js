import { useContext, useState } from 'react';
import { WebSocketContext } from '../../providers/WebSocketProvider';

const PropertiesPanel = ({ selectedId, lines, texts, images, setLines, setTexts, setImages, color, setColor }) => {
  const { syncUpdate } = useContext(WebSocketContext);
  const [imgUrl, setImgUrl] = useState('');
  const [textInput, setTextInput] = useState('');

  if (!selectedId) return <div style={{ padding: '16px', background: '#f8f9fa' }}>Select object</div>;

  const [type, id] = selectedId.split('-');
  const obj = type === 'line' ? lines.find((l) => l.id == id) : type === 'text' ? texts.find((t) => t.id == id) : images.find((i) => i.id == id);
  if (!obj) return <div style={{ padding: '16px', background: '#f8f9fa' }}>No object selected</div>;

  const handleTextChange = (e) => {
    const text = e.target.value;
    setTextInput(text);
    setTexts((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      if (index !== -1) {
        prev[index].properties = { ...prev[index].properties, text };
        return [...prev];
      }
      return prev;
    });
  };

  const handleTextBlur = async () => {
    if (type !== 'text') return;
    await syncUpdate(id, type, { text: textInput });
  };

  const updateColor = async (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    const prop = type === 'text' ? 'fill' : 'color';
    const setState = type === 'text' ? setTexts : setLines;
    setState((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index !== -1) {
        prev[index].properties = { ...prev[index].properties, [prop]: newColor };
        return [...prev];
      }
      return prev;
    });
    await syncUpdate(id, type, { [prop]: newColor });
  };

  const updateImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = async () => {
        setImages((prev) => {
          const index = prev.findIndex((i) => i.id === id);
          if (index !== -1) {
            prev[index].properties = { ...prev[index].properties, url: reader.result, width: img.width, height: img.height };
            return [...prev];
          }
          return prev;
        });
        await syncUpdate(id, type, { url: reader.result, width: img.width, height: img.height });
      };
    };
    reader.readAsDataURL(file);
  };

  const updateImageUrl = async () => {
    if (!imgUrl) return;
    const img = new Image();
    img.src = imgUrl;
    img.onload = async () => {
      setImages((prev) => {
        const index = prev.findIndex((i) => i.id === id);
        if (index !== -1) {
          prev[index].properties = { ...prev[index].properties, url: imgUrl, width: img.width, height: img.height };
          return [...prev];
        }
        return prev;
      });
      await syncUpdate(id, type, { url: imgUrl, width: img.width, height: img.height });
    };
  };

  const updateZIndex = async (e) => {
    const zIndex = +e.target.value || 0;
    const setState = type === 'line' ? setLines : type === 'text' ? setTexts : setImages;
    setState((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index !== -1) {
        prev[index].properties = { ...prev[index].properties, zIndex };
        return [...prev];
      }
      return prev;
    });
    await syncUpdate(id, type, { zIndex });
  };

  return (
    <div style={{ padding: '16px', background: '#f8f9fa' }}>
      <h5>Object Properties</h5>
      <div style={{ marginBottom: '8px' }}>
        <label>Z-index: </label>
        <input type="number" value={obj.properties.zIndex || 0} onChange={updateZIndex} style={{ width: '100%' }} />
      </div>
      {type === 'text' && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <label>Text: </label>
            <input
              type="text"
              value={textInput || obj.properties.text}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Text Color: </label>
            <input type="color" value={obj.properties.fill} onChange={updateColor} style={{ width: '50px' }} />
          </div>
        </>
      )}
      {type === 'line' && (
        <div style={{ marginBottom: '8px' }}>
          <label>Line Color: </label>
          <input type="color" value={obj.properties.color} onChange={updateColor} style={{ width: '50px' }} />
        </div>
      )}
      {type === 'image' && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <input type="file" accept="image/*" onChange={updateImage} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
            <input type="text" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="Image URL" style={{ width: '100%' }} />
            <button onClick={updateImageUrl}>Update</button>
          </div>
        </>
      )}
    </div>
  );
};

export default PropertiesPanel;