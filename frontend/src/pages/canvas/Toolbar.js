import { useContext } from 'react';
import { WebSocketContext } from '../../providers/WebSocketProvider';
import TextElement from './elements/TextElement';
import ImageElement from './elements/ImageElement';

const Toolbar = ({ tool, setTool, color, setColor, setTexts, setImages, scale, setScale, setStagePos }) => {
  const { syncUpdate } = useContext(WebSocketContext);

  const addText = () => {
    const newText = new TextElement(Date.now(), syncUpdate, {
      x: 50,
      y: 50,
      text: 'New Text',
      fontSize: 20,
      fill: color,
      zIndex: 0
    });
    setTexts((prev) => [...prev, newText]);
    syncUpdate(newText.id, 'text', newText.properties);
  };

  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const newImage = new ImageElement(Date.now(), syncUpdate, {
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          url: reader.result,
          zIndex: 0
        });
        setImages((prev) => [...prev, newImage]);
        syncUpdate(newImage.id, 'image', newImage.properties);
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', padding: '8px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
      <button
        style={{ padding: '4px 8px', background: tool === 'select' ? '#007bff' : '#fff', color: tool === 'select' ? '#fff' : '#000', border: '1px solid #007bff' }}
        onClick={() => setTool('select')}
      >
        ✥
      </button>
      <button
        style={{ padding: '4px 8px', background: tool === 'pen' ? '#007bff' : '#fff', color: tool === 'pen' ? '#fff' : '#000', border: '1px solid #007bff' }}
        onClick={() => setTool('pen')}
      >
        ✏️
      </button>
      <button style={{ padding: '4px 8px', border: '1px solid #28a745' }} onClick={() => { setTool('select'); addText(); }}>
        🔤
      </button>
      <input type="file" accept="image/*" onChange={addImage} style={{ display: 'none' }} id="image-upload" />
      <button style={{ padding: '4px 8px', border: '1px solid #28a745' }} onClick={() => { setTool('select'); document.getElementById('image-upload').click(); }}>
        🖼️
      </button>
      <button style={{ padding: '4px 8px', border: '1px solid #6c757d' }} onClick={() => setScale((p) => Math.max(p - 0.1, 0.1))}>
        ➖
      </button>
      <button style={{ padding: '4px 8px', border: '1px solid #6c757d' }} onClick={() => { setScale(1); setStagePos({ x: 0, y: 0 }); }}>
        {Math.round(scale * 100)}%
      </button>
      <button style={{ padding: '4px 8px', border: '1px solid #6c757d' }} onClick={() => setScale((p) => Math.min(p + 0.1, 4))}>
        ➕
      </button>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '40px', border: 'none' }} />
    </div>
  );
};

export default Toolbar;